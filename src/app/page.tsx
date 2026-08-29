import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

// La app original (index.html) se sirve como markup dentro de Next. El
// comportamiento lo aporta /public/legacy-app.js; /public/inq-sync.js hace de
// puente con el backend. En fases siguientes esto se irá troceando en React.
const bodyHtml = readFileSync(join(process.cwd(), 'src/legacy/app-body.html'), 'utf8')

type Boot = {
  user: { id: string; email: string | null; nick: string } | null
  state: Record<string, unknown>
}

async function loadBoot(): Promise<Boot> {
  if (!supabaseConfigured()) return { user: null, state: {} }
  try {
    const supabase = createServerSupabase()
    const { data } = await supabase.auth.getUser()
    if (!data.user) return { user: null, state: {} }

    const nick =
      (data.user.user_metadata?.nick as string | undefined) ||
      data.user.email?.split('@')[0] ||
      'tú'

    const { data: rows } = await supabase.from('inq_kv').select('key, value')
    const state: Record<string, unknown> = {}
    for (const row of rows ?? []) state[row.key] = row.value

    return { user: { id: data.user.id, email: data.user.email ?? null, nick }, state }
  } catch {
    return { user: null, state: {} }
  }
}

export default async function Page() {
  const boot = await loadBoot()
  return (
    <>
      <script
        id="__inq_boot"
        type="application/json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(boot) }}
      />
      <div id="legacy-root" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </>
  )
}
