'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/useSession'
import { kvGet, kvSet } from '@/lib/kv'
import { PlatHeader } from '../_ui'

type Notif = { id: string; text: string; href?: string; at: string; read?: boolean }

export default function NotificacionesPage() {
  const { user, loading } = useSession()
  const [items, setItems] = useState<Notif[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) { setReady(true); return }
    kvGet<Notif[]>('inq-notifs', [])
      .then((v) => setItems(Array.isArray(v) ? v : []))
      .finally(() => setReady(true))
  }, [user, loading])

  async function marcarLeidas() {
    const next = items.map((n) => ({ ...n, read: true }))
    setItems(next)
    await kvSet('inq-notifs', next)
  }

  return (
    <>
      <PlatHeader title="Notificaciones" sub="Lo que ha pasado en tu espacio." />

      {!loading && !user && (
        <div className="card">
          <p className="c-sub">Crea una cuenta para recibir avisos de respuestas en el Refugio y recordatorios de tu ritual.</p>
          <Link href="/entrar" className="btn" style={{ marginTop: 14 }}>Crear cuenta o entrar</Link>
        </div>
      )}

      {user && ready && items.length > 0 && (
        <>
          <button className="btn ghost" style={{ marginBottom: 12 }} onClick={marcarLeidas}>
            Marcar todas como leídas
          </button>
          <div className="rows">
            {items.map((n) => (
              <Link key={n.id} href={n.href || '#'} style={{ opacity: n.read ? 0.55 : 1 }}>
                <span>{n.text}</span>
                <span className="arw">→</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {user && ready && items.length === 0 && (
        <p className="plat-empty">No tienes notificaciones todavía.</p>
      )}
    </>
  )
}
