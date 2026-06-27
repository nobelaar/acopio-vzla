import { Link, useLocation } from 'react-router-dom'
import type { AuthUser } from '@/types/db'
import { ArrowLeft, HeartHandshake } from 'lucide-react'
import { NotificationBell } from '@/components/notificacion/NotificationBell'

interface Props {
  user?: AuthUser | null
}

export function Navbar({ user }: Props) {
  const location = useLocation()
  const isSubPage = location.pathname !== '/' && location.pathname !== '/centros' && location.pathname !== '/comunidad'

  return (
    <header className="sticky top-0 z-10 overflow-hidden border-b border-border bg-black lg:hidden">
      <nav className="flex h-11 items-center px-4">
        {isSubPage ? (
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground" aria-label="Volver">
              <ArrowLeft size={20} />
            </Link>
            <span className="text-[17px] font-bold">
              {getPageTitle(location.pathname)}
            </span>
          </div>
        ) : (
          <Link to="/" className="flex items-center gap-2 text-primary">
            <HeartHandshake size={22} strokeWidth={2.5} />
            <span className="text-[17px] font-bold tracking-tight">Acopio</span>
          </Link>
        )}
        <div className="ml-auto">
          <NotificationBell userId={user?.id} />
        </div>
      </nav>
    </header>
  )
}

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/centros/nuevo')) return 'Nuevo centro'
  if (pathname.includes('/editar')) return 'Editar centro'
  if (pathname.startsWith('/centro/')) return 'Centro'
  if (pathname === '/login') return 'Iniciar sesion'
  if (pathname === '/registro') return 'Crear cuenta'
  return 'Acopio'
}
