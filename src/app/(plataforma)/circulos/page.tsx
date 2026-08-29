'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Circle = { slug: string; name: string; description: string | null }

export default function CirculosPage() {
  const [circles, setCircles] = useState<Circle[]>([])

  useEffect(() => {
    fetch('/api/refugio', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setCircles(j.circles ?? []))
      .catch(() => {})
  }, [])

  return (
    <>
      <p className="eyebrow">Círculos</p>
      <h1>Comunidades por tema</h1>
      <p className="lede">
        Cada círculo es un rincón del Refugio para hablar de algo concreto con otras
        mujeres que están en lo mismo.
      </p>
      <div className="plat-reco">
        {circles.map((c) => (
          <Link key={c.slug} href={`/refugio?circle=${c.slug}`}>
            <span>
              <strong>{c.name}</strong>
              {c.description && (
                <>
                  <br />
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>{c.description}</span>
                </>
              )}
            </span>
            <span className="arw">→</span>
          </Link>
        ))}
      </div>
    </>
  )
}
