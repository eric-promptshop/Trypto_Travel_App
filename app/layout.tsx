import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ClientAppShell from '@/components/ClientAppShell'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Travel Itinerary Builder',
  description: 'AI-powered custom trip builder',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light dark" />
        <script src="/chunk-error-handler.js" async />
      </head>
      <body className={inter.className}>
        <ClientAppShell>{children}</ClientAppShell>
      </body>
    </html>
  )
}