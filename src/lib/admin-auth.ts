import { createHmac } from 'node:crypto'
import { cookies } from 'next/headers'

const COOKIE = 'inq_admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim() || ''

export function adminConfigured(): boolean {
  return ADMIN_PASSWORD.length >= 6
}

/** Token derivado de la contraseña admin (no reversible). */
export function adminToken(): string {
  return createHmac('sha256', ADMIN_PASSWORD).update('inq-admin-v1').digest('hex')
}

export function passwordMatches(password: string): boolean {
  return adminConfigured() && password === ADMIN_PASSWORD
}

export function isAdmin(): boolean {
  if (!adminConfigured()) return false
  const c = cookies().get(COOKIE)?.value
  return Boolean(c) && c === adminToken()
}

export const ADMIN_COOKIE = COOKIE
