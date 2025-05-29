import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { TripProvider } from '../contexts/TripContext'

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
      <body className={inter.className}>
        <TripProvider>
          {children}
        </TripProvider>
      </body>
    </html>
  )
}
