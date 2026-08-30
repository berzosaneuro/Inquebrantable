'use client'

/**
 * Acceso cliente al almacén clave-valor de la usuaria (`inq_kv` vía /api/state).
 * Las claves deben empezar por `inq-`.
 */

let cache: Record<string, unknown> | null = null

export async function kvAll(force = false): Promise<Record<string, unknown>> {
  if (cache && !force) return cache
  try {
    const j = await fetch('/api/state', { cache: 'no-store' }).then((r) => r.json())
    cache = (j.state as Record<string, unknown>) ?? {}
  } catch {
    cache = {}
  }
  return cache
}

export async function kvGet<T = unknown>(key: string, fallback: T): Promise<T> {
  const all = await kvAll()
  return (all[key] as T) ?? fallback
}

export async function kvSet(key: string, value: unknown): Promise<boolean> {
  if (cache) cache[key] = value
  try {
    const j = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    }).then((r) => r.json())
    return !!j.ok
  } catch {
    return false
  }
}
