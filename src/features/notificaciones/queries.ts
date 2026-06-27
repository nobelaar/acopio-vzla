import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Notificacion } from '@/types/db'

export function useNotificaciones(userId: string | undefined) {
  return useQuery<Notificacion[]>({
    queryKey: ['notificaciones', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notificacion')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return (data ?? []) as Notificacion[]
    },
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useNotificacionesNoLeidas(userId: string | undefined) {
  return useQuery<number>({
    queryKey: ['notificaciones', userId, 'no-leidas'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notificacion')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .eq('leida', false)
      if (error) throw error
      return count ?? 0
    },
    enabled: !!userId,
    staleTime: 10_000,
  })
}

export function useMarcarTodasLeidas() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (userId) => {
      const { error } = await supabase
        .from('notificacion')
        .update({ leida: true })
        .eq('user_id', userId)
        .eq('leida', false)
      if (error) throw error
    },
    onSuccess: (_data, userId) => {
      qc.invalidateQueries({ queryKey: ['notificaciones', userId] })
    },
  })
}
