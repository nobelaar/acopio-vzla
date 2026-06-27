import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Post, PostWithUtil } from '@/types/db'

export interface CrearPostInput {
  centro_id?: string
  contenido: string
  foto_url?: string | null
  necesidades?: string[]
}

export function useCrearPost() {
  const qc = useQueryClient()
  return useMutation<Post, Error, CrearPostInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          centro_id: input.centro_id ?? null,
          contenido: input.contenido,
          foto_url: input.foto_url ?? null,
          necesidades: input.necesidades ?? [],
        })
        .select()
        .single()
      if (error) throw error
      return data as Post
    },
    onSuccess: (_data, variables) => {
      if (variables.centro_id) {
        qc.invalidateQueries({ queryKey: ['posts', variables.centro_id] })
      }
      qc.invalidateQueries({ queryKey: ['posts', 'feed'] })
      qc.invalidateQueries({ queryKey: ['posts', 'comunidad'] })
    },
  })
}

export interface ToggleUtilInput {
  postId: string
  active: boolean
}

export function useToggleUtil() {
  const qc = useQueryClient()
  return useMutation<void, Error, ToggleUtilInput>({
    mutationFn: async ({ postId, active }) => {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId) throw new Error('Debes iniciar sesion para marcar como util')

      if (active) {
        const { error } = await supabase
          .from('post_util')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('post_util')
          .insert({ post_id: postId, user_id: userId })
        if (error) throw error
      }
    },
    onMutate: async ({ postId, active }) => {
      await qc.cancelQueries({ queryKey: ['posts', 'feed'] })
      qc.setQueriesData<{ pages: PostWithUtil[][] }>(
        { queryKey: ['posts', 'feed'] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((p) =>
                p.id === postId
                  ? {
                      ...p,
                      user_has_util: !active,
                      util_count: active ? Math.max(0, p.util_count - 1) : p.util_count + 1,
                    }
                  : p
              )
            ),
          }
        }
      )
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ['posts', 'feed'] })
    },
  })
}
