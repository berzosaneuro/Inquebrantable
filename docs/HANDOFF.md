# INQUEBRANTABLE — Documento de traspaso (estado a 29 ago 2026)

Plataforma de acompañamiento emocional para mujeres. Este documento describe **todo
lo que existe** para que otra persona (o IA) pueda continuar sin volver a auditar.

- **Producción:** https://inquebrantable.vercel.app
- **Repo:** `github.com/berzosaneuro/Inquebrantable` — rama `main` (deploy automático en Vercel)
- **Proyecto Vercel:** `inquebrantable` (team `berzosaneuros-projects`)

---

## 0. Regla de oro

**Un solo proyecto, una sola base de código, una sola base de datos.**
No crear repos, apps, "v2", frontends/backends paralelos ni un segundo proyecto Supabase.
Reutilizar lo que existe. Mínimo toque, máximo resultado.

---

## 1. Stack

| | |
|---|---|
| Framework | Next.js 14.2 (App Router) |
| Lenguaje | TypeScript 5.9 (`strict`) |
| UI | React 18.3 |
| Estilos | CSS plano con variables (`src/app/globals.css`). **No hay Tailwind.** |
| Backend | Route Handlers de Next + Supabase |
| Base de datos / Auth | **Supabase** — proyecto compartido **"Elias Fitness"** (`ref: fuuyljsewwarroiyojdw`), todas las tablas con prefijo `inq_` |
| Validación | `zod` |
| Deps | `@supabase/ssr`, `@supabase/supabase-js`, `zod`. Nada más. |
| PWA | `public/manifest.json` + `public/service-worker.js` (cache v3) |

> Supabase "Elias Fitness" aloja también otras herramientas del propietario. **Nunca
> tocar tablas/funciones que no empiecen por `inq_`.** No crear triggers en `auth.users`.

---

## 2. Estructura del repo

```
public/
  legacy-app.js        La app original (≈2100 líneas JS vanilla). El comportamiento
                       de las 13 pantallas "clásicas" vive aquí.
  inq-sync.js          Puente localStorage ↔ backend. Se carga ANTES de legacy-app.js.
  manifest.json, service-worker.js, icon-*.png

src/
  app/
    layout.tsx         Root layout: metadatos PWA, carga inq-sync.js + legacy-app.js
    globals.css        Sistema de diseño (tokens :root) + CSS de la app clásica
    page.tsx           "/" — sirve el markup clásico (src/legacy/app-body.html) +
                       inyecta el estado inicial en <script id="__inq_boot">
    robots.ts, sitemap.ts

    (plataforma)/      RUTAS NUEVAS EN REACT (comparten layout con nav propio)
      layout.tsx  Nav.tsx  plataforma.css
      hoy/  evaluacion/  mapa/  diario/  progreso/
      refugio/  circulos/  pregunta/
      herramientas/  recursos/

    (landing)/[tema]/   Landings de captación (SSG, dynamicParams=false)
      page.tsx  landing.css

    admin/             Panel admin (React client component)
      page.tsx  layout.tsx  admin.css

    api/               Route Handlers (todos `export const dynamic = 'force-dynamic'`)
      auth/{signup,login,logout,session}
      state              GET (hidrata) / POST {key,value} (guarda) — clave-valor por usuaria
      contact            POST → inq_contact_messages
      checkin            POST/GET → inq_checkins
      evaluacion         POST (puntúa) / GET (historial) → inq_test_results kind='full'
      journal            GET/POST/DELETE → inq_journal
      progreso           GET → agrega racha, logros, evolución
      hablar             POST → capa de crisis + IA (o motor offline)
      pregunta           GET/POST → inq_daily_questions / inq_daily_answers
      refugio            GET (feed) / POST (publicar)
      refugio/[id]       GET (detalle+comentarios) / DELETE (propio)
      refugio/[id]/comment   POST
      refugio/[id]/react     POST (toggle)
      refugio/{report,block} POST
      admin/data         GET (snapshot vía RPC) / PATCH (marcar mensaje atendido)
      admin/moderate     POST (ocultar, resolver denuncia, cambiar pregunta del día)
      admin/session      POST/DELETE (login por contraseña, opcional)

  legacy/
    app-body.html       Markup del <body> de la app clásica (editado mínimamente)
    original-index.html  El index.html original completo (referencia, no se sirve)

  lib/
    supabase/env.ts     Lee NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
    supabase/server.ts  createServerSupabase() — cliente SSR con cookies (@supabase/ssr)
    admin-auth.ts       isAdmin(), adminIsOpen() (true si no hay ADMIN_PASSWORD)
    evaluacion.ts       DIMENSIONS, QUESTIONS (16), LEVELS (4), scoreAssessment()
    refugio.ts          getAuthUser(), nickOf(), contieneInsulto() (filtro de respeto)
    useSession.ts       hook cliente → GET /api/auth/session
```

