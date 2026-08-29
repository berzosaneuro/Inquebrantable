'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/useSession'
import { PlatHeader, IconPlus } from '../_ui'

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

const Heart = ({ on }: { on?: boolean }) => (
  <svg viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
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

const DQ_FALLBACK = '¿Qué pequeño paso diste hoy por ti?'
const MOCK_POSTS: Post[] = [
  {
    id: -1, circle_slug: 'despertar', author: 'AlmaLibre', body: 'Hoy elegí soltar lo que no podía controlar. Y fue el acto más valiente que he hecho 💗',
    is_anonymous: true, created_at: new Date(Date.now() - 2 * 3600e3).toISOString(), isMine: false,
    comments: 8, reactions: { entiendo: 24 }, myReactions: [],
  },
  {
    id: -2, circle_slug: 'general', author: 'Luz interior', body: 'Respirar, escribir, caminar. Pequeñas cosas que me salvan cada día.',
    is_anonymous: true, created_at: new Date(Date.now() - 26 * 3600e3).toISOString(), isMine: false,
    comments: 5, reactions: { entiendo: 18 }, myReactions: [],
  },
  {
    id: -3, circle_slug: 'general', author: 'Renaciendo', body: 'No es lineal, pero aquí estoy. Un día a la vez.',
    is_anonymous: true, created_at: new Date(Date.now() - 30 * 3600e3).toISOString(), isMine: false,
    comments: 12, reactions: { entiendo: 32 }, myReactions: [],
  },
]

export default function RefugioPage() {
  const { user, loading } = useSession()
  const [circles, setCircles] = useState<Circle[]>([])
  const [circle, setCircle] = useState<string | null>(null)
  const [subtab, setSubtab] = useState<'ti' | 'nuevas' | 'circulos' | 'siguiendo'>('ti')
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS)
  const [dq, setDq] = useState<string>(DQ_FALLBACK)
  const [demo, setDemo] = useState(true)
  const [body, setBody] = useState('')
  const [anon, setAnon] = useState(false)
  const [msg, setMsg] = useState('')
  const [composing, setComposing] = useState(false)
  const [openPost, setOpenPost] = useState<number | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentBody, setCommentBody] = useState('')

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('circle')
    if (c) { setCircle(c); setSubtab('circulos') }
  }, [])

  const load = useCallback(async () => {
    const q = circle ? `?circle=${encodeURIComponent(circle)}` : ''
    const [feed, preg] = await Promise.all([
      fetch(`/api/refugio${q}`, { cache: 'no-store' }).then((r) => r.json()).catch(() => ({})),
      fetch('/api/pregunta', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({})),
    ])
    setCircles(feed.circles ?? [])
    let list: Post[] = feed.posts ?? []
    if (list.length === 0) {
      setPosts(MOCK_POSTS)
      setDemo(true)
    } else {
      if (subtab === 'ti') list = [...list].sort((a, b) => {
        const rc = (p: Post) => Object.values(p.reactions).reduce((x, y) => x + y, 0) + p.comments
        return rc(b) - rc(a)
      })
      setPosts(list)
      setDemo(false)
    }
    setDq(preg?.question?.question ?? DQ_FALLBACK)
  }, [circle, subtab])

  useEffect(() => { load() }, [load])

  const gate = () => { window.location.href = '/clasica#menu' }

  async function publish() {
    if (!body.trim()) return
    if (demo || !user) return gate()
    setMsg('')
    const res = await fetch('/api/refugio', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ circle: circle || 'general', body, anonymous: anon }),
    })
    const j = await res.json()
    if (j.ok) { setBody(''); setComposing(false); load() }
    else setMsg(j.error || 'No se pudo publicar.')
  }
  async function react(id: number, kind: string) {
    if (demo || !user || id < 0) return gate()
    await fetch(`/api/refugio/${id}/react`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind }),
    })
    load()
  }
  async function openThread(id: number) {
    if (id < 0) { setOpenPost(openPost === id ? null : id); setComments([]); return }
    setOpenPost(id); setComments([])
    const j = await fetch(`/api/refugio/${id}`, { cache: 'no-store' }).then((r) => r.json())
    if (j.ok) setComments(j.comments)
  }
  async function sendComment() {
    if (!commentBody.trim() || openPost == null) return
    if (demo || !user || openPost < 0) return gate()
    const j = await fetch(`/api/refugio/${openPost}/comment`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: commentBody, anonymous: anon }),
    }).then((r) => r.json())
    if (j.ok) { setCommentBody(''); openThread(openPost); load() }
  }
  async function report(type: 'post' | 'comment', id: number) {
    if (id < 0) return
    if (!confirm('¿Denunciar este contenido para que lo revise el equipo?')) return
    await fetch('/api/refugio/report', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType: type, targetId: id }),
    })
    alert('Gracias. Lo revisaremos.')
  }
  async function del(id: number) {
    if (id < 0) return
    if (!confirm('¿Eliminar tu publicación?')) return
    await fetch(`/api/refugio/${id}`, { method: 'DELETE' })
    load()
  }

  const circleName = (slug: string) =>
    circles.find((c) => c.slug === slug)?.name ||
    ({ despertar: 'Despertar', general: 'General' } as Record<string, string>)[slug] ||
    slug

  return (
    <>
      <PlatHeader
        title="Refugio"
        sub="Tu lugar seguro."
        action={
          <button className="tb-btn" onClick={() => (user ? setComposing(true) : gate())} aria-label="Publicar">
            <IconPlus />
          </button>
        }
      />

      <div className="card photo dark-ph">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bg" src="/pregunta.jpg" alt="" />
        <p className="c-label">Pregunta del día</p>
        <p className="c-title" style={{ fontSize: '1.4rem', maxWidth: '15ch' }}>{dq}</p>
        <Link href="/pregunta" className="link-rose">Responder →</Link>
      </div>

      <div className="subtabs">
        {([
          ['ti', 'Para ti'], ['nuevas', 'Nuevas'], ['circulos', 'Círculos'], ['siguiendo', 'Siguiendo'],
        ] as const).map(([k, l]) => (
          <button key={k} className={subtab === k ? 'on' : ''} onClick={() => setSubtab(k)}>{l}</button>
        ))}
      </div>

      {subtab === 'circulos' && circles.length > 0 && (
        <div className="subtabs">
          <button className={circle ? '' : 'on'} onClick={() => setCircle(null)}>Todos</button>
          {circles.map((c) => (
            <button key={c.slug} className={c.slug === circle ? 'on' : ''} onClick={() => setCircle(c.slug)}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {composing && (
        <div className="card">
          <textarea
            value={body} onChange={(e) => setBody(e.target.value)} rows={3}
            placeholder="¿Qué necesitas contar hoy?"
            style={{ width: '100%', background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--ink)', padding: '10px 12px', fontFamily: 'var(--sans)', fontSize: 15, resize: 'vertical' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-soft)', margin: '10px 0' }}>
            <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
            Publicar como anónima
          </label>
          <button className="btn block" onClick={publish} disabled={!body.trim()}>Compartir</button>
          {msg && <p className="plat-msg err">{msg}</p>}
        </div>
      )}

      {posts.map((p) => {
        const likes = (p.reactions.entiendo || p.reactions.acompano || 0) + (p.myReactions.length ? 1 : 0)
        const liked = p.myReactions.length > 0
        return (
          <div className="post" key={p.id}>
            <div className="post-head">
              <span className="post-av">{initials(p.author)}</span>
              <span className="post-who">
                <span className="n">{p.author}</span>
                <span className="m">{ago(p.created_at)}{p.is_anonymous && ' · Anónimo'}</span>
              </span>
              <button className="post-menu" onClick={() => (p.isMine ? del(p.id) : report('post', p.id))} aria-label="Opciones">···</button>
            </div>
            <p className="post-body">{p.body}</p>
            {p.circle_slug !== 'general' && <span className="post-tag">{circleName(p.circle_slug)}</span>}
            <div className="post-actions">
              <button className={liked ? 'on' : ''} onClick={() => react(p.id, 'entiendo')}>
                <Heart on={liked} /> {likes || ''}
              </button>
              <button onClick={() => openThread(p.id)}>
                <Bubble /> {p.comments || ''}
              </button>
              <button className="save" aria-label="Guardar" onClick={gate}><Save /></button>
            </div>

            {openPost === p.id && (
              <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                {comments.map((c) => (
                  <div key={c.id} style={{ margin: '8px 0' }}>
                    <p style={{ fontSize: 11, color: 'var(--ink-mute)', margin: '0 0 2px' }}>
                      {c.author} · {ago(c.created_at)}
                    </p>
                    <p style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap', color: 'var(--ink)' }}>{c.body}</p>
                  </div>
                ))}
                {p.id < 0 && comments.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--ink-mute)', margin: '4px 0 10px' }}>
                    Entra para leer y responder a esta conversación.
                  </p>
                )}
                <textarea
                  value={commentBody} onChange={(e) => setCommentBody(e.target.value)} rows={2}
                  placeholder="Escribe algo con cuidado…"
                  style={{ width: '100%', background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 10, color: 'var(--ink)', padding: '8px 10px', fontFamily: 'var(--sans)', fontSize: 14, marginTop: 8 }}
                />
                <button className="btn block" style={{ marginTop: 8 }} onClick={sendComment} disabled={!commentBody.trim()}>Responder</button>
              </div>
            )}
          </div>
        )
      })}

      <div className="card photo light" style={{ marginTop: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bg" src="/refugio.jpg" alt="" />
        <p className="c-label">Grupos y círculos</p>
        <p className="c-title" style={{ fontSize: '1.35rem' }}>Encuentra tu tribu.</p>
        <Link href="/circulos" className="link-rose">Explorar →</Link>
      </div>

      <p className="plat-disclaimer">
        El Refugio es apoyo entre iguales, no consejo profesional. Si hay riesgo para ti o para
        alguien, mira <Link href="/recursos" style={{ color: 'var(--rose-deep)' }}>Recursos de ayuda</Link>.
      </p>

      {loading ? null : null}
    </>
  )
}
