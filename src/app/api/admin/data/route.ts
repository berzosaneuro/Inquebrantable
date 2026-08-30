import { NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const gate = await checkAdmin()
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.reason }, { status: gate.reason === 'no-session' ? 401 : 403 })
  }
  const { data, error } = await gate.supabase!.rpc('inq_admin_snapshot')
  if (error) {
    return NextResponse.json({ ok: false, error: 'No se pudo cargar: ' + error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, ...(data as Record<string, unknown>) })
}
