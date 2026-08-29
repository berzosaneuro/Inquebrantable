import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'INQUEBRANTABLE — Adriana Puertas',
  description: 'Tu espacio de reconstrucción emocional',
  manifest: '/manifest.json',
  applicationName: 'INQUEBRANTABLE',
  appleWebApp: {
    capable: true,
    title: 'INQUEBRANTABLE',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#080B14',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
              navigator.serviceWorker.register('/service-worker.js').catch(function(){});
            });
          }`}
        </Script>
        <Script src="/legacy-app.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
