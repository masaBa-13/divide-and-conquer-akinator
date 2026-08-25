'use client'

import { useState } from 'react'
import type { FrameworkInfo } from '@/lib/types'

interface FrameworkExplanationProps {
  framework: FrameworkInfo
}

export function FrameworkExplanation({ framework }: FrameworkExplanationProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-[#c4893a] bg-[#fffef0] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-[#5a3a1a] hover:bg-amber-50 transition-colors"
        style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
        aria-expanded={open}
      >
        <span>使用フレームワーク: {framework.name}</span>
        <span className="text-xl">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          className="px-5 pb-5 flex flex-col gap-4 text-gray-700"
          style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
        >
          <div>
            <h4 className="font-semibold text-[#5a3a1a] mb-1">説明</h4>
            <p className="text-sm leading-relaxed">{framework.description}</p>
          </div>

          <div>
            <h4 className="font-semibold text-[#5a3a1a] mb-1">選んだ理由</h4>
            <p className="text-sm leading-relaxed">{framework.reason}</p>
          </div>

          <div>
            <h4 className="font-semibold text-[#5a3a1a] mb-2">手順</h4>
            <ol className="flex flex-col gap-2">
              {framework.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#c4893a] text-white text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
