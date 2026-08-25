'use client'

import { useState } from 'react'
import { FRAMEWORKS } from '@/lib/frameworks'
import { FrameworkDiagram } from '@/components/FrameworkDiagram'
import type { FrameworkMetadata } from '@/lib/frameworks'
import type { FrameworkName } from '@/lib/types'

interface Props {
  usedFrameworks: FrameworkName[]
}

function FrameworkAccordionItem({ fw }: { fw: FrameworkMetadata }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-amber-300 bg-[#fffef0] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-amber-50 transition-colors"
        aria-expanded={open}
        style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
      >
        <span className="flex items-center gap-2">
          <span className="text-xl">{fw.icon}</span>
          <span className="font-semibold text-[#5a3a1a]">{fw.name}</span>
        </span>
        <span className="text-amber-600 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          className="px-5 pb-5 flex flex-col gap-4 text-gray-700"
          style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
        >
          <p className="text-sm leading-relaxed">{fw.description}</p>

          {/* 図解 */}
          <div className="flex justify-center bg-white rounded-lg p-3 border border-amber-100">
            <FrameworkDiagram name={fw.name} />
          </div>

          <div>
            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">
              こんな時に使う
            </h4>
            <p className="text-sm leading-relaxed text-gray-600">{fw.whenToUse}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">
              手順
            </h4>
            <ul className="flex flex-col gap-1.5">
              {fw.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-400 text-white text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 詳しく学ぶリンク */}
          <a
            href={fw.learnMoreUrl}
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

export function OtherFrameworks({ usedFrameworks }: Props) {
  const others = FRAMEWORKS.filter((fw) => !usedFrameworks.includes(fw.name))

  return (
    <div className="flex flex-col gap-3">
      {others.map((fw) => (
        <FrameworkAccordionItem key={fw.name} fw={fw} />
      ))}
    </div>
  )
}
