import Script from 'next/script'

// La app clásica (13 pantallas, JS vanilla) vive aquí. Los scripts solo se
// cargan en esta rama, no en el resto de la plataforma.
export default function ClasicaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Script src="/inq-sync.js" strategy="afterInteractive" />
      <Script src="/legacy-app.js" strategy="afterInteractive" />
    </>
  )
}
