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

export function QuestionPanel() {
  const router = useRouter()
  const {
    challenge,
    currentQuestion,
    currentAnswerType,
    currentChoices,
    selectedFramework,
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

  const handleAnswer = useCallback(async (answer: string) => {
    if (!currentQuestion || !selectedFramework || loading) return

    setApiError(null)
    setLoading(true)
    setCharacterState('thinking')
    setBubbleComplete(false)

    // Record this Q&A
    addQA(currentQuestion, currentAnswerType, currentChoices, answer)

    const newHistory = [
      ...history,
      { role: 'assistant' as const, question: currentQuestion, answerType: currentAnswerType, choices: currentChoices },
      { role: 'user' as const, answer },
    ]

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    try {
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge,
          history: newHistory,
          answer,
          selectedFramework,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => ({}))
        const msg = typeof data === 'object' && data !== null && 'error' in data
          ? String((data as { error: unknown }).error)
          : 'サーバーエラーが発生しました'
        throw new Error(msg)
      }

      const answerData = (await res.json()) as AnswerResponse
      setNextQuestion(answerData)

      if (answerData.done) {
        // Fetch result
        setCharacterState('thinking')
        const resultController = new AbortController()
        const resultTimeout = setTimeout(() => resultController.abort(), 10_000)

        try {
          const resultRes = await fetch('/api/result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              challenge,
              history: newHistory,
              selectedFramework,
            }),
            signal: resultController.signal,
          })

          if (!resultRes.ok) {
            const data: unknown = await resultRes.json().catch(() => ({}))
            const msg = typeof data === 'object' && data !== null && 'error' in data
              ? String((data as { error: unknown }).error)
              : '結果取得に失敗しました'
            throw new Error(msg)
          }

          const resultData = (await resultRes.json()) as ResultResponse
          setCharacterState('eureka')
          setResult(resultData)
          setTimeout(() => router.push('/result'), 800)
        } finally {
          clearTimeout(resultTimeout)
        }
      } else {
        setCharacterState('idle')
      }
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'AbortError'
          ? 'リクエストがタイムアウトしました。もう一度試してください。'
          : err instanceof Error
            ? err.message
            : '予期しないエラーが発生しました'
      setApiError(msg)
      setError(msg)
      setCharacterState('idle')
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }, [currentQuestion, currentAnswerType, currentChoices, selectedFramework, challenge, history, loading, addQA, setNextQuestion, setResult, setError, router])

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
        <div className="flex items-center gap-2 text-[#5a3a1a]">
          <span className="animate-spin text-xl">⟳</span>
          <span
            className="font-medium"
            style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
          >
            考え中...
          </span>
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
