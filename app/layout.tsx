import type { Metadata } from 'next'
import './globals.css'
import { StoreHydrator } from '@/components/StoreHydrator'

export const metadata: Metadata = {
  title: '課題分解アキネーター',
  description: '悩みを1問1答で深掘りして、小さなアクションに分解します。ISARIBI with の学生メンバー向けツール。',
  openGraph: {
    title: '課題分解アキネーター',
    description: '悩みを1問1答で深掘りして、小さなアクションに分解します。',
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: '課題分解アキネーター',
    description: '悩みを1問1答で深掘りして、小さなアクションに分解します。',
  },
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
