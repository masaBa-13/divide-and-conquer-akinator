import type { Metadata } from 'next'
import './globals.css'
import { StoreHydrator } from '@/components/StoreHydrator'

const siteUrl = process.env.SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '課題分解アキネーター',
  description: '悩みを1問1答で深掘りして、小さなアクションに分解します。ISARIBI with の学生メンバー向けツール。',
  openGraph: {
    title: '課題分解アキネーター',
    description: '悩みを1問1答で深掘りして、小さなアクションに分解します。',
    type: 'website',
    locale: 'ja_JP',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '課題分解アキネーター',
    description: '悩みを1問1答で深掘りして、小さなアクションに分解します。',
    images: ['/og-image.png'],
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