### Cómo conviven la "app clásica" y la "plataforma nueva"

- `/` = app clásica (13 pantallas: Inicio, Historia, Test, Niveles, Refugio, Ritual,
  Cuenta, SOS, Progreso, **Hablar** (antes "Terapia"), Notificaciones, Premium, Programas).
  Es HTML+CSS+JS servido dentro de Next; navega con JS (`go('pantalla')`), no con rutas.
- Rutas nuevas React (`/hoy`, `/evaluacion`, `/mapa`, `/diario`, `/progreso`,
  `/refugio`, `/circulos`, `/pregunta`, `/herramientas`, `/recursos`) = experiencia nueva.
- **Deep-links** desde React a la app clásica: `/#sos`, `/#refugio`, `/#ritual`,
  `/#programas`, `/#menu` (legacy-app.js escucha `hashchange` y llama a `go()`).
- La app clásica enlaza a `/hoy` desde el logo y desde el menú lateral ("Hoy · ¿cómo estás?").

---

## 3. Sistema de diseño

Definido en `src/app/globals.css` como variables CSS en `:root`. **Tema único oscuro**
(azul noche + magenta + crema). No hay modo claro.

```css
--bg:       #080B14   /* fondo principal */
--bg2:      #0C1020
--card:     #111628   /* superficie de tarjetas */
--card2:    #161D32   /* superficie secundaria / inputs */
--gold:     #F0E6D3   /* acento crema (mensajes de éxito) */
--gold2:    #FAF3EA
--terra:    #C4306A   /* magenta principal (botones) */
--rose:     #E0508A   /* rosa (acentos, enlaces, activos) */
--cream:    #F0E8DC   /* texto principal */
--sand:     #C8BAA8   /* texto secundario */
--muted:    rgba(240,232,220,0.42)   /* texto apagado */
--muted2:   rgba(240,232,220,0.25)
--border:   rgba(196,48,106,0.18)    /* bordes sutiles magenta */
--border2:  rgba(196,48,106,0.30)
--glow:     rgba(196,48,106,0.08)
```

Semánticos usados en pantallas nuevas: verde `#7FB894` (bien/logro), ámbar `#D6A06A`
(atención), rojo `#F0889A` / `#B23A5F` (error/crisis).

**Tipografía** (Google Fonts, `@import` al inicio de `globals.css`, cacheadas por el SW):
- Títulos: **Cormorant Garamond** (serif). En pantallas nuevas se usa `Georgia` como
  equivalente rápido en algunos sitios — unificar a Cormorant si se retoca.
- Cuerpo: **DM Sans**.

**CSS de las pantallas nuevas:**
- `src/app/(plataforma)/plataforma.css` — todo bajo `.plat`. Clases: `.plat-wrap`,
  `.plat-nav`, `.plat-card`, `.plat-btn` (+ `.ghost`), `.plat-options` (grid de
  opciones), `.plat-opt` (+ `.sel`), `.plat-progress`, `.plat-map-row/-track/-fill`,
  `.plat-level`, `.plat-reco`, `.plat-disclaimer`, `.plat-msg` (+ `.err`/`.ok`),
  `.plat-empty`.
