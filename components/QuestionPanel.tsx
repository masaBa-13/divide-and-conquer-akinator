'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session-store'
import { Character } from '@/components/akinator/Character'
import { SpeechBubble } from '@/components/akinator/SpeechBubble'
import { Button } from '@/components/ui/Button'
import { ChoiceButton } from '@/components/ui/ChoiceButton'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import type { AnswerResponse, ResultResponse } from '@/lib/types'

async function readSseResult<T>(body: ReadableStream<Uint8Array>): Promise<T> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    let currentEvent = ''
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        let data: unknown
        try {
          data = JSON.parse(line.slice(6))
        } catch {
          currentEvent = ''
          continue
        }
        if (currentEvent === 'result') {
          return data as T
        } else if (currentEvent === 'error') {
          throw new Error((data as { message: string }).message)
        }
        currentEvent = ''
      }
    }
  }

  throw new Error('SSEストリームが結果なしで終了しました')
}

export function QuestionPanel() {
  const router = useRouter()
  const {
    challenge,
    currentQuestion,
    currentAnswerType,
    currentChoices,
    selectedFrameworks,
    history,
    addQA,
    setNextQuestion,
    setResult,
    setError,
  } = useSessionStore()

  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [characterState, setCharacterState] = useState<'idle' | 'thinking' | 'eureka'>('idle')
  const [bubbleComplete, setBubbleComplete] = useState(false)
  const [freeText, setFreeText] = useState('')

  const handleAnswer = useCallback(async (answer: string) => {
    if (!currentQuestion || selectedFrameworks.length === 0 || loading) return

    setApiError(null)
    setLoading(true)
    setCharacterState('thinking')
    setBubbleComplete(false)
    setFreeText('')

    const newHistory = [
      ...history,
      { role: 'assistant' as const, question: currentQuestion, answerType: currentAnswerType, choices: currentChoices },
      { role: 'user' as const, answer },
    ]

    try {
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge,
          history: newHistory,
          answer,
          selectedFrameworks,
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error('接続エラーが発生しました')
      }

      const answerData = await readSseResult<AnswerResponse>(res.body)
      addQA(currentQuestion, currentAnswerType, currentChoices, answer)
      setNextQuestion(answerData)

      if (answerData.done) {
        setCharacterState('thinking')

        const resultRes = await fetch('/api/result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            challenge,
            history: newHistory,
            selectedFrameworks,
          }),
        })

        if (!resultRes.ok || !resultRes.body) {
          throw new Error('結果取得に失敗しました')
        }

        const resultData = await readSseResult<ResultResponse>(resultRes.body)
        setCharacterState('eureka')
        setResult(resultData)
        setTimeout(() => router.push('/result'), 800)
      } else {
        setCharacterState('idle')
      }
    } catch (err) {
      const msg = err instanceof Error
        ? err.message
        : '予期しないエラーが発生しました'
      setApiError(msg)
      setError(msg)
      setCharacterState('idle')
    } finally {
      setLoading(false)
    }
  }, [currentQuestion, currentAnswerType, currentChoices, selectedFrameworks, challenge, history, loading, addQA, setNextQuestion, setResult, setError, router])

  const handleGoBack = useCallback(() => {
    // This is handled by zustand — just navigate back doesn't undo,
    // but we reset the error and show previous question from history
    // For now: show the previous question from history
    router.back()
  }, [router])

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Character state="thinking" />
        <p className="text-[#5a3a1a] font-medium">読み込み中...</p>
      </div>
    )
  }

  const canGoBack = history.length >= 2

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-xl mx-auto">
      {/* Character + Speech bubble */}
      <div className="flex flex-col items-center gap-6 w-full">
        <Character state={characterState} />

        <div className="w-full">
          <SpeechBubble
            text={loading ? '考え中...' : currentQuestion}
            onComplete={() => setBubbleComplete(true)}
          />
        </div>
      </div>

      {/* Error banner */}
      {apiError && (
        <ErrorBanner
          message={apiError}
          onRetry={() => {
            setApiError(null)
            setCharacterState('idle')
          }}
        />
      )}

      {/* Answer buttons — shown when not loading and bubble is done */}
      {!loading && !apiError && (
        <div className="w-full flex flex-col gap-4">
          {currentAnswerType === 'yes_no' ? (
            <div className="flex gap-4 justify-center">
              <Button
                variant="yes"
                size="lg"
                onClick={() => handleAnswer('はい')}
                disabled={loading}
                className="flex-1 max-w-[160px]"
              >
                はい
              </Button>
              <Button
                variant="no"
                size="lg"
                onClick={() => handleAnswer('いいえ')}
                disabled={loading}
                className="flex-1 max-w-[160px]"
              >
                いいえ
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {currentChoices.map((choice) => (
                <ChoiceButton
                  key={choice}
                  label={choice}
                  onClick={() => handleAnswer(choice)}
                  disabled={loading}
                />
              ))}
            </div>
          )}

          {/* 自由記述欄 */}
          <div className="flex flex-col gap-2 mt-1">
            <p
              className="text-xs text-[#8a6030] opacity-70"
              style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
            >
              または自由に入力
            </p>
            <div className="flex gap-2">
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="自分の言葉で答える..."
                rows={2}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-xl border border-amber-300 bg-[#fffef0] text-sm text-[#5a3a1a] placeholder-[#c4a06a] resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
              />
              <button
                onClick={() => freeText.trim() && handleAnswer(freeText.trim())}
                disabled={loading || !freeText.trim()}
                className="px-4 rounded-xl bg-[#c4893a] hover:bg-[#a6722e] text-white font-bold text-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed self-stretch"
                aria-label="送信"
              >
                →
              </button>
            </div>
          </div>

          {canGoBack && (
            <div className="flex justify-center mt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGoBack}
                disabled={loading}
              >
                前の質問に戻る
              </Button>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center text-[#5a3a1a]">
          <style>{`
            @keyframes dot-blink {
              0%, 80%, 100% { opacity: 0; }
              40% { opacity: 1; }
            }
            .dot-1 { animation: dot-blink 1.2s infinite 0s; }
            .dot-2 { animation: dot-blink 1.2s infinite 0.2s; }
            .dot-3 { animation: dot-blink 1.2s infinite 0.4s; }
          `}</style>
          <span
            className="font-medium"
            style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
          >
            考え中
          </span>
          <span className="dot-1 font-bold text-lg ml-0.5">.</span>
          <span className="dot-2 font-bold text-lg">.</span>
          <span className="dot-3 font-bold text-lg">.</span>
        </div>
      )}

      {/* Question count indicator */}
      <p
        className="text-sm text-[#8a6030] opacity-70"
        style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
      >
        質問 {Math.floor(history.length / 2) + 1} 問目
      </p>
    </div>
  )
}
