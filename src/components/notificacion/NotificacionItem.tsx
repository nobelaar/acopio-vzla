import { Link } from 'react-router-dom'
import type { Notificacion } from '@/types/db'
import { formatDate } from '@/lib/utils'

interface Props {
  notificacion: Notificacion
  onRead: () => void
}

export function NotificacionItem({ notificacion, onRead }: Props) {
  return (
    <Link
      to={notificacion.centro_id ? `/centro/${notificacion.centro_id}` : '/'}
      onClick={onRead}
      className="block border-b border-border px-4 py-3 transition-colors hover:bg-secondary/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[14px]">
            Alguien comento en tu post
          </p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {formatDate(notificacion.created_at)}
          </p>
        </div>
        {!notificacion.leida && (
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
        )}
      </div>
    </Link>
  )
}
