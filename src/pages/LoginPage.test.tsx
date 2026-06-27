import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { describe, expect, it, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'
import { createTestQueryClient } from '@/test/test-utils'
import { setRequireEmailConfirm } from '@/test/mocks'
import { LoginPage } from './LoginPage'

function renderLoginPage(initial = '/login') {
  const Probe = () => {
    const loc = useLocation()
    return <div data-testid="loc">{loc.pathname}</div>
  }
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<div data-testid="registro">registro</div>} />
          <Route path="*" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(async () => {
  await supabase.auth.signOut()
})

describe('LoginPage', () => {
  it('submits email and password and navigates to home on success', async () => {
    const user = userEvent.setup()
    renderLoginPage()
    await user.type(screen.getByLabelText(/email|correo/i), 'coordinador@example.com')
    await user.type(screen.getByLabelText(/contraseña|password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /iniciar sesión|entrar/i }))
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('/'))
    expect(screen.queryByText(/inválid|error/i)).not.toBeInTheDocument()
  })

  it('shows an error message when credentials are invalid', async () => {
    const user = userEvent.setup()
    renderLoginPage()
    await user.click(screen.getByRole('button', { name: /iniciar sesión|entrar/i }))
    await waitFor(() =>
      expect(screen.getByText(/inválid|credenciales|error/i)).toBeInTheDocument()
    )
  })

  it('has a link to the registration page', () => {
    renderLoginPage()
    const link = screen.getByRole('link', { name: /registr|crear cuenta/i })
    expect(link).toHaveAttribute('href', '/registro')
  })

  it('alerts the user to confirm their email and offers a resend link when signIn hits email_not_confirmed', async () => {
    setRequireEmailConfirm(true)
    const user = userEvent.setup()
    renderLoginPage()
    await user.type(screen.getByLabelText(/email|correo/i), 'sinconfirmar@example.com')
    await user.type(screen.getByLabelText(/contraseña|password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /iniciar sesión|entrar/i }))
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /confirmá tu correo|confirmar tu email/i })).toBeInTheDocument()
    )
    expect(screen.getByText('sinconfirmar@example.com')).toBeInTheDocument()
    const resend = screen.getByRole('button', { name: /reenviar/i })
    await user.click(resend)
    await waitFor(() => expect(screen.getByText(/reenviamos|enviamos otro/i)).toBeInTheDocument())
  })
})