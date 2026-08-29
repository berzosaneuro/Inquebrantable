'use client'

import { useCallback, useEffect, useState } from 'react'

type User = { id: string; nick: string | null; email: string; created_at: string }
type Contact = {
  id: number
  name: string
  email: string | null
  message: string
  handled: boolean
  created_at: string
}
type Stats = {
  totalUsers: number
  testsCompleted: number
  usersWithTest: number
  pendingMessages: number
  pendingReports: number
  posts: number
  comments: number
  levels: { name: string; count: number }[]
}
type Report = {
  id: number
  target_type: 'post' | 'comment'
  target_id: number
  reason: string | null
  created_at: string
  content: { id: number; body: string; hidden: boolean } | null
}
type PostRow = {
  id: number
  circle_slug: string
  body: string
  hidden: boolean
  is_anonymous: boolean
  created_at: string
}
type DailyQ = { id: number; question: string; active: boolean }
type Data = {
  users: User[]
  contact: Contact[]
  stats: Stats
  reports: Report[]
  recentPosts: PostRow[]
  dailyQuestions: DailyQ[]
}

function fmt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [data, setData] = useState<Data | null>(null)
  const [tab, setTab] = useState<'resumen' | 'usuarias' | 'mensajes' | 'comunidad'>('resumen')
  const [newQ, setNewQ] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/data', { cache: 'no-store' })
    if (res.status === 401) {
      setAuthed(false)
      return
    }
    const json = await res.json()
    if (!json.ok) {
      setAuthed(true)
      setNotice(json.error || 'No se pudieron cargar los datos.')
      return
    }
    setAuthed(true)
    setNotice('')
    setIsOpen(Boolean(json.open))
    setData({
      users: json.users,
      contact: json.contact,
      stats: json.stats,
      reports: json.reports ?? [],
      recentPosts: json.recentPosts ?? [],
      dailyQuestions: json.dailyQuestions ?? [],
    })
  }, [])

  async function moderate(payload: Record<string, unknown>) {
    await fetch('/api/admin/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    load()
  }

  useEffect(() => {
    load()
  }, [load])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    const res = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const json = await res.json()
    if (!json.ok) {
      setErr(json.error || 'No se pudo entrar.')
      return
    }
    setPassword('')
    load()
  }

  async function logout() {
    await fetch('/api/admin/session', { method: 'DELETE' })
    setAuthed(false)
    setData(null)
  }

  async function toggleHandled(c: Contact) {
    await fetch('/api/admin/data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, handled: !c.handled }),
    })
    load()
  }

  if (authed === null) {
    return (
      <div className="adm-wrap">
        <p className="sub">Cargando…</p>
      </div>
    )
  }

  if (!authed) {
    return (
      <form className="adm-login" onSubmit={login}>
        <h1>Inquebrantable · Admin</h1>
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          autoFocus
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Entrar</button>
        <p className="err">{err}</p>
      </form>
    )
  }

  const s = data?.stats

  return (
    <div className="adm-wrap">
      <div className="adm-top">
        <div>
          <h1>Inquebrantable</h1>
          <p className="sub">Panel de administración</p>
        </div>
        <button className="ghost" onClick={logout}>
          Salir
        </button>
      </div>

      {notice && <div className="adm-notice">{notice}</div>}
      {isOpen && (
        <div
          className="adm-notice"
          style={{ background: 'rgba(178,58,95,.14)', borderColor: 'rgba(178,58,95,.4)', color: '#f0889a' }}
        >
          ⚠ Panel <strong>sin contraseña</strong>. Cualquiera con este enlace puede ver
          los datos de las usuarias. Antes de lanzar, añade la variable{' '}
          <code>ADMIN_PASSWORD</code> en Vercel.
        </div>
      )}

      <div className="adm-tabs">
        {(['resumen', 'usuarias', 'mensajes', 'comunidad'] as const).map((t) => (
          <button
            key={t}
            className={`adm-tab ${tab === t ? 'on' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'resumen'
              ? 'Resumen'
              : t === 'usuarias'
                ? `Usuarias (${data?.users.length ?? 0})`
                : t === 'mensajes'
                  ? `Mensajes (${data?.contact.length ?? 0})`
                  : `Comunidad (${data?.reports.length ?? 0})`}
          </button>
        ))}
      </div>

      {tab === 'resumen' && s && (
        <>
          <div className="adm-stats">
            <div className="adm-stat">
              <div className="n">{s.totalUsers}</div>
              <div className="l">Usuarias registradas</div>
            </div>
            <div className="adm-stat">
              <div className="n">{s.usersWithTest}</div>
              <div className="l">Han hecho el test</div>
            </div>
            <div className="adm-stat">
              <div className="n">{s.testsCompleted}</div>
              <div className="l">Tests completados</div>
            </div>
            <div className="adm-stat">
              <div className="n">{s.pendingMessages}</div>
              <div className="l">Mensajes sin atender</div>
            </div>
          </div>
          <div className="adm-bars">
            <h3>Nivel actual de las usuarias</h3>
            {s.levels.map((lv) => {
              const max = Math.max(1, ...s.levels.map((x) => x.count))
              return (
                <div className="adm-bar-row" key={lv.name}>
                  <span>{lv.name}</span>
                  <span className="adm-bar-track">
                    <span
                      className="adm-bar-fill"
                      style={{ width: `${(lv.count / max) * 100}%` }}
                    />
                  </span>
                  <span className="v">{lv.count}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === 'usuarias' && (
        <div className="adm-table-scroll">
          {data && data.users.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Nick</th>
                  <th>Email</th>
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nick || '—'}</td>
                    <td>{u.email}</td>
                    <td className="when">{fmt(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty">Todavía no hay usuarias registradas.</p>
          )}
        </div>
      )}

      {tab === 'mensajes' && (
        <div className="adm-table-scroll">
          {data && data.contact.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>De</th>
                  <th>Mensaje</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.contact.map((c) => (
                  <tr key={c.id}>
                    <td className="when">{fmt(c.created_at)}</td>
                    <td>
                      {c.name}
                      {c.email && (
                        <>
                          <br />
                          <span className="when">{c.email}</span>
                        </>
                      )}
                    </td>
                    <td className="msg">{c.message}</td>
                    <td>
                      <span className={`pill ${c.handled ? 'done' : 'pend'}`}>
                        {c.handled ? 'Atendido' : 'Pendiente'}
                      </span>
                      <br />
                      <button className="ghost" onClick={() => toggleHandled(c)}>
                        {c.handled ? 'Marcar pendiente' : 'Marcar atendido'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty">Todavía no hay mensajes de contacto.</p>
          )}
        </div>
      )}

      {tab === 'comunidad' && data && (
        <>
          <div className="adm-bars" style={{ marginBottom: 20 }}>
            <h3>Pregunta del día</h3>
            <p style={{ fontSize: 14, color: 'var(--sand)', margin: '0 0 10px' }}>
              Activa:{' '}
              <strong>
                {data.dailyQuestions.find((q) => q.active)?.question || '— ninguna —'}
              </strong>
            </p>
            <input
              type="text"
              value={newQ}
              placeholder="Nueva pregunta del día"
              onChange={(e) => setNewQ(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <button
              onClick={() => {
                if (newQ.trim().length > 3) {
                  moderate({ op: 'set-daily-question', question: newQ.trim() })
                  setNewQ('')
                }
              }}
            >
              Publicar pregunta
            </button>
          </div>

          <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--sand)' }}>
            Denuncias pendientes
          </h3>
          <div className="adm-table-scroll" style={{ marginBottom: 24 }}>
            {data.reports.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Contenido</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.reports.map((r) => (
                    <tr key={r.id}>
                      <td className="when">{fmt(r.created_at)}</td>
                      <td>{r.target_type === 'post' ? 'Publicación' : 'Comentario'}</td>
                      <td className="msg">
                        {r.content ? r.content.body : <em style={{ color: 'var(--muted)' }}>(eliminado)</em>}
                        {r.content?.hidden && <span className="pill done"> oculto</span>}
                      </td>
                      <td>
                        {r.content && (
                          <button
                            className="ghost"
                            onClick={() =>
                              moderate({
                                op: r.target_type === 'post' ? 'hide-post' : 'hide-comment',
                                id: r.target_id,
                                hidden: !r.content?.hidden,
                              })
                            }
                          >
                            {r.content.hidden ? 'Mostrar' : 'Ocultar'}
                          </button>
                        )}{' '}
                        <button
                          className="ghost"
                          onClick={() => moderate({ op: 'resolve-report', id: r.id, status: 'reviewed' })}
                        >
                          Revisado
                        </button>{' '}
                        <button
                          className="ghost"
                          onClick={() => moderate({ op: 'resolve-report', id: r.id, status: 'dismissed' })}
                        >
                          Descartar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty">No hay denuncias pendientes.</p>
            )}
          </div>

          <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--sand)' }}>
            Publicaciones recientes
          </h3>
          <div className="adm-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Círculo</th>
                  <th>Texto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.recentPosts.map((p) => (
                  <tr key={p.id}>
                    <td className="when">{fmt(p.created_at)}</td>
                    <td>{p.circle_slug}</td>
                    <td className="msg">
                      {p.body}
                      {p.hidden && <span className="pill done"> oculto</span>}
                    </td>
                    <td>
                      <button
                        className="ghost"
                        onClick={() => moderate({ op: 'hide-post', id: p.id, hidden: !p.hidden })}
                      >
                        {p.hidden ? 'Mostrar' : 'Ocultar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
