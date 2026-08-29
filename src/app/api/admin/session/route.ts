import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  ADMIN_COOKIE,
  adminConfigured,
  adminToken,
  passwordMatches,
} from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const schema = z.object({ password: z.string().min(1) })

export async function POST(req: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Panel admin sin configurar (falta ADMIN_PASSWORD).' },
      { status: 503 },
    )
  }
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success || !passwordMatches(parsed.data.password)) {
    return NextResponse.json({ ok: false, error: 'Contraseña incorrecta.' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
