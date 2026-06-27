import { http, HttpResponse } from 'msw'
import type { CentroAcopio, Post, CentroCercano } from '@/types/db'
import {
  fixtureCentro,
  fixtureCentro2,
  fixturePost,
  fixturePost2,
  fixtureSession,
} from './fixtures'

const BASE = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://acopio-test.supabase.co'

interface Store {
  centros: CentroAcopio[]
  posts: Post[]
}

let store: Store = makeStore()
let requireEmailConfirm = false

export function resetStore(): void {
  store = makeStore()
  requireEmailConfirm = false
}

export function setRequireEmailConfirm(value: boolean): void {
  requireEmailConfirm = value
}

function makeStore(): Store {
  return {
    centros: [structuredClone(fixtureCentro), structuredClone(fixtureCentro2)],
    posts: [structuredClone(fixturePost), structuredClone(fixturePost2)],
  }
}

function parseQuery(url: URL) {
  const filters: Record<string, string> = {}
  const orderRaw = url.searchParams.get('order')
  const select = url.searchParams.get('select') ?? '*'
  for (const [key, value] of url.searchParams.entries()) {
    if (key === 'select' || key === 'order' || key === 'limit' || key === 'offset') continue
    const m = value.match(/^eq\.(.*)$/)
    if (m) filters[key] = m[1]
  }
  let order: { column: string; ascending: boolean } | null = null
  if (orderRaw) {
    const [column, dir] = orderRaw.split('.')
    order = { column, ascending: dir !== 'desc' }
  }
  return { filters, order, select }
}

function applyFilters(rows: Record<string, unknown>[], filters: Record<string, string>) {
  return rows.filter((r) => Object.entries(filters).every(([k, v]) => String(r[k]) === v))
}

function applyOrder<T>(rows: T[], orderRaw: ReturnType<typeof parseQuery>['order'], col: (r: T) => string) {
  if (!orderRaw) return rows
  const sorted = [...rows].sort((a, b) => col(a).localeCompare(col(b)))
  return orderRaw.ascending ? sorted : sorted.reverse()
}

function isObjectAccept(request: Request): boolean {
  return (request.headers.get('accept') ?? '').includes('vnd.pgrst.object')
}

function responseObjectOrError(
  rows: Record<string, unknown>[],
  request: Request
): Response {
  if (!isObjectAccept(request)) return HttpResponse.json(rows)
  if (rows.length === 1) return HttpResponse.json(rows[0])
  return HttpResponse.json(
    {
      code: 'PGRST116',
      message: 'JSON object requested, multiple (or no) rows returned',
      details: `Results contain ${rows.length} rows, application/vnd.pgrst.object+json requires 1 row`,
      hint: null,
    },
    { status: 406, statusText: 'Not Acceptable' }
  )
}

