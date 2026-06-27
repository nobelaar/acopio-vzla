import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { resendConfirmationEmail, signIn } from '@/features/auth/session'

type Estado = 'form' | 'sin-confirmar'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [estado, setEstado] = useState<Estado>('form')
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await signIn(email, password)
    setSubmitting(false)
    if (result.needsEmailConfirm) {
      setEstado('sin-confirmar')
      return
    }
    if (result.error) {
      setError('Credenciales inválidas')
      return
    }
    navigate('/')
  }

  async function handleResend() {
    setResending(true)
    setResendMsg(null)
    const { error } = await resendConfirmationEmail(email)
    setResending(false)
    setResendMsg(error ? 'No se pudo reenviar el correo.' : 'Te reenviamos el correo de confirmación.')
  }

  if (estado === 'sin-confirmar') {
    return (
      <div className="mx-auto max-w-sm space-y-4 py-8">
        <h1 className="text-xl font-bold">Confirmá tu correo</h1>
        <p className="text-sm text-muted-foreground">
          Tu cuenta aún no está activada. Revisá tu correo
          {email ? <><strong> {email}</strong> </> : null}
          y hacé clic en el enlace de confirmación para activarla.
        </p>
        {resendMsg && <p className="text-sm text-primary">{resendMsg}</p>}
        <Button type="button" variant="outline" onClick={handleResend} disabled={resending}>
          {resending ? 'Enviando…' : 'Reenviar correo de confirmación'}
        </Button>
        <div className="flex items-center justify-between pt-2 text-sm">
          <button
            type="button"
            onClick={() => setEstado('form')}
            className="text-muted-foreground underline"
          >
            Volver
          </button>
          <Link to="/registro" className="font-medium text-primary underline">
            Crear cuenta
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 py-8">
      <h1 className="text-xl font-bold">Iniciar sesión</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Entrando…' : 'Iniciar sesión'}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        ¿No tenés cuenta?{' '}
        <Link to="/registro" className="font-medium text-primary underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  )
}