'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session-store'
import { Character } from '@/components/akinator/Character'
import { SpeechBubble } from '@/components/akinator/SpeechBubble'
import { Button } from '@/components/ui/Button'
import { FrameworkExplanation } from '@/components/FrameworkExplanation'
import { FrameworkVisualizer } from '@/components/FrameworkVisualizer'
import { cn } from '@/lib/cn'
import type { FrameworkAnalysis, Priority } from '@/lib/types'

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

function AnalysisTab({ analysis }: { analysis: FrameworkAnalysis }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Actions list */}
      <div className="flex flex-col gap-4">
        <h2
          className="text-xl font-bold text-[#5a3a1a]"
          style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
        >
          アクションプラン
        </h2>
        {analysis.actions.map((action) => (
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

      {/* Visualization */}
      {analysis.visualization && (
        <div className="flex flex-col gap-4">
          <h2
            className="text-xl font-bold text-[#5a3a1a]"
            style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
          >
            フレームワークで見ると...
          </h2>
          <FrameworkVisualizer visualization={analysis.visualization} />
        </div>
      )}

      {/* Framework explanation */}
      <FrameworkExplanation framework={analysis.framework} />
    </div>
  )
}

export function ResultPanel() {
  const router = useRouter()
  const { result, reset } = useSessionStore()
  const [activeTab, setActiveTab] = useState(0)

  if (!result) return null

  const { analyses } = result
  const multiTab = analyses.length > 1

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

      {/* Tabs (only shown when multiple analyses) */}
      {multiTab && (
        <div className="w-full flex gap-2 border-b-2 border-[#c4893a]">
          {analyses.map((analysis, i) => (
            <button
              key={analysis.framework.name}
              onClick={() => setActiveTab(i)}
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-t-lg border-2 border-b-0 transition-colors',
                activeTab === i
                  ? 'border-[#c4893a] bg-[#fffef0] text-[#5a3a1a]'
                  : 'border-transparent bg-amber-50 text-[#8a6030] hover:bg-amber-100'
              )}
              style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
            >
              {analysis.framework.name}
            </button>
          ))}
        </div>
      )}

      {/* Active analysis */}
      <div className="w-full">
        <AnalysisTab analysis={analyses[activeTab]} />
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
