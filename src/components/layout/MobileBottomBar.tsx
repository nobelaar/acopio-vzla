import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import type { AuthUser } from '@/types/db'
import { Home, Search, PlusCircle, User, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchOverlay } from '@/components/common/SearchOverlay'

interface Props {
  user: AuthUser | null
}

export function MobileBottomBar({ user }: Props) {
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const hideOn = ['/login', '/registro']
  if (hideOn.includes(location.pathname)) return null

  return (
    <>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-14 items-center justify-around border-t border-border bg-black pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
        <Tab to="/" icon={Home} label="Inicio" />
        <Tab to="/comunidad" icon={Users} label="Comunidad" />
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <Search size={22} strokeWidth={2} />
          <span>Buscar</span>
        </button>
        <Tab
          to={user ? '/centros/nuevo' : '/login?redirect=/centros/nuevo'}
          icon={PlusCircle}
          label="Nuevo"
        />
        <Tab
          to={user ? '#' : '/login'}
          icon={User}
          label={user ? 'Perfil' : 'Entrar'}
        />
      </nav>
    </>
  )
}

function Tab({ to, icon: Icon, label }: { to: string; icon: typeof Home; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[10px] transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={22}
            strokeWidth={isActive ? 2.5 : 2}
            className={cn(isActive && 'text-primary')}
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}
