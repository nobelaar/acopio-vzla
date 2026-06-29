import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { AnuncioWithUtil } from '@/types/db'
import { formatDate } from '@/lib/utils'
import { Heart, Share } from 'lucide-react'
import { useToggleAnuncioUtil } from '@/features/anuncios/mutations'
import { ANUNCIO_TIPO_META } from '@/lib/constants'
import { addToast } from '@/lib/hooks/useToast'

interface Props {
  anuncio: AnuncioWithUtil
  centroNombre?: string
  centroCiudad?: string
  showCentro?: boolean
}

export const AnuncioCard = memo(function AnuncioCard({
  anuncio,
  centroNombre,
  centroCiudad,
  showCentro = false,
}: Props) {
  const toggleUtil = useToggleAnuncioUtil()
  const meta = ANUNCIO_TIPO_META[anuncio.tipo]

  function handleUtil() {
    toggleUtil.mutate(
      { anuncioId: anuncio.id, active: anuncio.user_has_util },
      {
        onError: (err) => {
          addToast(err.message || 'No se pudo registrar', 'error')
        },
      }
    )
  }

  function handleShare() {
    const url = `${window.location.origin}`
    if (navigator.share) {
      navigator.share({ title: anuncio.titulo, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).catch(() => {})
    }
  }

  return (
    <article
      className="border-b border-border px-4 py-3 transition-colors hover:bg-secondary/30 active:bg-secondary/50"
      style={{
        borderLeft: `3px solid ${meta.color}`,
        background: `linear-gradient(135deg, ${meta.color}08 0%, transparent 40%)`,
      }}
    >
      <div className="mb-1 flex items-center justify-between">
        {showCentro && centroNombre && anuncio.centro_id && (
          <Link to={`/centro/${anuncio.centro_id}`} className="flex items-center gap-2">
            <span className="text-[15px] font-bold leading-tight tracking-[-0.3px] text-primary hover:underline">
              {centroNombre}
            </span>
            {centroCiudad && (
              <span className="text-[13px] text-muted-foreground">@{centroCiudad}</span>
            )}
          </Link>
        )}
        <span
          className="ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
        >
          {meta.emoji} {meta.label.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center justify-between text-[13px] text-muted-foreground">
        <h3 className="text-[15px] font-bold text-foreground">{anuncio.titulo}</h3>
        <time dateTime={anuncio.created_at} className="shrink-0">
          {formatDate(anuncio.created_at)}
        </time>
      </div>

      {anuncio.descripcion && (
        <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-foreground">
          {anuncio.descripcion}
        </p>
      )}

      <p className="mt-1 text-[13px] text-muted-foreground">
        {anuncio.ciudad}
        {anuncio.zona ? ` · ${anuncio.zona}` : ''}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
        {anuncio.capacidad != null && (
          <span className="inline-flex items-center gap-1">
            <span>👤</span> {anuncio.capacidad}{' '}
            {anuncio.capacidad === 1 ? 'persona' : 'personas'}
          </span>
        )}
        {anuncio.mascotas && (
          <span className="inline-flex items-center gap-1">
            <span>🐶</span> Mascotas OK
          </span>
        )}
        {anuncio.accesibilidad && (
          <span className="inline-flex items-center gap-1">
            <span>♿</span> Accesible
          </span>
        )}
        {anuncio.duracion && (
          <span className="inline-flex items-center gap-1">
            <span>📅</span> {anuncio.duracion}
          </span>
        )}
      </div>

      {anuncio.tipo === 'transporte' && (
        <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
          {anuncio.destino && (
            <span>→ {anuncio.destino}</span>
          )}
          {anuncio.tipo_carga && (
            <span className="inline-flex items-center gap-1">
              <span>
                {anuncio.tipo_carga === 'personas' ? '👥' : anuncio.tipo_carga === 'insumos' ? '📦' : '👥📦'}
              </span>{' '}
              {anuncio.tipo_carga.charAt(0).toUpperCase() + anuncio.tipo_carga.slice(1)}
            </span>
          )}
          {anuncio.tipo_vehiculo && (
            <span className="inline-flex items-center gap-1">
              <span>🚛</span>{' '}
              {anuncio.tipo_vehiculo.charAt(0).toUpperCase() + anuncio.tipo_vehiculo.slice(1)}
            </span>
          )}
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
            className={anuncio.user_has_util ? 'fill-primary text-primary' : ''}
          />
          <span>{anuncio.util_count}</span>
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-primary"
        >
          <Share size={18} />
        </button>
      </div>
    </article>
  )
})