const restHandlers = [
  http.post(`${BASE}/rest/v1/rpc/centros_cercanos`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { user_lat?: number; user_lng?: number }
    const result: CentroCercano[] = [
      {
        id: store.centros[0].id,
        nombre: store.centros[0].nombre,
        descripcion: store.centros[0].descripcion,
        ciudad: store.centros[0].ciudad,
        direccion: store.centros[0].direccion,
        foto_portada: store.centros[0].foto_portada,
        contacto: store.centros[0].contacto,
        distancia_km: body.user_lat != null && body.user_lng != null ? 5.2 : 0,
        ultimo_post_contenido: store.posts.find((p) => p.centro_id === store.centros[0].id)?.contenido ?? null,
        ultimo_post_created_at:
          store.posts.find((p) => p.centro_id === store.centros[0].id)?.created_at ?? null,
      },
    ]
    return HttpResponse.json(result)
  }),

  http.get(`${BASE}/rest/v1/centros_acopio`, ({ request }) => {
    const url = new URL(request.url)
    const { filters, order, select } = parseQuery(url)
    let rows = applyFilters(store.centros as unknown as Record<string, unknown>[], filters) as unknown as CentroAcopio[]
    if (order) rows = applyOrder(rows as CentroAcopio[], order, (r) => String(r[order!.column as keyof CentroAcopio])) as CentroAcopio[]
    const wantsPosts = /posts\s*\(/.test(select)
    const out = rows.map((c) => {
      const base: Record<string, unknown> = { ...c }
      if (wantsPosts) {
        const posts = store.posts
          .filter((p) => p.centro_id === c.id)
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .map((p) => ({ contenido: p.contenido, created_at: p.created_at }))
        base.posts = posts
      }
      return base
    })
    return responseObjectOrError(out as unknown as Record<string, unknown>[], request)
  }),

  http.post(`${BASE}/rest/v1/centros_acopio`, async ({ request }) => {
    const body = (await request.json()) as Partial<CentroAcopio> | Partial<CentroAcopio>[]
    const payload = Array.isArray(body) ? body[0] : body
    const created: CentroAcopio = {
      id: crypto.randomUUID(),
      coordinador_id: payload.coordinador_id ?? '00000000-0000-0000-0000-0000000000aa',
      nombre: payload.nombre ?? '',
      descripcion: payload.descripcion ?? null,
      direccion: payload.direccion ?? '',
      ciudad: payload.ciudad ?? '',
      contacto: payload.contacto ?? null,
      lat: payload.lat ?? 0,
      lng: payload.lng ?? 0,
      foto_portada: payload.foto_portada ?? null,
      created_at: new Date().toISOString(),
    }
    store.centros.push(created)
    return HttpResponse.json(isObjectAccept(request) ? created : [created])
  }),

  http.patch(`${BASE}/rest/v1/centros_acopio`, async ({ request }) => {
    const url = new URL(request.url)
    const { filters } = parseQuery(url)
    const body = (await request.json()) as Partial<CentroAcopio>
    const idx = store.centros.findIndex((c) => String(c.id) === filters.id)
    if (idx >= 0) store.centros[idx] = { ...store.centros[idx], ...body }
    const updated = idx >= 0 ? store.centros[idx] : { ...body, id: filters.id } as CentroAcopio
    return responseObjectOrError([updated] as unknown as Record<string, unknown>[], request)
  }),

  http.get(`${BASE}/rest/v1/posts`, ({ request }) => {
    const url = new URL(request.url)
    const { filters, order } = parseQuery(url)
    let rows = applyFilters(store.posts as unknown as Record<string, unknown>[], filters) as unknown as Post[]
    if (order) rows = applyOrder(rows, order, (r) => String(r[order!.column as keyof Post])) as Post[]
    return responseObjectOrError(rows as unknown as Record<string, unknown>[], request)
  }),

  http.post(`${BASE}/rest/v1/posts`, async ({ request }) => {
    const body = (await request.json()) as Partial<Post> | Partial<Post>[]
    const payload = Array.isArray(body) ? body[0] : body
    const created: Post = {
      id: crypto.randomUUID(),
      centro_id: payload.centro_id ?? '',
      contenido: payload.contenido ?? '',
      foto_url: payload.foto_url ?? null,
      necesidades: payload.necesidades ?? [],
      created_at: new Date().toISOString(),
    }
    store.posts.push(created)
    return HttpResponse.json(isObjectAccept(request) ? created : [created])
  }),
]

const authHandlers = [
  http.post(`${BASE}/auth/v1/token`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string }
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { code: 'invalid_credentials', error_description: 'Email y contraseña requeridos' },
        { status: 400 }
      )
    }
    if (requireEmailConfirm) {
      return HttpResponse.json(
        {
          code: 'email_not_confirmed',
          message: 'Email not confirmed',
          error_description: 'Email not confirmed',
        },
        { status: 400 }
      )
    }
    return HttpResponse.json({ ...fixtureSession, user: { ...fixtureSession.user, email: body.email } })
  }),
  http.post(`${BASE}/auth/v1/signup`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string }
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { code: 'weak_password', error_description: 'Credenciales inválidas' },
        { status: 400 }
      )
    }
    if (requireEmailConfirm) {
      return HttpResponse.json({
        user: { ...fixtureSession.user, email: body.email },
        session: null,
      })
    }
    return HttpResponse.json({
      ...fixtureSession,
      refresh_token: 'signup-refresh',
      user: { ...fixtureSession.user, email: body.email },
    })
  }),
  http.post(`${BASE}/auth/v1/resend`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string
      type?: string
    }
    if (!body.email || (body.type && body.type !== 'signup')) {
      return HttpResponse.json(
        { code: 'invalid_request', error_description: 'Email requerido' },
        { status: 400 }
      )
    }
    return HttpResponse.json({ message: 'Confirmation email resent' })
  }),
]

const storageHandlers = [
  http.post(`${BASE}/storage/v1/object/centros-fotos/*`, () =>
    HttpResponse.json({
      path: `centros-fotos/${crypto.randomUUID()}.jpg`,
      fullPath: `centros-fotos/${crypto.randomUUID()}.jpg`,
      id: crypto.randomUUID(),
    })
  ),
  http.put(`${BASE}/storage/v1/object/centros-fotos/*`, () =>
    HttpResponse.json({ Key: 'placeholder', Id: crypto.randomUUID() })
  ),
]

export const handlers = [...restHandlers, ...authHandlers, ...storageHandlers]