'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/useSession'
import { PlatHeader } from '../_ui'

type Entry = {
  id: number
  occurred: string | null
  feeling: string | null
  need: string | null
  did: string | null
  learned: string | null
  created_at: string
}

const FIELDS = [
  { k: 'occurred', label: '¿Qué ha pasado?' },
  { k: 'feeling', label: '¿Qué siento?' },
  { k: 'need', label: '¿Qué necesito?' },
  { k: 'did', label: '¿Qué hice?' },
  { k: 'learned', label: '¿Qué aprendí?' },
] as const

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function DiarioPage() {
  const { user, loading } = useSession()
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  function load() {
    fetch('/api/journal', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setEntries(j.entries ?? []))
      .catch(() => setEntries([]))
  }
  useEffect(load, [])

  async function save() {
    setSaving(true)
    setMsg('')
    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    setSaving(false)
    if (json.ok) {
      setForm({})
      setMsg('Guardado. Solo tú puedes ver esto.')
      load()
    } else {
      setMsg(json.error || 'No se pudo guardar.')
    }
  }

  async function del(id: number) {
    await fetch(`/api/journal?id=${id}`, { method: 'DELETE' })
    load()
  }

  if (!loading && !user) {
    return (
      <>
        <PlatHeader title="Diario" sub="Privado y solo tuyo." />
        <p className="c-sub" style={{ margin: '2px 0 16px' }}>
          Nadie más puede leerlo, nunca. Necesitas una cuenta para guardarlo de forma
          segura.
        </p>
        <Link href="/entrar" className="btn block" style={{ textDecoration: 'none' }}>
          Crear cuenta o entrar
        </Link>
      </>
    )
  }

  return (
    <>
      <PlatHeader title="Diario" sub="Escribe lo que llevas dentro. Solo tú lo ves." />

      <div className="card">
        {FIELDS.map((f) => (
          <label className="field" key={f.k}>
            <span>{f.label}</span>
            <textarea
              value={form[f.k] || ''}
              onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
              rows={2}
            />
          </label>
        ))}
        <button className="btn block" onClick={save} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar entrada'}
        </button>
        {msg && <p className="plat-msg ok">{msg}</p>}
      </div>

      {entries && entries.length > 0 && (
        <>
          <h2>Tus entradas</h2>
          {entries.map((e) => (
            <div className="plat-card" key={e.id}>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--muted)',
                  margin: '0 0 10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                {fmt(e.created_at)}
                <button
                  onClick={() => del(e.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  Eliminar
                </button>
              </p>
              {FIELDS.map((f) =>
                e[f.k] ? (
                  <p key={f.k} style={{ margin: '6px 0', fontSize: 14 }}>
                    <span style={{ color: 'var(--muted)' }}>{f.label} </span>
                    {e[f.k]}
                  </p>
                ) : null,
              )}
            </div>
          ))}
        </>
      )}
    </>
  )
}
