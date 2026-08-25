'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session-store'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import type { StartResponse } from '@/lib/types'

const MAX_CHARS = 300

export function StartForm() {
  const router = useRouter()
  const { setChallenge, startSession } = useSessionStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const challenge = input.trim()
    if (!challenge) return

    setError(null)
    setLoading(true)
    setChallenge(challenge)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    try {
      const res = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => ({}))
        const msg = typeof data === 'object' && data !== null && 'error' in data
          ? String((data as { error: unknown }).error)
          : 'サーバーエラーが発生しました'
        throw new Error(msg)
      }

      const data = (await res.json()) as StartResponse
      startSession(data)
      router.push('/session')
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('リクエストがタイムアウトしました。もう一度試してください。')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('予期しないエラーが発生しました')
      }
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xl">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="challenge"
          className="text-[#5a3a1a] font-semibold text-lg"
          style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
        >
          あなたの課題を教えてください
        </label>
        <textarea
          id="challenge"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
          placeholder="例：チームのコミュニケーションがうまくいっていない"
          rows={4}
          className="w-full rounded-xl border-2 border-[#c4893a] bg-[#fffef0] px-4 py-3 text-gray-800 text-base resize-none focus:outline-none focus:ring-2 focus:ring-[#c4893a] focus:ring-offset-2 placeholder:text-gray-400"
          style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
          disabled={loading}
        />
        <p className="text-right text-sm text-gray-500">
          {input.length} / {MAX_CHARS}
        </p>
      </div>

      {error && (
        <ErrorBanner message={error} onRetry={() => setError(null)} />
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={loading || input.trim().length === 0}
        className="w-full"
      >
        {loading ? '分析中...' : '占いを始める'}
      </Button>
    </form>
  )
}
