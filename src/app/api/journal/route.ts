import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

const F = z.string().trim().max(4000).optional().nullable()
const schema = z.object({ occurred: F, feeling: F, need: F, did: F, learned: F })

async function user() {
  const supabase = createServerSupabase()
  const { data } = await supabase.auth.getUser()
  return { supabase, user: data.user }
}

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ entries: [] })
  const { supabase, user: u } = await user()
  if (!u) return NextResponse.json({ entries: [], needAuth: true })
  const { data } = await supabase
    .from('inq_journal')
    .select('id, occurred, feeling, need, did, learned, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  return NextResponse.json({ entries: data ?? [] })
}

export async function POST(req: Request) {
  const { supabase, user: u } = await user()
  if (!u) return NextResponse.json({ ok: false, error: 'no-auth' }, { status: 401 })
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })
  const d = parsed.data
  if (!d.occurred && !d.feeling && !d.need && !d.did && !d.learned) {
    return NextResponse.json({ ok: false, error: 'Escribe algo antes de guardar.' }, { status: 400 })
  }
  const { error } = await supabase.from('inq_journal').insert({
    user_id: u.id,
    occurred: d.occurred || null,
    feeling: d.feeling || null,
    need: d.need || null,
    did: d.did || null,
    learned: d.learned || null,
  })
  if (error) return NextResponse.json({ ok: false, error: 'db' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { supabase, user: u } = await user()
  if (!u) return NextResponse.json({ ok: false }, { status: 401 })
  const id = Number(new URL(req.url).searchParams.get('id'))
  if (!id) return NextResponse.json({ ok: false }, { status: 400 })
  await supabase.from('inq_journal').delete().eq('id', id) // RLS garantiza que sea suya
  return NextResponse.json({ ok: true })
}
