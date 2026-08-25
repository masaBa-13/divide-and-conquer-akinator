'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session-store'
import { DesertBackground } from '@/components/akinator/DesertBackground'
import { ResultPanel } from '@/components/ResultPanel'

export default function ResultPage() {
  const router = useRouter()
  const phase = useSessionStore((s) => s.phase)

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
        <ResultPanel />
      </div>
    </DesertBackground>
  )
}
