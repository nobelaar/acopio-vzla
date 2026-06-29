import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Anuncio, AnuncioWithUtil, AnuncioTipo } from '@/types/db'

export interface CrearAnuncioInput {
  tipo: AnuncioTipo
  titulo: string
  descripcion: string
  ciudad: string
  zona?: string | null
  contacto: string
  centro_id?: string | null
  user_id?: string | null
  capacidad?: number | null
  duracion?: string | null
  mascotas?: boolean
  accesibilidad?: boolean
  destino?: string | null
  tipo_carga?: 'personas' | 'insumos' | 'ambos' | null
  tipo_vehiculo?: 'carro' | 'camioneta' | 'camion' | 'moto' | null
}

export function useCrearAnuncio() {
  const qc = useQueryClient()
  return useMutation<Anuncio, Error, CrearAnuncioInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase
        .from('anuncio')
        .insert({
          tipo: input.tipo,
          titulo: input.titulo,
          descripcion: input.descripcion,
          ciudad: input.ciudad,
          zona: input.zona ?? null,
          contacto: input.contacto,
          centro_id: input.centro_id ?? null,
          user_id: input.user_id ?? null,
          capacidad: input.capacidad ?? null,
          duracion: input.duracion ?? null,
          mascotas: input.mascotas ?? false,
          accesibilidad: input.accesibilidad ?? false,
          destino: input.destino ?? null,
          tipo_carga: input.tipo_carga ?? null,
          tipo_vehiculo: input.tipo_vehiculo ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as Anuncio
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['anuncios', 'feed'] })
      if (variables.centro_id) {
        qc.invalidateQueries({ queryKey: ['anuncios', 'centro', variables.centro_id] })
      }
    },
  })
}

export interface ToggleAnuncioUtilInput {
  anuncioId: string
  active: boolean
}

export function useToggleAnuncioUtil() {
  const qc = useQueryClient()
  return useMutation<void, Error, ToggleAnuncioUtilInput>({
    mutationFn: async ({ anuncioId, active }) => {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId) throw new Error('Debes iniciar sesion para marcar como util')

      if (active) {
        const { error } = await supabase
          .from('anuncio_util')
          .delete()
          .eq('anuncio_id', anuncioId)
          .eq('user_id', userId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('anuncio_util')
          .upsert({ anuncio_id: anuncioId, user_id: userId }, { onConflict: 'anuncio_id, user_id' })
        if (error) throw error
      }
    },
    onMutate: async ({ anuncioId, active }) => {
      await qc.cancelQueries({ queryKey: ['anuncios', 'feed'] })
      qc.setQueriesData<{ pages: AnuncioWithUtil[][] }>(
        { queryKey: ['anuncios', 'feed'] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((a) =>
                a.id === anuncioId
                  ? {
                      ...a,
                      user_has_util: !active,
                      util_count: active ? Math.max(0, a.util_count - 1) : a.util_count + 1,
                    }
                  : a
              )
            ),
          }
        }
      )
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ['anuncios', 'feed'] })
    },
  })
}
