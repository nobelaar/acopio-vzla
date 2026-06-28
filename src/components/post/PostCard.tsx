import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { PostWithUtil } from '@/types/db'
import { formatDate } from '@/lib/utils'
import { Heart, Share, MessageCircle } from 'lucide-react'
import { useToggleUtil } from '@/features/posts/mutations'
import { useComentarios } from '@/features/posts/comentarios-queries'
import { useSession } from '@/features/auth/session'
import { ComentarioItem } from './ComentarioItem'
import { ComentarioForm } from './ComentarioForm'
import { addToast } from '@/lib/hooks/useToast'

interface Props {
  post: PostWithUtil
  centroNombre?: string
  centroCiudad?: string
  showCentro?: boolean
}

export const PostCard = memo(function PostCard({ post, centroNombre, centroCiudad, showCentro = false }: Props) {
  const toggleUtil = useToggleUtil()
  const { user } = useSession()
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [showAllComments, setShowAllComments] = useState(false)
  const { data: comentarios = [] } = useComentarios(post.id, true)

  function handleUtil() {
    toggleUtil.mutate(
      { postId: post.id, active: post.user_has_util },
      {
        onError: (err) => {
          addToast(err.message || 'No se pudo registrar', 'error')
        },
      }
    )
  }

  function handleShare() {
    const url = `${window.location.origin}/centro/${post.centro_id}`
    if (navigator.share) {
      navigator.share({ title: 'Publicacion de Acopio', url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).catch(() => {})
    }
  }

  return (
    <article className="border-b border-border px-4 py-3 transition-colors hover:bg-secondary/30 active:bg-secondary/50">
      {showCentro && centroNombre && (
        <Link
          to={`/centro/${post.centro_id}`}
          className="mb-1 flex items-center gap-2"
        >
          <span className="text-[15px] font-bold leading-tight tracking-[-0.3px] text-primary hover:underline">
            {centroNombre}
          </span>
          {centroCiudad && (
            <span className="text-[13px] text-muted-foreground">@{centroCiudad}</span>
          )}
        </Link>
      )}

      <div className="flex items-center justify-between text-[13px] text-muted-foreground">
        <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
      </div>

      {post.foto_url && (
        <img
          src={post.foto_url}
          alt="Foto del post"
          loading="lazy"
          decoding="async"
          className="mt-2 w-full rounded-2xl border border-border object-cover"
        />
      )}

      {post.contenido && (
        <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed">{post.contenido}</p>
      )}

      {post.necesidades.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {post.necesidades.map((n) => (
            <span
              key={n}
              className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {n}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center gap-6">
        <button
          type="button"
          onClick={handleUtil}
          disabled={toggleUtil.isPending}
          className="group flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
        >
          <Heart
            size={18}
            className={post.user_has_util ? 'fill-primary text-primary' : ''}
          />
          <span>{post.util_count}</span>
        </button>
        <button
          type="button"
          onClick={() => setCommentsOpen(!commentsOpen)}
          className="group flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-primary"
        >
          <MessageCircle size={18} />
          {comentarios.length > 0 && <span>{comentarios.length}</span>}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-primary"
        >
          <Share size={18} />
        </button>
      </div>

      {commentsOpen && (
        <div className="mt-2 -mx-4 border-t border-border">
          <ComentarioForm postId={post.id} user={user} />
          {comentarios.length === 0 && (
            <p className="px-4 py-3 text-[13px] text-muted-foreground">
              Se el primero en comentar
            </p>
          )}
          {comentarios
            .slice(0, showAllComments ? undefined : 2)
            .map((c) => (
              <ComentarioItem key={c.id} comentario={c} postId={post.id} />
            ))}
          {!showAllComments && comentarios.length > 2 && (
            <button
              type="button"
              onClick={() => setShowAllComments(true)}
              className="w-full px-4 py-2 text-left text-[13px] text-primary hover:underline"
            >
              Ver los {comentarios.length} comentarios
            </button>
          )}
        </div>
      )}
    </article>
  )
})
