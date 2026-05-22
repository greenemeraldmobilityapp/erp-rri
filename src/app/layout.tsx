import { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Lexend, Source_Sans_3 } from 'next/font/google'
import './globals.css'

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ERP RRI',
  description: 'ERP System for RRI',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${lexend.variable} ${sourceSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
