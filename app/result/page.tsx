'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session-store'
import { DesertBackground } from '@/components/akinator/DesertBackground'
import { ResultPanel } from '@/components/ResultPanel'
import { FrameworkVisualizer } from '@/components/FrameworkVisualizer'
import { OtherFrameworks } from '@/components/OtherFrameworks'

export default function ResultPage() {
  const router = useRouter()
  const phase = useSessionStore((s) => s.phase)
  const result = useSessionStore((s) => s.result)

  useEffect(() => {
    if (phase !== 'result') {
      router.replace('/')
    }
  }, [phase, router])

  if (phase !== 'result') {
    return null
  }

  return (
    <DesertBackground>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">
        <div className="flex flex-col gap-12 w-full max-w-2xl mx-auto">
          <ResultPanel />

          {result?.visualization && (
            <section className="flex flex-col gap-4 w-full">
              <h2
                className="text-xl font-bold text-[#5a3a1a]"
                style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
              >
                フレームワークで見ると...
              </h2>
              <FrameworkVisualizer visualization={result.visualization} />
            </section>
          )}

          {result?.framework && (
            <section className="flex flex-col gap-4 w-full">
              <h2
                className="text-xl font-bold text-[#5a3a1a]"
                style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
              >
                他のフレームワークも学ぶ
              </h2>
              <OtherFrameworks usedFramework={result.framework.name} />
            </section>
          )}
        </div>
      </div>
    </DesertBackground>
  )
}
