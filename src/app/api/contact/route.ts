import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().optional().or(z.literal('')),
  message: z.string().trim().min(1).max(4000),
})

export async function POST(req: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'no-config' }, { status: 503 })
  }
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Rellena tu nombre y el mensaje.' },
      { status: 400 },
    )
  }
  const supabase = createServerSupabase()
  const { error } = await supabase.from('inq_contact_messages').insert({
    name: parsed.data.name,
    email: parsed.data.email || null,
    message: parsed.data.message,
  })
  if (error) {
    return NextResponse.json({ ok: false, error: 'No se pudo enviar. Inténtalo otra vez.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