- `src/app/admin/admin.css` — todo bajo `.adm`.
- Contenedor con scroll: las pantallas nuevas usan `position:fixed; inset:0;
  overflow-y:auto` porque `globals.css` fija `html/body` a `overflow:hidden` (para la
  app clásica de pantalla completa).

**Nivel narrativo** (no clínico): 0 La Grieta · 1 El Despertar · 2 Reconstrucción · 3 Inquebrantable.

---

## 4. Base de datos (Supabase `fuuyljsewwarroiyojdw`, schema `public`, prefijo `inq_`)

Todas con **RLS activado**. `user_id` referencia `auth.users(id) on delete cascade`.

| Tabla | Columnas clave | RLS |
|---|---|---|
| `inq_profiles` | id (=auth.users), nick, bio, extra jsonb | solo `id = auth.uid()` |
| `inq_kv` | (user_id, key) PK, value jsonb | solo propia. Espejo de `localStorage` (claves `inq-*` salvo `inq-session/-accounts/-premium-trial/-contact-msgs`) |
| `inq_test_results` | user_id, score, level_idx, **kind** ('quick'\|'full'), **dimensions** jsonb, **answers** jsonb | solo propia |
| `inq_checkins` | user_id, mood, need, created_at | solo propia |
| `inq_journal` | user_id, occurred/feeling/need/did/learned | solo propia (privado total) |
| `inq_contact_messages` | name, email, message, handled | INSERT público; SELECT solo vía RPC admin |
| `inq_circles` | slug PK, name, description, sort | SELECT público. Seed: general, ansiedad, autoestima, rupturas, relaciones, limites, dependencia, recuperacion, reconstruccion |
| `inq_posts` | user_id, circle_slug, author_nick (null si anónima), body, is_anonymous, hidden | SELECT: `hidden=false` y autor no bloqueado. INSERT/UPDATE/DELETE propios |
| `inq_comments` | post_id, user_id, author_nick, body, is_anonymous, hidden | igual que posts |
| `inq_reactions` | (post_id, user_id, kind) PK. kind ∈ acompano\|entiendo\|yo_tambien\|gracias | SELECT todos; write propia |
| `inq_blocks` | (blocker_id, blocked_id) PK | solo `blocker_id = auth.uid()` |
| `inq_reports` | target_type ('post'\|'comment'), target_id, reporter_id, reason, status ('pending'\|'reviewed'\|'dismissed') | INSERT propia |
| `inq_daily_questions` | question, active | SELECT solo `active=true` |
| `inq_daily_answers` | question_id, user_id, author_nick, body, is_anonymous(def true), hidden | SELECT no oculto; INSERT propia |
| `inq_admin_allowlist` | email PK | sin políticas (solo se gestiona desde el SQL editor) |

### Funciones (RPC) `SECURITY DEFINER`

- `inq_is_admin() → boolean` — **true si `inq_admin_allowlist` está vacía** (modo abierto),
  o si `auth.jwt()->>'email'` está en la allowlist.
- `inq_admin_snapshot() → jsonb` — devuelve `{ users, contact, reports, recentPosts,
  dailyQuestions, stats }`. Lo consume `/api/admin/data`.
- `inq_admin_moderate(p_op, p_id, p_bool, p_text) → void` — ops: `hide-post`,
  `hide-comment`, `resolve-report`, `handle-message`, `set-daily-question`.
- Gate: ambas llaman a `inq_is_admin()`. Concedidas a `anon` y `authenticated`.

**Para CERRAR el panel admin:** `insert into inq_admin_allowlist (email) values ('correo@…');`
(y opcionalmente `ADMIN_PASSWORD` en Vercel para la capa de la app).

### Migraciones aplicadas (en orden)

`inquebrantable_phase2_core`, `inquebrantable_phase2_kv_store`,
`inquebrantable_block2_checkins_assessment`, `inquebrantable_block3_journal`,
`inquebrantable_block4_refugio`, `inquebrantable_admin_rpc`.
Todas idempotentes. **Advisors de seguridad: 0 avisos sobre tablas `inq_*`.**

---

## 5. Auth y sesión

