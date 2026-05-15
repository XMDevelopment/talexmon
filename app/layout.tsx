import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TaleXMon – Clubbeheer',
  description: 'Voetbalclub management platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="antialiased">{children}</body>
    </html>
  )
}
