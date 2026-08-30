import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/supabase/env'

/**
 * Acceso admin = usuaria con sesión de Supabase cuyo email está en
 * `inq_admin_allowlist`. La comprobación real la hace la función
 * `inq_is_admin()` en Postgres (SECURITY DEFINER). Aquí solo la invocamos.
 */
export async function checkAdmin(): Promise<{
  ok: boolean
  reason: 'no-config' | 'no-session' | 'not-admin' | null
  supabase: ReturnType<typeof createServerSupabase> | null
}> {
  if (!supabaseConfigured()) return { ok: false, reason: 'no-config', supabase: null }
  const supabase = createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, reason: 'no-session', supabase }
  const { data, error } = await supabase.rpc('inq_is_admin')
  if (error || data !== true) return { ok: false, reason: 'not-admin', supabase }
  return { ok: true, reason: null, supabase }
}
