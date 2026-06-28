import type { CentroAcopio, Post, CentroResumen, PostUtil, PostComentario, ComentarioUtil, Notificacion } from '@/types/db'

export const fixtureCentro: CentroAcopio = {
  id: '00000000-0000-0000-0000-000000000001',
  coordinador_id: '00000000-0000-0000-0000-0000000000aa',
  nombre: 'Centro La Candelaria',
  descripcion: 'Iglesia habilitada como centro de acopio.',
  direccion: 'Av. Urdaneta, Caracas',
  ciudad: 'Caracas',
  contacto: '@centrolacandelaria',
  foto_portada: null,
  created_at: '2025-01-10T12:00:00.000Z',
}

export const fixtureCentro2: CentroAcopio = {
  id: '00000000-0000-0000-0000-000000000002',
  coordinador_id: '00000000-0000-0000-0000-0000000000bb',
  nombre: 'Centro Valencia Norte',
  descripcion: 'Grupo scout.',
  direccion: 'Av. Bolívar, Valencia',
  ciudad: 'Valencia',
  contacto: '0414-0000000',
  foto_portada: 'https://acopio-test.supabase.co/storage/v1/object/public/centros-fotos/test.jpg',
  created_at: '2025-01-11T09:00:00.000Z',
}

export const fixturePost: Post = {
  id: '11111111-0000-0000-0000-000000000001',
  centro_id: fixtureCentro.id,
  contenido: 'Urgente: necesitamos agua y pañales.',
  foto_url: null,
  necesidades: ['Agua', 'Pañales'],
  created_at: '2025-01-12T10:00:00.000Z',
}

export const fixturePost2: Post = {
  id: '11111111-0000-0000-0000-000000000002',
  centro_id: fixtureCentro.id,
  contenido: 'Cubrimos agua, gracias. Ahora necesitamos combustible.',
  foto_url: null,
  necesidades: ['Combustible'],
  created_at: '2025-01-12T12:00:00.000Z',
}

export const fixtureCentroResumen: CentroResumen = {
  id: fixtureCentro.id,
  nombre: fixtureCentro.nombre,
  descripcion: fixtureCentro.descripcion,
  ciudad: fixtureCentro.ciudad,
  direccion: fixtureCentro.direccion,
  foto_portada: fixtureCentro.foto_portada,
  contacto: fixtureCentro.contacto,
  ultimo_post_contenido: fixturePost2.contenido,
  ultimo_post_created_at: fixturePost2.created_at,
}

export const fixtureUser = {
  id: '00000000-0000-0000-0000-0000000000aa',
  email: 'coordinador@example.com',
}

export const fixtureSession = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  user: fixtureUser,
}

export const fixturePostUtil: PostUtil = {
  id: 'uuuuuuuu-0000-0000-0000-000000000001',
  post_id: fixturePost.id,
  user_id: fixtureUser.id,
  created_at: '2025-01-12T12:00:00.000Z',
}

export const fixtureComentario: PostComentario = {
  id: 'cccccccc-0000-0000-0000-000000000001',
  post_id: fixturePost.id,
  user_id: fixtureUser.id,
  contenido: 'Gracias por la info, voy a llevar agua manana.',
  created_at: '2025-01-12T13:00:00.000Z',
}

export const fixtureComentarioUtil: ComentarioUtil = {
  id: 'uuuuuuuu-0000-0000-0000-000000000002',
  comentario_id: 'cccccccc-0000-0000-0000-000000000001',
  user_id: fixtureUser.id,
  created_at: '2025-01-12T13:05:00.000Z',
}

export const fixtureNotificacion: Notificacion = {
  id: 'nnnnnnnn-0000-0000-0000-000000000001',
  user_id: fixtureUser.id,
  post_id: fixturePost.id,
  centro_id: fixtureCentro.id,
  tipo: 'comentario',
  leida: false,
  created_at: '2025-01-12T14:00:00.000Z',
}
