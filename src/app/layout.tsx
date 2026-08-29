import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Inquebrantable — Un espacio para volver a encontrarte',
  description:
    'Acompañamiento emocional para mujeres. Entiende lo que te pasa, da un paso, encuentra apoyo y reconstrúyete a tu ritmo.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://inquebrantable.vercel.app'),
  manifest: '/manifest.json',
  applicationName: 'INQUEBRANTABLE',
  appleWebApp: { capable: true, title: 'INQUEBRANTABLE', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' },
  other: { 'mobile-web-app-capable': 'yes' },
  openGraph: {
    title: 'Inquebrantable',
    description: 'Un espacio para volver a encontrarte.',
    type: 'website',
    locale: 'es_ES',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0C1116',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
              navigator.serviceWorker.register('/service-worker.js').then(function (reg) {
                reg.addEventListener('updatefound', function () {
                  var w = reg.installing;
                  if (!w) return;
                  w.addEventListener('statechange', function () {
                    if (w.state === 'installed' && navigator.serviceWorker.controller) {
                      w.postMessage('skipWaiting');
                    }
                  });
                });
              }).catch(function(){});
              var reloaded = false;
              navigator.serviceWorker.addEventListener('controllerchange', function () {
                if (reloaded) return; reloaded = true; window.location.reload();
              });
            });
          }`}
        </Script>
      </body>
    </html>
  )
}
