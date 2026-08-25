import type { Metadata } from 'next'
import './globals.css'
import { StoreHydrator } from '@/components/StoreHydrator'

export const metadata: Metadata = {
  title: '課題分解アキネーター',
  description: '課題をアキネーターが1問1答で分解します',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body
        className="min-h-screen"
        style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
      >
        <StoreHydrator />
        {children}
      </body>
    </html>
  )
}
