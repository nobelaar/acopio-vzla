import { useCallback, useState } from 'react'
import { useInfinitePostsComunidad } from '@/features/posts/queries'
import { useCrearPost } from '@/features/posts/mutations'
import { useSession } from '@/features/auth/session'
import { PostCard } from '@/components/post/PostCard'
import { PostSkeletonList } from '@/components/post/PostSkeleton'
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'
import type { PostWithUtil } from '@/types/db'

export function ComunidadPage() {
  const { user } = useSession()
  const [contenido, setContenido] = useState('')
  const crearPost = useCrearPost()

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useInfinitePostsComunidad()

  const posts: PostWithUtil[] = data?.pages.flat() ?? []

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const sentinelRef = useIntersectionObserver(loadMore, hasNextPage ?? false)

  function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!contenido.trim()) return
    crearPost.mutate(
      { contenido: contenido.trim(), necesidades: [] },
      { onSuccess: () => setContenido('') }
    )
  }

  if (isLoading) {
    return <div className="py-4"><PostSkeletonList count={5} /></div>
  }

  return (
    <div className="py-2 pb-14">
      {user ? (
        <form onSubmit={handlePost} className="border-b border-border px-4 py-3">
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            rows={2}
            placeholder="Que queres compartir con la comunidad?"
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!contenido.trim() || crearPost.isPending}
              size="sm"
              className="rounded-full px-5"
            >
              {crearPost.isPending ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </form>
      ) : (
        <p className="border-b border-border px-4 py-3 text-[13px] text-muted-foreground">
          Inicia sesion para publicar en la comunidad
        </p>
      )}

      <div className="border-b border-border px-4 py-2">
        <span className="text-[13px] font-semibold text-muted-foreground">Comunidad</span>
      </div>

      {isError && (
        <div className="flex flex-col items-center gap-3 py-16">
          <p className="text-sm text-muted-foreground">No se pudieron cargar las publicaciones.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
        </div>
      )}

      {!isError && posts.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Users size={48} className="text-muted-foreground" />
          <p className="text-center text-sm text-muted-foreground">
            Aun no hay publicaciones en la comunidad.
            <br />
            Se el primero en compartir algo.
          </p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} showCentro={false} />
      ))}

      <div ref={sentinelRef} className="py-4 text-center">
        {isFetchingNextPage && <span className="text-sm text-muted-foreground">Cargando mas...</span>}
      </div>
    </div>
  )
}
