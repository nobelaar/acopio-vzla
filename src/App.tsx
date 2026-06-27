import { Link, Route, Routes } from 'react-router-dom'
import { useSession } from '@/features/auth/session'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/layout/Navbar'
import { MobileBottomBar } from '@/components/layout/MobileBottomBar'
import { DesktopSidebar } from '@/components/layout/DesktopSidebar'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { FeedPage } from '@/pages/FeedPage'
import { HomePage } from '@/pages/HomePage'
import { CentroPerfilPage } from '@/pages/CentroPerfilPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegistroPage } from '@/pages/RegistroPage'
import { ComunidadPage } from '@/pages/ComunidadPage'
import { NotificacionesPage } from '@/pages/NotificacionesPage'
import { NuevoCentroPage } from '@/pages/NuevoCentroPage'
import { EditarCentroPage } from '@/pages/EditarCentroPage'
import { ToastContainer } from '@/components/toast/ToastContainer'

export default function App() {
  const { user, loading } = useSession()

  return (
    <div className="flex min-h-screen flex-col">
      <DesktopSidebar user={user} onLogout={() => supabase.auth.signOut()} />
      <Navbar user={user} />
      <main className="container flex-1 pb-14 lg:ml-[275px] lg:max-w-[600px] lg:pb-0">
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/comunidad" element={<ComunidadPage />} />
          <Route path="/notificaciones" element={<NotificacionesPage />} />
          <Route path="/centros" element={<HomePage />} />
          <Route path="/centro/:id" element={<CentroPerfilPage user={user} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />
          <Route
            path="/centros/nuevo"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <NuevoCentroPage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/centro/:id/editar"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <EditarCentroPage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <div className="py-16 text-center">
                <p className="text-lg font-semibold">404</p>
                <p className="text-muted-foreground">La pagina no existe.</p>
                <Link to="/" className="mt-3 inline-block text-primary underline">
                  Volver al inicio
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
      <MobileBottomBar user={user} />
      <ToastContainer />
    </div>
  )
}
