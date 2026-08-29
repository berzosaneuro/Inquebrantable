import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_URL, SUPABASE_ANON } from './env'

/**
 * Cliente Supabase para Server Components / Route Handlers.
 * Usa la cookie de sesión de la usuaria (RLS aplica con su identidad).
 */
export function createServerSupabase() {
  const cookieStore = cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Server Component sin permiso de escritura de cookies: se ignora,
          // el middleware / route handler refresca la sesión.
        }
      },
    },
  })
}
