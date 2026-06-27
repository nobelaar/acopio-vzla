import { useSession } from '@/features/auth/session'
import { useNotificaciones } from '@/features/notificaciones/queries'
import { NotificacionItem } from '@/components/notificacion/NotificacionItem'
import { Bell } from 'lucide-react'

export function NotificacionesPage() {
  const { user } = useSession()
  const { data: notificaciones = [], isLoading } = useNotificaciones(user?.id)

  if (!user) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Inicia sesion para ver tus notificaciones</p>
  }

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Cargando notificaciones...</p>
  }

  return (
    <div className="pb-14">
      <div className="border-b border-border px-4 py-3">
        <span className="text-[15px] font-bold">Notificaciones</span>
      </div>
      {notificaciones.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <Bell size={48} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No tenes notificaciones</p>
        </div>
      ) : (
        notificaciones.map((n) => (
          <NotificacionItem key={n.id} notificacion={n} onRead={() => {}} />
        ))
      )}
    </div>
  )
}
