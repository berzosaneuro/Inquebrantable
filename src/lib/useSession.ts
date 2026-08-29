'use client'

import { useEffect, useState } from 'react'

export type SessionUser = { id: string; email: string | null; nick: string }

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (alive) setUser(j.user ?? null)
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return { user, loading }
}
