'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import './admin.css'

type Level = { name: string; count: number }
type Stats = {
  totalUsers: number; newUsers7d: number; activeUsers7d: number; activeUsers30d: number
  testsCompleted: number; usersWithTest: number; pendingMessages: number; pendingReports: number
  crisisCount: number; posts: number; posts7d: number; comments: number; comments7d: number
  checkins: number; checkinsToday: number; checkins7d: number; levels: Level[]
}
type UserRow = {
  id: string; nick: string | null; email: string; created_at: string
  posts: number; checkins: number; level: number | null; lastSeen: string
  muted: boolean; note: string
}
type Contact = { id: number; name: string; email: string | null; message: string; handled: boolean; created_at: string }
type ReportRow = {
  id: number; target_type: 'post' | 'comment'; target_id: number; reason: string | null
  status: string; created_at: string
  content: { id: number; body: string; hidden: boolean; circle_slug?: string } | null
}
type Crisis = {
  kind: 'crisis' | 'violencia'; content_type: 'post' | 'comment' | 'answer'; content_id: number
  body: string; author_nick: string | null; circle_slug: string | null; created_at: string
}
type PostRow = { id: number; circle_slug: string; body: string; hidden: boolean; is_anonymous: boolean; author_nick: string | null; created_at: string }
type CommentRow = { id: number; post_id: number; body: string; hidden: boolean; author_nick: string | null; created_at: string }
type DailyQ = { id: number; question: string; active: boolean; created_at: string }

type Snap = {
  users: UserRow[]; contact: Contact[]; reports: ReportRow[]; crisis: Crisis[]
  recentPosts: PostRow[]; recentComments: CommentRow[]; dailyQuestions: DailyQ[]
  admins: string[]; growth: { day: string; count: number }[]
  moods7d: Record<string, number>; needs7d: Record<string, number>
  circles: { slug: string; name: string; posts: number }[]
  wellbeing: { n: number; avgFirst: number | null; avgLast: number | null } | null
  stats: Stats
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })
const fmtShort = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
const MOOD_LBL: Record<string, string> = { mal: 'Mal', ansiosa: 'Ansiosa', triste: 'Triste', agotada: 'Agotada', normal: 'Normal', bien: 'Bien', muy_bien: 'Muy bien' }
const NEED_LBL: Record<string, string> = { calmarme: 'Calmarme', hablar: 'Hablar', entender: 'Entender', acompanada: 'Acompañada', trabajar: 'Trabajar en mí', ayuda: 'Pedir ayuda' }
const LEVELS = ['La Grieta', 'El Despertar', 'Reconstrucción', 'Inquebrantable']

