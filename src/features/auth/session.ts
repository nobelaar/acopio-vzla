import { useEffect, useState } from 'react'
import type { AuthUser } from '@/types/db'
import { supabase } from '@/lib/supabase'

export interface SignInResult {
  error: string | null
  needsEmailConfirm: boolean
  email: string | null
}

export interface SignUpResult {
  error: string | null
  needsEmailConfirm: boolean
  email: string | null
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    const code = (error as { code?: string }).code ?? ''
    const needsConfirm = code === 'email_not_confirmed' || /not confirmed/i.test(error.message)
    return {
      error: needsConfirm ? null : error.message,
      needsEmailConfirm: needsConfirm,
      email: needsConfirm ? email : null,
    }
  }
  return { error: null, needsEmailConfirm: false, email }
}

export async function signUp(
  email: string,
  password: string
): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message, needsEmailConfirm: false, email: null }
  return { error: null, needsEmailConfirm: data.session == null, email }
}

export async function resendConfirmationEmail(email: string): Promise<{ error: string | null }> {
  if (!email.trim()) return { error: 'Email requerido' }
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  return { error: error ? error.message : null }
}

export function useSession(): { user: AuthUser | null; loading: boolean } {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      const sessionUser = data.session?.user
      setUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email ?? '' } : null)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user
      setUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email ?? '' } : null)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}