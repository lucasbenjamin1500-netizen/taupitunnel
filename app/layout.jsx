import './globals.css'

export const metadata = {
  title: 'Taupitunnel',
  description:
    'Taupitunnel — agent vocal IA pour recueillir les avis des voyageurs Eurotunnel.',
  icons: { icon: '/favicon.svg' },
}

export const viewport = {
  themeColor: '#0a1224',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full overflow-hidden">
      <body className="h-full overflow-hidden overscroll-none">{children}</body>
    </html>
  )
}
