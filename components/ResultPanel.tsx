'use client'

import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session-store'
import { Character } from '@/components/akinator/Character'
import { SpeechBubble } from '@/components/akinator/SpeechBubble'
import { Button } from '@/components/ui/Button'
import { FrameworkExplanation } from '@/components/FrameworkExplanation'
import { cn } from '@/lib/cn'
import type { Priority } from '@/lib/types'

const priorityLabel: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const priorityColor: Record<Priority, string> = {
  high: 'bg-red-100 text-red-700 border-red-300',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  low: 'bg-green-100 text-green-700 border-green-300',
}

export function ResultPanel() {
  const router = useRouter()
  const { result, reset } = useSessionStore()

  if (!result) return null

  const handleReset = () => {
    reset()
    router.push('/')
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto">
      {/* Character in eureka state */}
      <div className="flex flex-col items-center gap-6 w-full">
        <Character state="eureka" />
        <div className="w-full max-w-xl">
          <SpeechBubble text="わかったぞ！あなたの課題を分解できました！" />
        </div>
      </div>

      {/* Actions list */}
      <div className="w-full flex flex-col gap-4">
        <h2
          className="text-xl font-bold text-[#5a3a1a]"
          style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
        >
          アクションプラン
        </h2>
        {result.actions.map((action) => (
          <div
            key={action.id}
            className="rounded-xl border-2 border-[#c4893a] bg-[#fffef0] p-5 flex flex-col gap-2 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h3
                className="font-semibold text-gray-800 text-base leading-snug"
                style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
              >
                {action.title}
              </h3>
              <span
                className={cn(
                  'flex-shrink-0 rounded-full border px-3 py-0.5 text-xs font-bold',
                  priorityColor[action.priority]
                )}
              >
                優先度: {priorityLabel[action.priority]}
              </span>
            </div>
            <p
              className="text-gray-600 text-sm leading-relaxed"
              style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
            >
              {action.description}
            </p>
            {action.estimatedTime && (
              <p className="text-[#c4893a] text-xs font-medium">
                目安時間: {action.estimatedTime}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Framework explanation */}
      <div className="w-full">
        <FrameworkExplanation framework={result.framework} />
      </div>

      {/* Reset button */}
      <Button
        variant="primary"
        size="lg"
        onClick={handleReset}
        className="w-full max-w-sm"
      >
        別の課題を分解する
      </Button>
    </div>
  )
}
