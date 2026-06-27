import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useNotificaciones, useNotificacionesNoLeidas, useMarcarTodasLeidas } from '@/features/notificaciones/queries'
import { NotificacionItem } from './NotificacionItem'

interface Props {
  userId: string | undefined
}

export function NotificationBell({ userId }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data: notificaciones = [] } = useNotificaciones(userId)
  const { data: noLeidas = 0 } = useNotificacionesNoLeidas(userId)
  const marcarTodas = useMarcarTodasLeidas()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (!userId) return null

  function handleToggle() {
    if (!open && noLeidas > 0) {
      marcarTodas.mutate(userId!)
    }
    setOpen(!open)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <Bell size={20} />
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-80 overflow-hidden rounded-2xl border border-border bg-black shadow-xl">
          <div className="border-b border-border px-4 py-3">
            <span className="text-[15px] font-bold">Notificaciones</span>
          </div>
          <div className="max-h-96 overflow-auto">
            {notificaciones.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
                No tenes notificaciones
              </p>
            ) : (
              <>
                {notificaciones.slice(0, 5).map((n) => (
                  <NotificacionItem
                    key={n.id}
                    notificacion={n}
                    onRead={() => setOpen(false)}
                  />
                ))}
                {notificaciones.length > 5 && (
                  <Link
                    to="/notificaciones"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 text-center text-[13px] text-primary hover:underline"
                  >
                    Ver todas
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
