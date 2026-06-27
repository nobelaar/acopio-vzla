import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { resendConfirmationEmail, signUp } from '@/features/auth/session'

type Estado = 'form' | 'confirmacion'

export function RegistroPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [estado, setEstado] = useState<Estado>('form')
  const [resendMsg, setResendMsg] = useState<string | null>(null)
  const [resending, setResending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await signUp(email, password)
    setSubmitting(false)
    if (result.error) {
      setError('No se pudo crear la cuenta. Verificá los datos.')
      return
    }
    if (result.needsEmailConfirm) {
      setEstado('confirmacion')
      return
    }
    navigate('/')
  }

  async function handleResend() {
    setResending(true)
    setResendMsg(null)
    const { error } = await resendConfirmationEmail(email)
    setResending(false)
    setResendMsg(error ? 'No se pudo reenviar el correo.' : 'Te enviamos otro correo de confirmación.')
  }

  if (estado === 'confirmacion') {
    return (
      <div className="mx-auto max-w-sm space-y-4 py-8">
        <h1 className="text-xl font-bold">Revisá tu correo</h1>
        <p className="text-sm text-muted-foreground">
          Hemos enviado un correo de confirmación a <strong>{email}</strong>. Hacé
          clic en el enlace del correo para activar tu cuenta y poder registrar tu
          centro de acopio.
        </p>
        <p className="text-sm text-muted-foreground">
          Si no lo recibiste en unos minutos, revisá la carpeta de spam.
        </p>
        {resendMsg && <p className="text-sm text-primary">{resendMsg}</p>}
        <Button type="button" variant="outline" onClick={handleResend} disabled={resending}>
          {resending ? 'Enviando…' : 'Reenviar correo'}
        </Button>
        <div className="flex items-center justify-between pt-2 text-sm">
          <button
            type="button"
            onClick={() => setEstado('form')}
            className="text-muted-foreground underline"
          >
            Modificar mis datos
          </button>
          <Link to="/login" className="font-medium text-primary underline">
            Iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 py-8">
      <h1 className="text-xl font-bold">Crear cuenta</h1>
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
            autoComplete="new-password"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Creando…' : 'Crear cuenta'}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="font-medium text-primary underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}