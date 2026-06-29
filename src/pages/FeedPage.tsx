import { useCallback, useMemo, useState } from 'react'
import { useInfinitePostsFeed } from '@/features/posts/queries'
import { useInfiniteAnuncios } from '@/features/anuncios/queries'
import { useCentros } from '@/features/centros/queries'
import { PostCard } from '@/components/post/PostCard'
import { AnuncioCard } from '@/components/anuncio/AnuncioCard'
import { PostSkeletonList } from '@/components/post/PostSkeleton'
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PostWithUtil, AnuncioWithUtil, FeedItem } from '@/types/db'

type Tab = 'todo' | 'acopio' | 'hospedaje' | 'transporte'

function mergeFeed(
  posts: PostWithUtil[],
  anuncios: AnuncioWithUtil[],
  centroMap: Map<string, { nombre: string; ciudad: string }>
): FeedItem[] {
  const items: FeedItem[] = [
    ...anuncios.map((a) => ({
      kind: 'anuncio' as const,
      data: a,
      centroNombre: a.centro_id ? centroMap.get(a.centro_id)?.nombre : undefined,
      centroCiudad: a.centro_id ? centroMap.get(a.centro_id)?.ciudad : undefined,
    })),
    ...posts.map((p) => ({
      kind: 'post' as const,
      data: p,
      centroNombre: p.centro_id ? centroMap.get(p.centro_id)?.nombre : undefined,
      centroCiudad: p.centro_id ? centroMap.get(p.centro_id)?.ciudad : undefined,
    })),
  ]
  items.sort(
    (a, b) =>
      new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
  )
  return items
}

export function FeedPage() {
  const [tab, setTab] = useState<Tab>('todo')
  const showPosts = tab === 'todo' || tab === 'acopio'
  const showAnuncios = tab === 'todo' || tab === 'hospedaje' || tab === 'transporte'

  const postsQuery = useInfinitePostsFeed()
  const anunciosQuery = useInfiniteAnuncios(
    tab === 'hospedaje' ? 'hospedaje' : tab === 'transporte' ? 'transporte' : undefined
  )
  const { data: centros = [] } = useCentros()

  const centroMap = useMemo(() => {
    const map = new Map<string, { nombre: string; ciudad: string }>()
    for (const c of centros) {
      map.set(c.id, { nombre: c.nombre, ciudad: c.ciudad })
    }
    return map
  }, [centros])

  const posts: PostWithUtil[] = postsQuery.data?.pages.flat() ?? []
  const anuncios: AnuncioWithUtil[] = anunciosQuery.data?.pages.flat() ?? []

  const feedItems = useMemo(() => {
    return mergeFeed(
      showPosts ? posts : [],
      showAnuncios ? anuncios : [],
      centroMap
    )
  }, [posts, anuncios, centroMap, showPosts, showAnuncios])

  const isLoading =
    (showPosts ? postsQuery.isLoading : false) ||
    (showAnuncios ? anunciosQuery.isLoading : false)
  const isError =
    (showPosts ? postsQuery.isError : false) ||
    (showAnuncios ? anunciosQuery.isError : false)
  const isFetchingNextPage =
    postsQuery.isFetchingNextPage || anunciosQuery.isFetchingNextPage
  const hasNextPage =
    (showPosts ? postsQuery.hasNextPage : false) ||
    (showAnuncios ? anunciosQuery.hasNextPage : false)

  const loadMore = useCallback(() => {
    if (showPosts && postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) {
      postsQuery.fetchNextPage()
    }
    if (showAnuncios && anunciosQuery.hasNextPage && !anunciosQuery.isFetchingNextPage) {
      anunciosQuery.fetchNextPage()
    }
  }, [showPosts, showAnuncios, postsQuery, anunciosQuery])

  const sentinelRef = useIntersectionObserver(loadMore, !!hasNextPage)

  const refetch = useCallback(() => {
    if (showPosts) postsQuery.refetch()
    if (showAnuncios) anunciosQuery.refetch()
  }, [showPosts, showAnuncios, postsQuery, anunciosQuery])

  return (
    <div className="pt-2 pb-2">
      <div className="sticky top-0 z-10 flex border-b border-border bg-background">
        {(
          [
            ['todo', 'Todo'],
            ['acopio', 'Posts'],
            ['hospedaje', 'Hospedaje'],
            ['transporte', 'Transporte'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 py-3 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-secondary/50',
              tab === key &&
                'text-foreground border-b-2 border-primary font-bold'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="py-4">
          <PostSkeletonList count={5} />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 py-16">
          <p className="text-sm text-muted-foreground">
            No se pudieron cargar las publicaciones.
          </p>
          <Button variant="outline" size="sm" onClick={refetch}>
            Reintentar
          </Button>
        </div>
      )}

      {!isLoading && !isError && feedItems.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Heart size={48} className="text-muted-foreground" />
          <p className="text-center text-sm text-muted-foreground">
            No hay publicaciones todavia.
          </p>
        </div>
      )}

      {!isLoading &&
        !isError &&
        feedItems.map((item) =>
          item.kind === 'post' ? (
            <PostCard
              key={`post-${item.data.id}`}
              post={item.data}
              showCentro
              centroNombre={item.centroNombre ?? 'Centro'}
              centroCiudad={item.centroCiudad ?? ''}
            />
          ) : (
            <AnuncioCard
              key={`anuncio-${item.data.id}`}
              anuncio={item.data}
              showCentro
              centroNombre={item.centroNombre}
              centroCiudad={item.centroCiudad}
            />
          )
        )}

      <div ref={sentinelRef} className="py-4 text-center">
        {isFetchingNextPage ? (
          <span className="text-sm text-muted-foreground">Cargando mas...</span>
        ) : hasNextPage ? (
          <span className="text-sm text-muted-foreground">
            Desliza para ver mas
          </span>
        ) : null}
      </div>
    </div>
  )
}
