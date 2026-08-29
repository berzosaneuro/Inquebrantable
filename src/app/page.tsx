import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Fase 1 de la migración: la app original (index.html) se sirve tal cual como
// markup dentro de Next. El comportamiento (todo en JavaScript vanilla) lo
// aporta /public/legacy-app.js, cargado desde el layout. En fases siguientes
// este árbol se irá troceando en componentes React con datos de Supabase.
const bodyHtml = readFileSync(
  join(process.cwd(), 'src/legacy/app-body.html'),
  'utf8',
)

export default function Page() {
  return <div id="legacy-root" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
}
