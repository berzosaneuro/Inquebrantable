'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/useSession'

type Circle = { slug: string; name: string; description: string | null }
type Post = {
  id: number
  circle_slug: string
  author: string
  body: string
  is_anonymous: boolean
  created_at: string
  isMine: boolean
  comments: number
  reactions: Record<string, number>
  myReactions: string[]
}
type Comment = { id: number; author: string; body: string; created_at: string; isMine: boolean }

const REACTIONS = [
  { k: 'acompano', label: '🫂 Te acompaño' },
  { k: 'entiendo', label: '❤️ Te entiendo' },
  { k: 'yo_tambien', label: '🌱 Yo también' },
  { k: 'gracias', label: '💜 Gracias por contarlo' },
]

function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'ahora'
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function RefugioPage() {
  const { user, loading } = useSession()
  const [circles, setCircles] = useState<Circle[]>([])
  const [circle, setCircle] = useState('general')

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('circle')
    if (c) setCircle(c)
  }, [])
  const [posts, setPosts] = useState<Post[]>([])
  const [busy, setBusy] = useState(true)
  const [body, setBody] = useState('')
  const [anon, setAnon] = useState(false)
  const [msg, setMsg] = useState('')
  const [openPost, setOpenPost] = useState<number | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentBody, setCommentBody] = useState('')

  const load = useCallback(async () => {
    setBusy(true)
    const res = await fetch(`/api/refugio?circle=${encodeURIComponent(circle)}`, { cache: 'no-store' })
    const j = await res.json()
    setCircles(j.circles ?? [])
    setPosts(j.posts ?? [])
    setBusy(false)
  }, [circle])

  useEffect(() => {
    load()
  }, [load])

  async function publish() {
    if (!body.trim()) return
    setMsg('')
    const res = await fetch('/api/refugio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ circle, body, anonymous: anon }),
    })
    const j = await res.json()
    if (j.ok) {
      setBody('')
      load()
    } else {
      setMsg(j.error || 'No se pudo publicar.')
    }
  }

  async function react(postId: number, kind: string) {
    await fetch(`/api/refugio/${postId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind }),
    })
    load()
  }

  async function openThread(id: number) {
    setOpenPost(id)
    setComments([])
    const res = await fetch(`/api/refugio/${id}`, { cache: 'no-store' })
    const j = await res.json()
    if (j.ok) setComments(j.comments)
  }

  async function sendComment() {
    if (!commentBody.trim() || openPost == null) return
    const res = await fetch(`/api/refugio/${openPost}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: commentBody, anonymous: anon }),
    })
    const j = await res.json()
    if (j.ok) {
      setCommentBody('')
      openThread(openPost)
      load()
    }
  }

  async function report(type: 'post' | 'comment', id: number) {
    if (!confirm('¿Denunciar este contenido para que lo revise el equipo?')) return
    await fetch('/api/refugio/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType: type, targetId: id }),
    })
    alert('Gracias. Lo revisaremos.')
  }

  async function block(postId: number) {
    if (!confirm('¿Dejar de ver las publicaciones de esta persona?')) return
    await fetch('/api/refugio/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    })
    load()
  }

  async function del(postId: number) {
    if (!confirm('¿Eliminar tu publicación?')) return
    await fetch(`/api/refugio/${postId}`, { method: 'DELETE' })
    load()
  }

  if (!loading && !user) {
    return (
      <>
        <p className="eyebrow">El Refugio</p>
        <h1>Un lugar donde te leen otras mujeres</h1>
        <p className="lede">
          Aquí puedes contar lo que llevas dentro, con tu nombre o de forma anónima. Para
          participar necesitas una cuenta.
        </p>
        <Link href="/clasica#menu" className="plat-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          Crear cuenta / entrar
        </Link>
      </>
    )
  }

  const activeCircle = circles.find((c) => c.slug === circle)

  return (
    <>
      <p className="eyebrow">El Refugio</p>
      <h1>{activeCircle?.name || 'Comunidad'}</h1>
      {activeCircle?.description && <p className="lede">{activeCircle.description}</p>}

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 0 14px', margin: 0 }}>
        {circles.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCircle(c.slug)}
            className="plat-opt"
            style={{
              flex: 'none',
              padding: '6px 12px',
              fontSize: 12,
              borderColor: c.slug === circle ? 'var(--rose)' : 'var(--border)',
              background: c.slug === circle ? 'rgba(224,80,138,0.12)' : 'var(--card2)',
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="plat-card">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="¿Qué necesitas contar hoy?"
          style={{
            width: '100%',
            background: 'var(--card2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            color: 'var(--cream)',
            padding: '10px 12px',
            fontFamily: 'inherit',
            fontSize: 15,
            resize: 'vertical',
          }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--sand)', margin: '10px 0' }}>
          <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
          Publicar como anónima
        </label>
        <button className="plat-btn" onClick={publish} disabled={!body.trim()}>
          Compartir
        </button>
        {msg && <p className="plat-msg err">{msg}</p>}
      </div>

      {busy && <p className="plat-empty">Cargando…</p>}
      {!busy && posts.length === 0 && (
        <p className="plat-empty">Todavía no hay nada aquí. Puedes ser la primera.</p>
      )}

      {posts.map((p) => (
        <div className="plat-card" key={p.id}>
          <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', margin: '0 0 8px' }}>
            <span>{p.author} · {ago(p.created_at)}</span>
            <span>
              {p.isMine ? (
                <button onClick={() => del(p.id)} style={ghostBtn}>Eliminar</button>
              ) : (
                <>
                  <button onClick={() => report('post', p.id)} style={ghostBtn}>Denunciar</button>{' '}
                  <button onClick={() => block(p.id)} style={ghostBtn}>Bloquear</button>
                </>
              )}
            </span>
          </p>
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{p.body}</p>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0 4px' }}>
            {REACTIONS.map((r) => {
              const on = p.myReactions.includes(r.k)
              const n = p.reactions[r.k] || 0
              return (
                <button
                  key={r.k}
                  onClick={() => react(p.id, r.k)}
                  style={{
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: '5px 10px',
                    borderRadius: 999,
                    border: `1px solid ${on ? 'var(--rose)' : 'var(--border)'}`,
                    background: on ? 'rgba(224,80,138,0.14)' : 'transparent',
                    color: on ? 'var(--cream)' : 'var(--sand)',
                  }}
                >
                  {r.label}
                  {n > 0 && ` ${n}`}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => (openPost === p.id ? setOpenPost(null) : openThread(p.id))}
            style={{ ...ghostBtn, fontSize: 13, marginTop: 6 }}
          >
            {p.comments > 0 ? `${p.comments} respuesta${p.comments > 1 ? 's' : ''}` : 'Responder'}
          </button>

          {openPost === p.id && (
            <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              {comments.map((c) => (
                <div key={c.id} style={{ margin: '8px 0' }}>
                  <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 2px' }}>
                    {c.author} · {ago(c.created_at)}
                    {!c.isMine && (
                      <button onClick={() => report('comment', c.id)} style={{ ...ghostBtn, marginLeft: 8 }}>
                        Denunciar
                      </button>
                    )}
                  </p>
                  <p style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap' }}>{c.body}</p>
                </div>
              ))}
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                rows={2}
                placeholder="Escribe algo con cuidado…"
                style={{
                  width: '100%',
                  background: 'var(--card2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  color: 'var(--cream)',
                  padding: '8px 10px',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  marginTop: 8,
                }}
              />
              <button className="plat-btn" style={{ marginTop: 8 }} onClick={sendComment} disabled={!commentBody.trim()}>
                Responder
              </button>
            </div>
          )}
        </div>
      ))}

      <p className="plat-disclaimer">
        El Refugio es un espacio de apoyo entre iguales, no de consejo profesional. Si hay
        riesgo para ti o para alguien, mira{' '}
        <Link href="/recursos" style={{ color: 'var(--rose)' }}>
          Recursos de ayuda
        </Link>
        .
      </p>
    </>
  )
}

const ghostBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--muted)',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'inherit',
  padding: 0,
}
