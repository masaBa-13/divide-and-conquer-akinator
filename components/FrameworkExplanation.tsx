'use client'

import { useState } from 'react'
import { FrameworkDiagram } from '@/components/FrameworkDiagram'
import { getFramework } from '@/lib/frameworks'
import type { FrameworkInfo } from '@/lib/types'

interface FrameworkExplanationProps {
  framework: FrameworkInfo
}

export function FrameworkExplanation({ framework }: FrameworkExplanationProps) {
  const [open, setOpen] = useState(false)
  const meta = getFramework(framework.name)

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
          <p className="text-sm leading-relaxed">{framework.description}</p>

          {/* 図解 */}
          <div className="flex justify-center bg-white rounded-lg p-3 border border-amber-100">
            <FrameworkDiagram name={framework.name} />
          </div>

          <div>
            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">
              選んだ理由
            </h4>
            <p className="text-sm leading-relaxed text-gray-600">{framework.reason}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">
              手順
            </h4>
            <ul className="flex flex-col gap-1.5">
              {meta.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-400 text-white text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <a
            href={meta.learnMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline self-start"
          >
            <span>📖</span>
            <span>詳しく学ぶ</span>
            <span className="text-xs opacity-60">↗</span>
          </a>
        </div>
      )}
    </div>
  )
}
