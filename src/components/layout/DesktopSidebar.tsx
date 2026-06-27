import { NavLink } from 'react-router-dom'
import type { AuthUser } from '@/types/db'
import { Home, Search, PlusCircle, User, Users, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/notificacion/NotificationBell'

interface Props {
  user: AuthUser | null
  onLogout?: () => void
}

export function DesktopSidebar({ user, onLogout }: Props) {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[275px] flex-col border-r border-border px-3 py-3 lg:flex">
      <NavLink to="/" className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-primary hover:bg-secondary">
        A
      </NavLink>

      <nav className="flex flex-1 flex-col gap-1">
        <SidebarItem to="/" icon={Home} label="Inicio" />
        <SidebarItem to="/comunidad" icon={Users} label="Comunidad" />
        <SidebarItem to="/centros" icon={Search} label="Buscar" />
        <SidebarItem
          to={user ? '/centros/nuevo' : '/login?redirect=/centros/nuevo'}
          icon={PlusCircle}
          label="Nuevo"
        />
        <SidebarItem
          to={user ? '#' : '/login'}
          icon={User}
          label={user ? 'Perfil' : 'Entrar'}
        />
      </nav>

      {user ? (
        <div className="mt-auto space-y-2">
          <NotificationBell userId={user.id} />
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-full px-4 py-3 text-[15px] text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut size={22} />
            <span>{user.email}</span>
          </button>
        </div>
      ) : null}
    </aside>
  )
}

function SidebarItem({ to, icon: Icon, label }: { to: string; icon: typeof Home; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'inline-flex items-center gap-3 rounded-full px-4 py-3 text-[17px] transition-colors',
          isActive ? 'font-bold text-foreground' : 'text-foreground hover:bg-secondary'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={26} strokeWidth={isActive ? 2.5 : 2} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}
