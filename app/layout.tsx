import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ClientAppShell from '@/components/ClientAppShell'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Trypto Travel App',
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
        {/* Resource Hints for Performance */}
        {/* Preconnect and DNS Prefetch for Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        {/* Preconnect and DNS Prefetch for Cloudinary */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {/* Preconnect for Google Maps API */}
        <link rel="preconnect" href="https://maps.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
        {/* Prefetch a likely-to-be-used route (example) */}
        <link rel="prefetch" href="/itinerary-display" as="document" />
      </head>
      <body className={inter.className}>
        <ClientAppShell>{children}</ClientAppShell>
      </body>
    </html>
  )
}
