'use client'

import { useEffect, useState, useRef } from 'react'

interface SpeechBubbleProps {
  text: string
  onComplete?: () => void
}

export function SpeechBubble({ text, onComplete }: SpeechBubbleProps) {
  const [displayed, setDisplayed] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    setDisplayed('')
    setIsComplete(false)

    if (!text) return

    let i = 0
    const timer = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(timer)
        setIsComplete(true)
        onCompleteRef.current?.()
      }
    }, 40)

    return () => clearInterval(timer)
  }, [text])

  // Allow clicking to skip typewriter animation
  const handleClick = () => {
    if (!isComplete) {
      setDisplayed(text)
      setIsComplete(true)
      onCompleteRef.current?.()
    }
  }

  return (
    <div
      className="relative cursor-pointer"
      onClick={handleClick}
      role="presentation"
    >
      {/* Speech bubble body */}
      <div
        className="relative bg-[#fffef0] border-2 border-[#c4893a] rounded-2xl px-6 py-5 shadow-lg min-h-[80px]"
        style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
      >
        <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
          {displayed}
          {!isComplete && (
            <span className="inline-block w-0.5 h-5 bg-[#c4893a] ml-0.5 animate-pulse" />
          )}
        </p>
      </div>
      {/* Pointer triangle pointing left/down toward character */}
      <div
        className="absolute -bottom-4 left-8"
        style={{
          width: 0,
          height: 0,
          borderLeft: '16px solid transparent',
          borderRight: '16px solid transparent',
          borderTop: '18px solid #c4893a',
        }}
      />
      <div
        className="absolute -bottom-3 left-9"
        style={{
          width: 0,
          height: 0,
          borderLeft: '14px solid transparent',
          borderRight: '14px solid transparent',
          borderTop: '16px solid #fffef0',
        }}
      />
    </div>
  )
}
