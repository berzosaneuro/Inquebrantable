import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// DELETE /api/me           → borra los datos de la usuaria (mantiene la cuenta)
// DELETE /api/me?cuenta=1   → borra todo y cierra la cuenta
export async function DELETE(req: Request) {
  const supabase = createServerSupabase()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return NextResponse.json({ ok: false }, { status: 401 })

  const full = new URL(req.url).searchParams.get('cuenta') === '1'
  const { error } = await supabase.rpc('inq_delete_me', { p_full: full })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  if (full) await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
