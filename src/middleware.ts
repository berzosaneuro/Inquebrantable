import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * Refresca la sesión de Supabase en cada petición y reescribe las cookies.
 * Sin esto, el access token caduca (~1 h) y la usuaria aparece desconectada
 * en las páginas del servidor y en las API routes.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !anon) return response

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request: { headers: request.headers } })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  // Dispara el refresco del token si hace falta.
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
     * Todas las rutas salvo estáticos, imágenes y el service worker.
     */
    '/((?!_next/static|_next/image|favicon.ico|service-worker.js|manifest.json|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|webp|gif)$).*)',
  ],
}
