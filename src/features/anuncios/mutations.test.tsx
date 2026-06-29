import { describe, expect, it, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { useCrearAnuncio, type CrearAnuncioInput } from './mutations'
import { supabase } from '@/lib/supabase'
import { fixtureUser } from '@/test/mocks'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = makeQueryClient()
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useCrearAnuncio', () => {
  beforeEach(async () => {
    await supabase.auth.signOut()
  })

  it('creates a transporte anuncio with all fields', async () => {
    await supabase.auth.signInWithPassword({
      email: fixtureUser.email,
      password: 'test-password',
    })

    const { result } = renderHook(() => useCrearAnuncio(), { wrapper })

    const input: CrearAnuncioInput = {
      tipo: 'transporte',
      titulo: 'Transporto insumos',
      descripcion: 'Camioneta disponible',
      ciudad: 'Caracas',
      zona: 'El Hatillo',
      contacto: '0412-9999999',
      destino: 'Valencia',
      tipo_carga: 'insumos',
      tipo_vehiculo: 'camioneta',
      capacidad: 200,
      duracion: '3-4 horas',
    }

    result.current.mutate(input)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toMatchObject({
      tipo: 'transporte',
      titulo: 'Transporto insumos',
      destino: 'Valencia',
      tipo_carga: 'insumos',
      tipo_vehiculo: 'camioneta',
      capacidad: 200,
      duracion: '3-4 horas',
    })
  })
})
