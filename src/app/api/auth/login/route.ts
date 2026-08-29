import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Auth no configurado' }, { status: 503 })
  }
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Email o contraseña no válidos.' }, { status: 400 })
  }

  const supabase = createServerSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
  })

  if (error || !data.user) {
    return NextResponse.json(
      { ok: false, error: 'Email o contraseña incorrectos.' },
      { status: 401 },
    )
  }

  const nick =
    (data.user.user_metadata?.nick as string | undefined) ||
    data.user.email?.split('@')[0] ||
    'tú'

  return NextResponse.json({
    ok: true,
    user: { id: data.user.id, email: data.user.email, nick },
  })
}
