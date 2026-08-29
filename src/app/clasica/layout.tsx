import Script from 'next/script'
import '../legacy.css'

export default function ClasicaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Script src="/inq-sync.js" strategy="afterInteractive" />
      <Script src="/legacy-app.js" strategy="afterInteractive" />
    </>
  )
}
