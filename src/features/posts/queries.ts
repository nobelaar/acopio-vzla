import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Post, PostWithUtil } from '@/types/db'

const PAGE_SIZE = 20

function toPostWithUtil(post: Post): PostWithUtil {
  return { ...post, util_count: 0, user_has_util: false }
}

export function usePostsCentro(centroId: string) {
  return useQuery<PostWithUtil[]>({
    queryKey: ['posts', centroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('centro_id', centroId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map(toPostWithUtil) as PostWithUtil[]
    },
    enabled: !!centroId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

export function useInfinitePostsFeed() {
  return useInfiniteQuery<PostWithUtil[]>({
    queryKey: ['posts', 'feed'],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | undefined
      let query = supabase
        .from('posts')
        .select('*')
        .not('centro_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (cursor) {
        query = query.lt('created_at', cursor)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []).map(toPostWithUtil) as PostWithUtil[]
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined
      return lastPage[lastPage.length - 1]?.created_at
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

export function useInfinitePostsComunidad() {
  return useInfiniteQuery<PostWithUtil[]>({
    queryKey: ['posts', 'comunidad'],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | undefined
      let query = supabase
        .from('posts')
        .select('*')
        .is('centro_id', null)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (cursor) {
        query = query.lt('created_at', cursor)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []).map(toPostWithUtil) as PostWithUtil[]
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined
      return lastPage[lastPage.length - 1]?.created_at
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
