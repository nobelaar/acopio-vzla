import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import type { AuthUser } from '@/types/db'
import { Home, Search, PlusCircle, User, LogOut, Megaphone, MessageSquareText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/notificacion/NotificationBell'
import { ThemeToggle } from './ThemeToggle'

interface Props {
  user: AuthUser | null
  onLogout?: () => void
}

export function DesktopSidebar({ user, onLogout }: Props) {
  const navigate = useNavigate()
  const [publishOpen, setPublishOpen] = useState(false)

  function handlePublishClick() {
    if (!user) {
      navigate('/login?redirect=/anuncio/nuevo')
      return
    }
    setPublishOpen(!publishOpen)
  }

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[275px] flex-col border-r border-border px-3 py-3 lg:flex">
      <NavLink to="/" className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-primary hover:bg-secondary">
        A
      </NavLink>

      <nav className="flex flex-1 flex-col gap-1">
        <SidebarItem to="/" icon={Home} label="Inicio" />
        <SidebarItem to="/centros" icon={Search} label="Buscar" />
        <div className="relative publish-menu">
          <button
            type="button"
            onClick={handlePublishClick}
            className="inline-flex w-full items-center gap-3 rounded-full px-4 py-3 text-[17px] text-foreground hover:bg-secondary transition-colors"
          >
            <PlusCircle size={26} strokeWidth={2} />
            <span>Publicar</span>
          </button>
          {publishOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setPublishOpen(false)}
              />
              <div className="absolute left-4 top-full z-30 w-56 rounded-xl border border-border bg-background shadow-lg p-1">
                <button
                  type="button"
                  onClick={() => {
                    setPublishOpen(false)
                    navigate('/anuncio/nuevo')
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] hover:bg-secondary"
                >
                  <Megaphone size={20} />
                  <span>Anuncio</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPublishOpen(false)
                    navigate('/post/nuevo')
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] hover:bg-secondary"
                >
                  <MessageSquareText size={20} />
                  <span>Post</span>
                </button>
              </div>
            </>
          )}
        </div>
        <SidebarItem
          to={user ? '/perfil' : '/login'}
          icon={User}
          label={user ? 'Perfil' : 'Entrar'}
        />
      </nav>

      {user ? (
        <div className="mt-auto space-y-2">
          <NotificationBell userId={user.id} expandUp />
          <ThemeToggle />
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