export default function AdminPage() {
  const [state, setState] = useState<'loading' | 'no-session' | 'not-admin' | 'error' | 'ok'>('loading')
  const [snap, setSnap] = useState<Snap | null>(null)
  const [tab, setTab] = useState<'resumen' | 'comunidad' | 'usuarias' | 'contenido' | 'ajustes'>('resumen')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/data', { cache: 'no-store' })
    if (r.status === 401) { setState('no-session'); return }
    if (r.status === 403) { setState('not-admin'); return }
    const j = await r.json()
    if (!j.ok) { setState('error'); return }
    setSnap(j as Snap)
    setState('ok')
  }, [])

  useEffect(() => { load() }, [load])

  async function mod(body: Record<string, unknown>) {
    setBusy(true)
    await fetch('/api/admin/moderate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {})
    await load()
    setBusy(false)
  }
  async function userOp(body: Record<string, unknown>) {
    setBusy(true)
    await fetch('/api/admin/user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {})
    await load()
    setBusy(false)
  }

  if (state === 'loading') return <div className="adm"><p className="adm-mut">Cargando…</p></div>
  if (state === 'no-session') return (
    <div className="adm adm-gate">
      <h1>Panel de Inquebrantable</h1>
      <p className="adm-mut">Necesitas iniciar sesión con una cuenta autorizada.</p>
      <Link href="/entrar?next=/admin" className="adm-btn">Iniciar sesión</Link>
    </div>
  )
  if (state === 'not-admin') return (
    <div className="adm adm-gate">
      <h1>Sin acceso</h1>
      <p className="adm-mut">Tu cuenta no está en la lista de administradoras. Si crees que es un error, contacta con quien gestiona el panel.</p>
      <Link href="/" className="adm-btn ghost">Volver a la app</Link>
    </div>
  )
  if (state === 'error' || !snap) return <div className="adm"><p className="adm-mut">No se pudo cargar el panel.</p></div>

  const s = snap.stats
  const hideOp = (t: string) => (t === 'post' ? 'hide-post' : t === 'comment' ? 'hide-comment' : 'hide-answer')

  return (
    <div className="adm">
      <header className="adm-head">
        <div>
          <h1>Inquebrantable</h1>
          <p className="adm-mut">Panel de administración</p>
        </div>
        <Link href="/" className="adm-btn ghost sm">App</Link>
      </header>

      {/* alertas */}
      {(s.crisisCount > 0 || s.pendingReports > 0 || s.pendingMessages > 0) && (
        <div className="adm-alerts">
          {s.crisisCount > 0 && <button className="adm-alert crisis" onClick={() => setTab('comunidad')}>⚠ {s.crisisCount} señal{s.crisisCount > 1 ? 'es' : ''} de riesgo sin revisar</button>}
          {s.pendingReports > 0 && <button className="adm-alert" onClick={() => setTab('comunidad')}>{s.pendingReports} denuncia{s.pendingReports > 1 ? 's' : ''} pendiente{s.pendingReports > 1 ? 's' : ''}</button>}
          {s.pendingMessages > 0 && <button className="adm-alert" onClick={() => setTab('contenido')}>{s.pendingMessages} mensaje{s.pendingMessages > 1 ? 's' : ''} sin atender</button>}
        </div>
      )}

      <nav className="adm-tabs">
        {(['resumen', 'comunidad', 'usuarias', 'contenido', 'ajustes'] as const).map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {t === 'comunidad' ? `Comunidad${s.crisisCount + s.pendingReports > 0 ? ` (${s.crisisCount + s.pendingReports})` : ''}` :
             t === 'usuarias' ? `Usuarias (${snap.users.length})` :
             t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {tab === 'resumen' && <Resumen snap={snap} />}

      {tab === 'comunidad' && (
        <>
          {snap.crisis.length > 0 && (
            <section>
              <h2>Señales de riesgo</h2>
              <p className="adm-mut sm">Detección automática por lenguaje. Revisa con criterio; puede haber falsos positivos.</p>
              {snap.crisis.map((c) => (
                <div className="adm-card crisis" key={`${c.content_type}-${c.content_id}`}>
                  <span className={`adm-badge ${c.kind}`}>{c.kind === 'crisis' ? 'Autolesión / suicidio' : 'Violencia'}</span>
                  <p className="adm-body">{c.body}</p>
                  <p className="adm-meta">{c.author_nick || 'Anónima'} · {c.content_type} · {fmtShort(c.created_at)}{c.circle_slug ? ` · ${c.circle_slug}` : ''}</p>
                  <div className="adm-actions">
                    <button disabled={busy} onClick={() => mod({ op: hideOp(c.content_type), id: c.content_id, hidden: true })}>Ocultar contenido</button>
                    <button disabled={busy} onClick={() => mod({ op: 'dismiss-crisis', contentType: c.content_type, contentId: c.content_id })}>Marcar revisado</button>
                  </div>
                </div>
              ))}
            </section>
          )}

          <section>
            <h2>Denuncias {snap.reports.length > 0 ? `(${snap.reports.length})` : ''}</h2>
            {snap.reports.length === 0 && <p className="adm-mut sm">Sin denuncias pendientes.</p>}
            {snap.reports.map((r) => (
              <div className="adm-card" key={r.id}>
                <p className="adm-body">{r.content?.body ?? '(contenido eliminado)'}</p>
                <p className="adm-meta">{r.target_type} #{r.target_id}{r.reason ? ` · motivo: ${r.reason}` : ''} · {fmtShort(r.created_at)}{r.content?.hidden ? ' · YA OCULTO' : ''}</p>
                <div className="adm-actions">
                  {r.content && !r.content.hidden && (
                    <button disabled={busy} onClick={() => mod({ op: r.target_type === 'post' ? 'hide-post' : 'hide-comment', id: r.target_id, hidden: true })}>Ocultar</button>
                  )}
                  <button disabled={busy} onClick={() => mod({ op: 'resolve-report', id: r.id, status: 'reviewed' })}>Resuelto</button>
                  <button disabled={busy} onClick={() => mod({ op: 'resolve-report', id: r.id, status: 'dismissed' })}>Descartar</button>
                </div>
              </div>
            ))}
          </section>

          <section>
            <h2>Publicaciones recientes</h2>
            {snap.recentPosts.map((p) => (
              <div className={`adm-row ${p.hidden ? 'hidden' : ''}`} key={p.id}>
                <div className="adm-row-main">
                  <p className="adm-body sm">{p.body}</p>
                  <p className="adm-meta">{p.author_nick || 'Anónima'} · {p.circle_slug} · {fmtShort(p.created_at)}{p.hidden ? ' · OCULTO' : ''}</p>
                </div>
                <button className="adm-btn sm ghost" disabled={busy} onClick={() => mod({ op: 'hide-post', id: p.id, hidden: !p.hidden })}>
                  {p.hidden ? 'Mostrar' : 'Ocultar'}
                </button>
              </div>
            ))}
          </section>

          <section>
            <h2>Comentarios recientes</h2>
            {snap.recentComments.map((c) => (
              <div className={`adm-row ${c.hidden ? 'hidden' : ''}`} key={c.id}>
                <div className="adm-row-main">
                  <p className="adm-body sm">{c.body}</p>
                  <p className="adm-meta">{c.author_nick || 'Anónima'} · post #{c.post_id} · {fmtShort(c.created_at)}{c.hidden ? ' · OCULTO' : ''}</p>
                </div>
                <button className="adm-btn sm ghost" disabled={busy} onClick={() => mod({ op: 'hide-comment', id: c.id, hidden: !c.hidden })}>
                  {c.hidden ? 'Mostrar' : 'Ocultar'}
                </button>
              </div>
            ))}
          </section>
        </>
      )}

      {tab === 'usuarias' && <Usuarias users={snap.users} busy={busy} userOp={userOp} />}

      {tab === 'contenido' && (
        <>
          <section>
            <h2>Preguntas del día</h2>
            <AddQuestion busy={busy} onAdd={(q) => mod({ op: 'add-daily-question', question: q })} />
            {snap.dailyQuestions.map((q) => (
              <div className={`adm-row ${q.active ? 'active' : ''}`} key={q.id}>
                <div className="adm-row-main">
                  <p className="adm-body sm">{q.question}</p>
                  <p className="adm-meta">{q.active ? 'ACTIVA' : 'inactiva'} · {fmt(q.created_at)}</p>
                </div>
                <div className="adm-actions">
                  <button disabled={busy} onClick={() => mod({ op: 'toggle-daily-question', id: q.id, active: !q.active })}>
                    {q.active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button disabled={busy} onClick={() => { if (confirm('¿Borrar esta pregunta?')) mod({ op: 'delete-daily-question', id: q.id }) }}>Borrar</button>
                </div>
              </div>
            ))}
          </section>

          <section>
            <h2>Mensajes de contacto</h2>
            {snap.contact.length === 0 && <p className="adm-mut sm">Sin mensajes.</p>}
            {snap.contact.map((c) => (
              <div className={`adm-card ${c.handled ? 'done' : ''}`} key={c.id}>
                <p className="adm-body">{c.message}</p>
                <p className="adm-meta">{c.name}{c.email ? ` · ${c.email}` : ''} · {fmt(c.created_at)}</p>
                <div className="adm-actions">
                  {c.email && <a href={`mailto:${c.email}?subject=Re: tu mensaje a Inquebrantable`}>Responder por email</a>}
                  <button disabled={busy} onClick={() => mod({ op: 'handle-message', id: c.id, handled: !c.handled })}>
                    {c.handled ? 'Marcar pendiente' : 'Marcar atendido'}
                  </button>
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      {tab === 'ajustes' && (
        <section>
          <h2>Administradoras</h2>
          <p className="adm-mut sm">Emails con acceso a este panel. Deben tener una cuenta de Inquebrantable con ese email.</p>
          <AddAdmin busy={busy} onAdd={(e) => mod({ op: 'add-admin', email: e })} />
          {snap.admins.map((e) => (
            <div className="adm-row" key={e}>
              <div className="adm-row-main"><p className="adm-body sm">{e}</p></div>
              {snap.admins.length > 1 && (
                <button className="adm-btn sm ghost" disabled={busy} onClick={() => { if (confirm(`¿Quitar acceso a ${e}?`)) mod({ op: 'remove-admin', email: e }) }}>Quitar</button>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

/* ── sub-vistas ── */

function Bars({ data, max }: { data: { label: string; value: number }[]; max?: number }) {
  const m = max ?? Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="adm-bars">
      {data.map((d) => (
        <div className="adm-bar" key={d.label}>
          <span className="adm-bar-track"><span style={{ height: `${(d.value / m) * 100}%` }} /></span>
          <span className="adm-bar-val">{d.value}</span>
          <span className="adm-bar-lbl">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function Resumen({ snap }: { snap: Snap }) {
  const s = snap.stats
  return (
    <>
      <section>
        <h2>Usuarias</h2>
        <div className="adm-kpis">
          <div className="adm-kpi"><b>{s.totalUsers}</b><span>totales</span></div>
          <div className="adm-kpi"><b>{s.newUsers7d}</b><span>nuevas · 7d</span></div>
          <div className="adm-kpi"><b>{s.activeUsers7d}</b><span>activas · 7d</span></div>
          <div className="adm-kpi"><b>{s.activeUsers30d}</b><span>activas · 30d</span></div>
        </div>
      </section>

      <section>
        <h2>Actividad · últimos 7 días</h2>
        <div className="adm-kpis">
          <div className="adm-kpi"><b>{s.checkinsToday}</b><span>check-ins hoy</span></div>
          <div className="adm-kpi"><b>{s.checkins7d}</b><span>check-ins</span></div>
          <div className="adm-kpi"><b>{s.posts7d}</b><span>publicaciones</span></div>
          <div className="adm-kpi"><b>{s.comments7d}</b><span>comentarios</span></div>
        </div>
      </section>

      <section>
        <h2>Altas · últimos 14 días</h2>
        <Bars data={snap.growth.map((g) => ({ label: new Date(g.day).getDate().toString(), value: g.count }))} />
      </section>

      {Object.keys(snap.moods7d).length > 0 && (
        <section>
          <h2>Cómo llegan · check-ins 7d</h2>
          <Bars data={Object.entries(snap.moods7d).map(([k, v]) => ({ label: MOOD_LBL[k] ?? k, value: v }))} />
        </section>
      )}

      {Object.keys(snap.needs7d).length > 0 && (
        <section>
          <h2>Qué necesitan · 7d</h2>
          <Bars data={Object.entries(snap.needs7d).map(([k, v]) => ({ label: NEED_LBL[k] ?? k, value: v }))} />
        </section>
      )}

      <section>
        <h2>Nivel actual de las usuarias</h2>
        <Bars data={s.levels.map((l) => ({ label: l.name.replace('El ', ''), value: l.count }))} />
      </section>

      {snap.wellbeing && snap.wellbeing.n > 0 && (
        <section>
          <h2>Bienestar general</h2>
          <div className="adm-card">
            <p className="adm-body">
              Media al empezar: <b>{snap.wellbeing.avgFirst ?? '—'}</b> → última media: <b>{snap.wellbeing.avgLast ?? '—'}</b>
            </p>
            <p className="adm-meta">sobre {snap.wellbeing.n} usuaria{snap.wellbeing.n > 1 ? 's' : ''} con al menos un test</p>
          </div>
        </section>
      )}

      <section>
        <h2>Círculos</h2>
        {snap.circles.filter((c) => c.posts > 0).sort((a, b) => b.posts - a.posts).map((c) => (
          <div className="adm-row" key={c.slug}>
            <div className="adm-row-main"><p className="adm-body sm">{c.name}</p></div>
            <span className="adm-mut">{c.posts} post{c.posts > 1 ? 's' : ''}</span>
          </div>
        ))}
        {snap.circles.every((c) => c.posts === 0) && <p className="adm-mut sm">Todavía no hay publicaciones en ningún círculo.</p>}
      </section>
    </>
  )
}

function Usuarias({ users, busy, userOp }: { users: UserRow[]; busy: boolean; userOp: (b: Record<string, unknown>) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const filtered = users.filter((u) =>
    !q || (u.nick ?? '').toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))

  return (
    <section>
      <input className="adm-input" placeholder="Buscar por nick o email…" value={q} onChange={(e) => setQ(e.target.value)} />
      {filtered.map((u) => {
        const active = open === u.id
        const seen = new Date(u.lastSeen).getFullYear() > 1971 ? `activa ${fmtShort(u.lastSeen)}` : 'sin actividad'
        return (
          <div className={`adm-row col ${u.muted ? 'muted' : ''}`} key={u.id}>
            <button className="adm-user-top" onClick={() => { setOpen(active ? null : u.id); setNote(u.note) }}>
              <div className="adm-row-main">
                <p className="adm-body sm">{u.nick || '(sin nick)'} {u.muted && <span className="adm-badge">silenciada</span>}</p>
                <p className="adm-meta">{u.email} · alta {fmtShort(u.created_at)} · {seen}</p>
              </div>
              <span className="adm-mut sm">{LEVELS[u.level ?? -1] ? LEVELS[u.level as number].replace('El ', '') : 'sin test'} · {u.posts}p</span>
            </button>
            {active && (
              <div className="adm-user-detail">
                <div className="adm-kpis sm">
                  <div className="adm-kpi"><b>{u.checkins}</b><span>check-ins</span></div>
                  <div className="adm-kpi"><b>{u.posts}</b><span>posts</span></div>
                  <div className="adm-kpi"><b>{LEVELS[u.level ?? -1] ? (u.level as number) + 1 : '—'}</b><span>nivel</span></div>
                </div>
                <p className="adm-mut sm">El diario es privado y no se muestra nunca.</p>
                <label className="adm-field">
                  <span>Nota interna</span>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Solo la ves el equipo de admin" />
                </label>
                <div className="adm-actions">
                  <button disabled={busy} onClick={() => userOp({ op: 'note', userId: u.id, note })}>Guardar nota</button>
                  {u.muted
                    ? <button disabled={busy} onClick={() => userOp({ op: 'mute', userId: u.id, muted: false })}>Reactivar en Refugio</button>
                    : <button disabled={busy} onClick={() => { const r = prompt('Motivo (opcional):') ?? undefined; userOp({ op: 'mute', userId: u.id, muted: true, reason: r }) }}>Silenciar en Refugio</button>}
                </div>
              </div>
            )}
          </div>
        )
      })}
      {filtered.length === 0 && <p className="adm-mut sm">Sin resultados.</p>}
    </section>
  )
}

function AddQuestion({ busy, onAdd }: { busy: boolean; onAdd: (q: string) => void }) {
  const [v, setV] = useState('')
  return (
    <div className="adm-add">
      <input className="adm-input" placeholder="Nueva pregunta del día…" value={v} onChange={(e) => setV(e.target.value)} />
      <button className="adm-btn sm" disabled={busy || v.trim().length < 4} onClick={() => { onAdd(v.trim()); setV('') }}>Añadir</button>
    </div>
  )
}

function AddAdmin({ busy, onAdd }: { busy: boolean; onAdd: (e: string) => void }) {
  const [v, setV] = useState('')
  return (
    <div className="adm-add">
      <input className="adm-input" placeholder="email@ejemplo.com" value={v} onChange={(e) => setV(e.target.value)} />
      <button className="adm-btn sm" disabled={busy || !v.includes('@')} onClick={() => { onAdd(v.trim()); setV('') }}>Añadir</button>
    </div>
  )
}
