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

function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'ahora'
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`
  if (s < 172800) return 'ayer'
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
const initials = (n: string) => n.slice(0, 2).toUpperCase()

const Heart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M12 20s-7-4.3-7-9.5A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7 3.5C19 15.7 12 20 12 20z" strokeLinejoin="round" />
  </svg>
)
const Bubble = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M5 18v-1L4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8z" strokeLinejoin="round" />
  </svg>
)
const Save = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M7 4h10v16l-5-3.5L7 20z" strokeLinejoin="round" />
  </svg>
)

export default function RefugioPage() {
  const { user, loading } = useSession()
  const [circles, setCircles] = useState<Circle[]>([])
  const [circle, setCircle] = useState<string | null>(null)
  const [subtab, setSubtab] = useState<'ti' | 'nuevas' | 'circulos' | 'siguiendo'>('ti')
  const [posts, setPosts] = useState<Post[]>([])
  const [dq, setDq] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)
  const [body, setBody] = useState('')
  const [anon, setAnon] = useState(false)
  const [msg, setMsg] = useState('')
  const [composing, setComposing] = useState(false)
  const [openPost, setOpenPost] = useState<number | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentBody, setCommentBody] = useState('')

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('circle')
    if (c) {
      setCircle(c)
      setSubtab('circulos')
    }
  }, [])

  const load = useCallback(async () => {
    setBusy(true)
    const q = circle ? `?circle=${encodeURIComponent(circle)}` : ''
    const [feed, preg] = await Promise.all([
      fetch(`/api/refugio${q}`, { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/pregunta', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({})),
    ])
    setCircles(feed.circles ?? [])
    let list: Post[] = feed.posts ?? []
    if (subtab === 'nuevas') list = [...list]
    if (subtab === 'ti') list = [...list].sort((a, b) => {
      const rc = (p: Post) => Object.values(p.reactions).reduce((x, y) => x + y, 0) + p.comments
      return rc(b) - rc(a)
    })
    setPosts(list)
    setDq(preg?.question?.question ?? null)
    setBusy(false)
  }, [circle, subtab])

  useEffect(() => {
    load()
  }, [load])

  async function publish() {
    if (!body.trim()) return
    setMsg('')
    const res = await fetch('/api/refugio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ circle: circle || 'general', body, anonymous: anon }),
    })
    const j = await res.json()
    if (j.ok) {
      setBody('')
      setComposing(false)
      load()
    } else setMsg(j.error || 'No se pudo publicar.')
  }

  async function react(id: number, kind: string) {
    await fetch(`/api/refugio/${id}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind }),
    })
    load()
  }

  async function openThread(id: number) {
    setOpenPost(id)
    setComments([])
    const j = await fetch(`/api/refugio/${id}`, { cache: 'no-store' }).then((r) => r.json())
    if (j.ok) setComments(j.comments)
  }

  async function sendComment() {
    if (!commentBody.trim() || openPost == null) return
    const j = await fetch(`/api/refugio/${openPost}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: commentBody, anonymous: anon }),
    }).then((r) => r.json())
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
  async function block(id: number) {
    if (!confirm('¿Dejar de ver las publicaciones de esta persona?')) return
    await fetch('/api/refugio/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: id }),
    })
    load()
  }
  async function del(id: number) {
    if (!confirm('¿Eliminar tu publicación?')) return
    await fetch(`/api/refugio/${id}`, { method: 'DELETE' })
    load()
  }

  if (!loading && !user) {
    return (
      <>
        <div className="plat-head">
          <div className="h-title">
            <h1>Refugio</h1>
            <p className="sub">Tu lugar seguro.</p>
          </div>
        </div>
        <p className="lede">
          Aquí puedes contar lo que llevas dentro, con tu nombre o de forma anónima, y leer
          a otras mujeres. Necesitas una cuenta para participar.
        </p>
        <Link href="/clasica#menu" className="btn block">
          Crear cuenta / entrar
        </Link>
      </>
    )
  }

  return (
    <>
      <div className="plat-head">
        <div className="h-title">
          <h1>Refugio</h1>
          <p className="sub">Tu lugar seguro.</p>
        </div>
        <button className="h-icon" onClick={() => setComposing(true)} aria-label="Publicar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {dq && (
        <div className="card navy">
          <p className="c-label">Pregunta del día</p>
          <p className="c-title" style={{ fontSize: '1.35rem' }}>{dq}</p>
          <Link href="/pregunta" style={{ color: 'var(--rose)', fontSize: 13, display: 'inline-block', marginTop: 12 }}>
            Responder →
          </Link>
        </div>
      )}

      <div className="subtabs">
        {([
          ['ti', 'Para ti'],
          ['nuevas', 'Nuevas'],
          ['circulos', 'Círculos'],
          ['siguiendo', 'Siguiendo'],
        ] as const).map(([k, l]) => (
          <button key={k} className={subtab === k ? 'on' : ''} onClick={() => setSubtab(k)}>
            {l}
          </button>
        ))}
      </div>

      {subtab === 'circulos' && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
          <button
            className="subtabs"
            style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid var(--line-2)', background: circle ? 'transparent' : 'var(--paper)', fontSize: 12, flex: 'none' }}
            onClick={() => setCircle(null)}
          >
            Todos
          </button>
          {circles.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCircle(c.slug)}
              style={{
                flex: 'none', padding: '6px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
                border: `1px solid ${c.slug === circle ? 'var(--rose)' : 'var(--line-2)'}`,
                background: c.slug === circle ? 'var(--rose-tint)' : 'transparent',
                color: 'var(--ink-soft)', fontFamily: 'var(--sans)',
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {(composing || subtab === 'siguiendo') && (
        <div className="card">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="¿Qué necesitas contar hoy?"
            style={{ width: '100%', background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--ink)', padding: '10px 12px', fontFamily: 'var(--sans)', fontSize: 15, resize: 'vertical' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-soft)', margin: '10px 0' }}>
            <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
            Publicar como anónima
          </label>
          <button className="btn block" onClick={publish} disabled={!body.trim()}>
            Compartir
          </button>
          {msg && <p className="plat-msg err">{msg}</p>}
        </div>
      )}

      {busy && <p className="plat-empty">Cargando…</p>}
      {!busy && posts.length === 0 && (
        <p className="plat-empty">Todavía no hay nada aquí. Puedes ser la primera.</p>
      )}

      {posts.map((p) => {
        const likes = p.reactions.entiendo || p.reactions.acompano || 0
        const liked = p.myReactions.length > 0
        return (
          <div className="post" key={p.id}>
            <div className="post-head">
              <span className="post-av">{initials(p.author)}</span>
              <span className="post-who">
                <span className="n">{p.author}</span>
                <span className="m">
                  {ago(p.created_at)}
                  {p.is_anonymous && ' · Anónimo'}
                </span>
              </span>
              <button
                className="post-menu"
                onClick={() => (p.isMine ? del(p.id) : report('post', p.id))}
                aria-label="Opciones"
              >
                ⋯
              </button>
            </div>
            <p className="post-body">{p.body}</p>
            {p.circle_slug !== 'general' && (
              <span className="post-tag">
                {circles.find((c) => c.slug === p.circle_slug)?.name || p.circle_slug}
              </span>
            )}
            <div className="post-actions">
              <button className={liked ? 'on' : ''} onClick={() => react(p.id, 'entiendo')}>
                <Heart /> {likes || ''}
              </button>
              <button onClick={() => (openPost === p.id ? setOpenPost(null) : openThread(p.id))}>
                <Bubble /> {p.comments || ''}
              </button>
              {!p.isMine && (
                <button onClick={() => block(p.id)} style={{ fontSize: 11 }}>
                  Bloquear
                </button>
              )}
              <button className="save" aria-label="Guardar">
                <Save />
              </button>
            </div>

            {openPost === p.id && (
              <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                {comments.map((c) => (
                  <div key={c.id} style={{ margin: '8px 0' }}>
                    <p style={{ fontSize: 11, color: 'var(--ink-mute)', margin: '0 0 2px' }}>
                      {c.author} · {ago(c.created_at)}
                      {!c.isMine && (
                        <button onClick={() => report('comment', c.id)} style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--ink-mute)', fontSize: 11, cursor: 'pointer' }}>
                          Denunciar
                        </button>
                      )}
                    </p>
                    <p style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap', color: 'var(--ink)' }}>{c.body}</p>
                  </div>
                ))}
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  rows={2}
                  placeholder="Escribe algo con cuidado…"
                  style={{ width: '100%', background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 10, color: 'var(--ink)', padding: '8px 10px', fontFamily: 'var(--sans)', fontSize: 14, marginTop: 8 }}
                />
                <button className="btn block" style={{ marginTop: 8 }} onClick={sendComment} disabled={!commentBody.trim()}>
                  Responder
                </button>
              </div>
            )}
          </div>
        )
      })}

      <div className="card" style={{ marginTop: 20 }}>
        <p className="c-label">Grupos y círculos</p>
        <p className="c-title" style={{ fontSize: '1.3rem' }}>Encuentra tu tribu.</p>
        <Link href="/circulos" style={{ color: 'var(--rose-deep)', fontSize: 13, display: 'inline-block', marginTop: 10 }}>
          Explorar →
        </Link>
      </div>

      <p className="plat-disclaimer">
        El Refugio es apoyo entre iguales, no consejo profesional. Si hay riesgo para ti o
        para alguien, mira{' '}
        <Link href="/recursos" style={{ color: 'var(--rose-deep)' }}>Recursos de ayuda</Link>.
      </p>
    </>
  )
}
