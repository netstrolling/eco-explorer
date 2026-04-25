import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '갈다 생태도감',
  description: '고흥 우도 생태탐사 도감',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  )
}
