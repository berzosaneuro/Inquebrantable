import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

const MOODS = ['mal', 'ansiosa', 'triste', 'agotada', 'normal', 'bien', 'muy_bien'] as const
const NEEDS = ['calmarme', 'hablar', 'entender', 'acompanada', 'trabajar', 'ayuda'] as const

const schema = z.object({
  mood: z.enum(MOODS),
  need: z.enum(NEEDS).optional().nullable(),
})

async function user() {
  const supabase = createServerSupabase()
  const { data } = await supabase.auth.getUser()
  return { supabase, user: data.user }
}

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ checkins: [] })
  const { supabase, user: u } = await user()
  if (!u) return NextResponse.json({ checkins: [] })
  const { data } = await supabase
    .from('inq_checkins')
    .select('mood, need, created_at')
    .order('created_at', { ascending: false })
    .limit(60)
  return NextResponse.json({ checkins: data ?? [] })
}

export async function POST(req: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'no-config' }, { status: 503 })
  }
  const { supabase, user: u } = await user()
  if (!u) return NextResponse.json({ ok: false, error: 'no-auth' }, { status: 401 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'bad-body' }, { status: 400 })
  }
  const { error } = await supabase.from('inq_checkins').insert({
    user_id: u.id,
    mood: parsed.data.mood,
    need: parsed.data.need ?? null,
  })
  if (error) return NextResponse.json({ ok: false, error: 'db' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
