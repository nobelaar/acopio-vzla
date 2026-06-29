import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import type { AuthUser } from '@/types/db'
import { Home, Search, PlusCircle, User, Megaphone, MessageSquareText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchOverlay } from '@/components/common/SearchOverlay'

interface Props {
  user: AuthUser | null
}

export function MobileBottomBar({ user }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const hideOn = ['/login', '/registro']
  if (hideOn.includes(location.pathname)) return null

  const publishTarget = user ? '/anuncio/nuevo' : '/login?redirect=/anuncio/nuevo'

  function handlePublishClick() {
    if (!user) {
      navigate(publishTarget)
      return
    }
    setPublishOpen(!publishOpen)
  }

  return (
    <>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      {publishOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setPublishOpen(false)}
        />
      )}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-14 items-center justify-around border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
        <Tab to="/" icon={Home} label="Inicio" />
        <Tab to="/centros" icon={Search} label="Buscar" />
        <button
          type="button"
          onClick={handlePublishClick}
          className="relative flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <PlusCircle size={22} strokeWidth={2} />
          <span>Publicar</span>
          {publishOpen && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-xl border border-border bg-background shadow-lg p-1 z-40">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setPublishOpen(false)
                  navigate('/anuncio/nuevo')
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] hover:bg-secondary"
              >
                <Megaphone size={18} />
                <span>Anuncio</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setPublishOpen(false)
                  navigate('/post/nuevo')
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] hover:bg-secondary"
              >
                <MessageSquareText size={18} />
                <span>Post</span>
              </button>
            </div>
          )}
        </button>
        <Tab
          to={user ? '/perfil' : '/login'}
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
