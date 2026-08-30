'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlatHeader } from '../_ui'

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
      <PlatHeader title="Círculos" sub="Comunidades por tema dentro del Refugio." />
      <p className="c-sub" style={{ margin: '2px 0 14px' }}>
        Cada círculo es un rincón para hablar de algo concreto con otras mujeres que
        están en lo mismo.
      </p>
      <div className="rows">
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
