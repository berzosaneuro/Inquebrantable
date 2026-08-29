import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE } from './env'

let _admin: SupabaseClient | null = null

/**
 * Cliente service-role (ignora RLS). SOLO en servidor: webhooks de Stripe,
 * panel admin, lectura de mensajes de contacto. null si falta la clave.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return null
  if (!_admin) {
    _admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return _admin
}
