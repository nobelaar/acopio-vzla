import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ComentarioWithUtil, PostComentario } from '@/types/db'

interface CrearComentarioInput {
  postId: string
  contenido: string
}

export function useCrearComentario() {
  const qc = useQueryClient()
  return useMutation<PostComentario, Error, CrearComentarioInput>({
    mutationFn: async ({ postId, contenido }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Debes iniciar sesion para comentar')
      const { data, error } = await supabase
        .from('post_comentario')
        .insert({ post_id: postId, contenido, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data as PostComentario
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['comentarios', variables.postId] })
    },
  })
}

export function useToggleComentarioUtil() {
  const qc = useQueryClient()
  return useMutation<void, Error, { comentarioId: string; postId: string; active: boolean }, { prev: ComentarioWithUtil[] | undefined }>({
    mutationFn: async ({ comentarioId, active }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Debes iniciar sesion')
      if (active) {
        const { error } = await supabase
          .from('comentario_util')
          .delete()
          .eq('comentario_id', comentarioId)
          .eq('user_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('comentario_util')
          .upsert({ comentario_id: comentarioId, user_id: user.id }, { onConflict: 'comentario_id, user_id' })
        if (error) throw error
      }
    },
    onMutate: async ({ comentarioId, postId, active }) => {
      await qc.cancelQueries({ queryKey: ['comentarios', postId] })
      const prev = qc.getQueryData<ComentarioWithUtil[]>(['comentarios', postId])
      qc.setQueryData<ComentarioWithUtil[]>(['comentarios', postId], (old) =>
        (old ?? []).map((c) =>
          c.id === comentarioId
            ? {
                ...c,
                user_has_util: !active,
                util_count: active ? Math.max(0, c.util_count - 1) : c.util_count + 1,
              }
            : c
        )
      )
      return { prev }
    },
    onError: (_err, variables, context) => {
      if (context?.prev) {
        qc.setQueryData(['comentarios', variables.postId], context.prev)
      }
    },
  })
}
