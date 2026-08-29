import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

const schema = z.object({
  nick: z.string().trim().min(1).max(30),
  email: z.string().trim().email(),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Auth no configurado' }, { status: 503 })
  }
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Revisa el nick, el email y la contraseña (mínimo 6 caracteres).' },
      { status: 400 },
    )
  }
  const { nick, password } = parsed.data
  const email = parsed.data.email.toLowerCase()

  const supabase = createServerSupabase()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nick } },
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('already') || msg.includes('registered')) {
      return NextResponse.json(
        { ok: false, error: 'Ese email ya tiene una cuenta. Entra con tu contraseña.' },
        { status: 409 },
      )
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    needsConfirmation: !data.session,
    user: data.user ? { id: data.user.id, email, nick } : null,
  })
}