- **Supabase Auth**, email + contraseña. `@supabase/ssr` con cookies (SSR real).
- **Confirmación de email DESACTIVADA** en el proyecto Supabase (no hay SMTP). Pendiente:
  integrar Resend para confirmación + reset de contraseña.
- `src/app/page.tsx` (server) lee la sesión, trae `inq_kv` y lo pasa al cliente vía
  `<script id="__inq_boot" type="application/json">`.
- `public/inq-sync.js` lee ese script, escribe `inq-session` + el estado en
  `localStorage` (con el setter original), y **parchea `localStorage.setItem`** para
  reenviar cada escritura `inq-*` a `POST /api/state` (debounce 600 ms).
- Las 4 funciones de auth de la app clásica (`handleRegister/handleLogin/handleLogout/
  handleContact`) llaman a `window.__inqAuth.*` (definido en `inq-sync.js`) y tras
  éxito hacen `location.reload()` para rehidratar desde servidor.

---

## 6. "Hablar" (antes "Terapia") + seguridad de crisis

- `POST /api/hablar` con `{ answers: string[], nick? }`:
  1. Guarda la entrada en `inq_kv` (`inq-hablar-ultima`) si hay sesión.
  2. **Detección de crisis** (`RISK[]` en el route): si el texto contiene señales de
     riesgo (suicidio, autolesión, violencia) → devuelve `{ crisis:true, message }` con
     recursos 024/016/112. **No** se hace análisis normal.
  3. Si hay `ANTHROPIC_API_KEY` → llama a Claude (`claude-sonnet-5`) con un system prompt
     de "acompañante, NO terapeuta, NO diagnostica" → `{ text }`.
  4. Sin clave → `{ useOffline:true }` y el cliente usa su motor de reglas offline
     (`generarValoracionTerapia` en `legacy-app.js`).
- La app clásica (`generarEvaluacionIA` en `legacy-app.js`) fue reescrita para llamar a
  `/api/hablar`. Muestra siempre el disclaimer "no sustituye a un profesional".

---

## 7. Variables de entorno

### Puestas en Vercel (funcionando)
```
NEXT_PUBLIC_SUPABASE_URL       = https://fuuyljsewwarroiyojdw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = (JWT anon, es público por diseño, protegido por RLS)
```

### Pendientes (el propietario debe añadirlas)
```
ADMIN_PASSWORD              → cierra la capa de app del panel /admin (mín. 6). Sin ella el panel está ABIERTO.
SUPABASE_SERVICE_ROLE_KEY   → opcional; el panel ya NO lo necesita (usa RPC). Útil para webhooks de Stripe.
ANTHROPIC_API_KEY           → activa la IA real de "Hablar" (ya hay arquitectura + fallback offline).
NEXT_PUBLIC_APP_URL         → https://inquebrantable.vercel.app (para robots/sitemap; ahora usa default).
STRIPE_*                    → Bloque 7 (Premium), sin empezar.
RESEND_API_KEY / SMTP       → email transaccional (confirmación, reset).
```

`vercel.json` fija `"framework": "nextjs"` (el proyecto estaba como estático).

---

## 8. Estado por bloques (del prompt maestro)

