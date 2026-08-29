import { NextResponse } from 'next/server'
import { isAdmin, adminIsOpen } from '@/lib/admin-auth'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

// El snapshot lo produce una función SECURITY DEFINER en Postgres
// (inq_admin_snapshot), con su propio control de acceso (inq_is_admin):
// abierto si no hay allowlist configurada, o restringido a emails concretos.
// No requiere SUPABASE_SERVICE_ROLE_KEY.

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ ok: false, error: 'no-auth' }, { status: 401 })
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Supabase sin configurar.' }, { status: 503 })
  }
  const supabase = createServerSupabase()
  const { data, error } = await supabase.rpc('inq_admin_snapshot')
  if (error) {
    return NextResponse.json(
      { ok: false, error: 'No se pudo cargar el panel: ' + error.message },
      { status: 500 },
    )
  }
  return NextResponse.json({ ok: true, open: adminIsOpen(), ...(data as Record<string, unknown>) })
}

export async function PATCH(req: Request) {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 })
  const supabase = createServerSupabase()
  const body = (await req.json().catch(() => null)) as { id?: number; handled?: boolean } | null
  if (!body || typeof body.id !== 'number') {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const { error } = await supabase.rpc('inq_admin_moderate', {
    p_op: 'handle-message',
    p_id: body.id,
    p_bool: Boolean(body.handled),
  })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
