import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

function renderAt(path = '/') {
  const LocationProbe = () => {
    const loc = useLocation()
    return <div data-testid="loc">{loc.pathname}</div>
  }
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Navbar user={null} />
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Navbar', () => {
  it('shows Acopio brand on the home page', () => {
    renderAt('/')
    expect(screen.getByText(/acopio/i)).toBeInTheDocument()
  })

  it('shows a back arrow and page title on sub-pages', () => {
    renderAt('/login')
    expect(screen.getByText('Iniciar sesion')).toBeInTheDocument()
    expect(screen.getByLabelText('Volver')).toHaveAttribute('href', '/')
  })

  it('shows page title for centro routes', () => {
    renderAt('/centro/uuid-123')
    expect(screen.getByText('Centro')).toBeInTheDocument()
  })

  it('shows page title for nuevo centro route', () => {
    renderAt('/centros/nuevo')
    expect(screen.getByText('Nuevo centro')).toBeInTheDocument()
  })
})