| Bloque | Estado | Notas |
|---|---|---|
| 1 · Fundamentos (Supabase, Auth, RLS, admin) | ✅ | Admin operativo en modo abierto. Falta cerrarlo + email. |
| 2 · HOY, check-in, test ampliado, mapa emocional, revisiones | ✅ | Test: 16 preguntas / 8 dimensiones. Mapa con antes→ahora. |
| 3 · Diario, Microherramientas, Progreso | ✅ | Diario privado, 7 herramientas, Progreso con "has vuelto" + 10 logros sin ranking. |
| 3 · Programas / Niveles ampliados | ⏳ | Siguen los 4 programas legacy (funcionan, sincronizan). No hay categorías nuevas ni más programas. Niveles: navegación no rehecha. |
| 4 · Refugio real (posts, comentarios, reacciones, anónimo, denuncia, bloqueo, círculos) | ✅ | 9 círculos. 4 reacciones de apoyo. Pregunta del día social + editable por admin. |
| 5 · Moderación + Panel admin + Recursos | ✅ | Panel: Resumen / Usuarias / Mensajes / Comunidad. Recursos: 016, 024, 112, T. Esperanza, Cruz Roja, ANAR (reales). |
| 5 · SOS reestructurado (Calmarme/Hablar/Ayuda/Peligro) | ⏳ | Sigue el 4-7-8 legacy. Falta el menú de 4 accesos. |
| 6 · HABLAR + crisis | ✅ arquitectura | Rename hecho. Detección de crisis verificada. IA real pendiente de `ANTHROPIC_API_KEY`. |
| 7 · Premium / Stripe / notificaciones avanzadas | ❌ | Sin empezar. El prompt pedía dejarlo para el final; necesita Stripe. |
| 8 · SEO / landings | ✅ parcial | robots, sitemap, metadata, landings `/test /ansiedad /autoestima /limites /ruptura /relaciones /dependencia`. |
| 8 · Accesibilidad / PWA polish / rendimiento / móvil real | ⏳ | HTML semántico y mobile-first, pero sin auditoría a11y dedicada ni pruebas en dispositivo. |
| Cuenta ampliada (borrar cuenta/datos, sesiones, preferencias) | ❌ | La app clásica tiene perfil básico. Falta gestión de cuenta. |
| Notificaciones útiles | ⏳ | Siguen siendo solo locales (legacy). Sin push real. |

---

## 9. Convenciones para continuar

1. **Rama `main`, deploy automático.** Verificar `npm run build` local antes de push.
2. **Nuevas pantallas** → route en `src/app/(plataforma)/<nombre>/page.tsx`,
   `'use client'`, reutilizar clases `.plat-*` y `useSession()`. Añadir enlace en `Nav.tsx`.
3. **Nuevo endpoint** → `src/app/api/<...>/route.ts`, `export const dynamic =
   'force-dynamic'`, validar el body con `zod`, `getAuthUser()` de `lib/refugio.ts` o
   `createServerSupabase()` de `lib/supabase/server.ts`.
4. **Nueva tabla** → primero comprobar si se puede ampliar una existente. Si no,
   migración `apply_migration` con nombre `inquebrantable_<bloque>_<tema>`, prefijo
   `inq_`, RLS obligatoria, **sin triggers en `auth.users`**. Correr advisors después.
5. **App clásica** (`public/legacy-app.js`, `src/legacy/app-body.html`): tocar lo mínimo.
   Es JS vanilla global; `go(id)` cambia de pantalla; `screens[]` lista los ids.
6. **Datos privados**: nunca devolver `user_id` de contenido anónimo al cliente.
   Autorización siempre en servidor/RLS, nunca solo en cliente.
7. **Tono**: acompañar, no castigar. "Has vuelto", no "racha perdida". Tests
   orientativos, nunca diagnóstico. La IA no es terapeuta.
8. **No inventar** recursos, teléfonos, estudios ni eficacia clínica.

---

## 10. Arrancar en local

```bash
npm install
# crear .env.local con:
#   NEXT_PUBLIC_SUPABASE_URL=https://fuuyljsewwarroiyojdw.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key del proyecto>
#   ADMIN_PASSWORD=algo (opcional; sin ella el panel /admin queda abierto)
npm run dev            # http://localhost:3000
npm run build          # validación de tipos + build de producción
```

Deploy: `git push origin main` (Vercel construye y publica solo).

---

## 11. Prioridad siguiente recomendada

1. **Cerrar el panel admin** (allowlist de email o `ADMIN_PASSWORD`).
2. **SOS reestructurado** (Calmarme / Hablar / Necesito ayuda / Estoy en peligro).
3. **Ampliar Programas y Ritual** con categorías (reutilizando el sistema legacy).
4. **Cuenta**: borrar datos / borrar cuenta / gestión de sesiones.
5. Email transaccional (Resend) → reactivar confirmación de email.
6. Auditoría de accesibilidad + pruebas en móvil real.
7. Bloque 7 (Premium/Stripe) cuando el resto esté sólido.
