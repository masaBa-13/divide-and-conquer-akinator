'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session-store'
import { DesertBackground } from '@/components/akinator/DesertBackground'
import { QuestionPanel } from '@/components/QuestionPanel'

export default function SessionPage() {
  const router = useRouter()
  const phase = useSessionStore((s) => s.phase)

  useEffect(() => {
    if (phase === 'start') {
      router.replace('/')
    } else if (phase === 'result') {
      router.replace('/result')
    }
  }, [phase, router])

  if (phase === 'start' || phase === 'result') {
    return null
  }

  return (
    <DesertBackground>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">
        <QuestionPanel />
      </div>
    </DesertBackground>
  )
}
