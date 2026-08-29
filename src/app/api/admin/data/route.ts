import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const LEVELS = ['La Grieta', 'El Despertar', 'Reconstrucción', 'Inquebrantable']

export async function GET() {
  if (!isAdmin()) {
    return NextResponse.json({ ok: false, error: 'no-auth' }, { status: 401 })
  }
  const admin = getSupabaseAdmin()
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.' },
      { status: 503 },
    )
  }

  // ── Usuarias de Inquebrantable = las que tienen fila en inq_profiles ──
  const { data: profiles } = await admin
    .from('inq_profiles')
    .select('id, nick, created_at')
    .order('created_at', { ascending: false })

  const ids = (profiles ?? []).map((p) => p.id)
  const emailById: Record<string, string> = {}
  // listUsers pagina de 50 en 50; para volúmenes pequeños basta con 1-2 páginas.
  for (let page = 1; page <= 20; page++) {
    const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    const users = list?.users ?? []
    for (const u of users) if (u.email) emailById[u.id] = u.email
    if (users.length < 200) break
  }

  const users = (profiles ?? []).map((p) => ({
    id: p.id,
    nick: p.nick,
    email: emailById[p.id] ?? '—',
    created_at: p.created_at,
  }))

  // ── Mensajes de contacto ──
  const { data: contact } = await admin
    .from('inq_contact_messages')
    .select('id, name, email, message, handled, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  // ── Estadísticas ──
  const { count: testCount } = await admin
    .from('inq_test_results')
    .select('id', { count: 'exact', head: true })

  const { data: testRows } = await admin
    .from('inq_test_results')
    .select('user_id, level_idx, created_at')
    .order('created_at', { ascending: false })

  // nivel actual por usuaria = su resultado más reciente
  const latestLevelByUser: Record<string, number> = {}
  for (const r of testRows ?? []) {
    if (!(r.user_id in latestLevelByUser)) latestLevelByUser[r.user_id] = r.level_idx
  }
  const levelDist = [0, 0, 0, 0]
  for (const lvl of Object.values(latestLevelByUser)) {
    if (lvl >= 0 && lvl < 4) levelDist[lvl]++
  }

  return NextResponse.json({
    ok: true,
    users,
    contact: contact ?? [],
    stats: {
      totalUsers: ids.length,
      testsCompleted: testCount ?? 0,
      usersWithTest: Object.keys(latestLevelByUser).length,
      pendingMessages: (contact ?? []).filter((m) => !m.handled).length,
      levels: LEVELS.map((name, i) => ({ name, count: levelDist[i] })),
    },
  })
}

// ── Marcar mensaje de contacto como atendido / sin atender ──
export async function PATCH(req: Request) {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 })
  const admin = getSupabaseAdmin()
  if (!admin) return NextResponse.json({ ok: false }, { status: 503 })
  const body = (await req.json().catch(() => null)) as { id?: number; handled?: boolean } | null
  if (!body || typeof body.id !== 'number') {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  await admin
    .from('inq_contact_messages')
    .update({ handled: Boolean(body.handled) })
    .eq('id', body.id)
  return NextResponse.json({ ok: true })
}
