import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

// Claves de localStorage que NO se sincronizan al servidor.
const LOCAL_ONLY = new Set([
  'inq-session',
  'inq-accounts',
  'inq-premium-trial',
  'inq-contact-msgs',
])

async function getUser() {
  const supabase = createServerSupabase()
  const { data } = await supabase.auth.getUser()
  return { supabase, user: data.user }
}

/** Asegura que existe la fila de perfil de la usuaria. */
async function ensureProfile(
  supabase: ReturnType<typeof createServerSupabase>,
  userId: string,
  nick: string | undefined,
) {
  await supabase
    .from('inq_profiles')
    .upsert({ id: userId, ...(nick ? { nick } : {}) }, { onConflict: 'id', ignoreDuplicates: true })
}

// ── GET: devuelve todo el estado de la usuaria como mapa de claves inq-* ──
export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ state: {} })
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ state: {} })

  await ensureProfile(supabase, user.id, user.user_metadata?.nick as string | undefined)

  const { data: rows } = await supabase.from('inq_kv').select('key, value')
  const state: Record<string, unknown> = {}
  for (const row of rows ?? []) state[row.key] = row.value

  return NextResponse.json({ state })
}

// ── POST { key, value }: guarda una porción del estado ──
const putSchema = z.object({
  key: z.string().min(1).max(120),
  value: z.unknown(),
})

export async function POST(req: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'no-config' }, { status: 503 })
  }
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'no-auth' }, { status: 401 })

  const parsed = putSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'bad-body' }, { status: 400 })
  }
  const { key, value } = parsed.data
  if (!key.startsWith('inq-') || LOCAL_ONLY.has(key)) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  await supabase
    .from('inq_kv')
    .upsert(
      { user_id: user.id, key, value: value ?? null, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,key' },
    )

  // Métrica para el panel admin: registro tipado del resultado del test.
  if (key === 'inq-test-result' && value && typeof value === 'object') {
    const v = value as { score?: number; levelIdx?: number }
    if (typeof v.score === 'number' && typeof v.levelIdx === 'number') {
      await supabase.from('inq_test_results').insert({
        user_id: user.id,
        score: v.score,
        level_idx: v.levelIdx,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
