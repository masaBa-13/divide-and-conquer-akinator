'use client'

import type { VisualizationData, VisualizationNode } from '@/lib/types'

interface Props {
  visualization: VisualizationData
}

function TreeNode({ node, depth }: { node: VisualizationNode; depth: number }) {
  return (
    <li className="relative pl-6">
      <span
        className="block px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-sm text-[#5a3a1a] font-medium w-fit max-w-xs"
        style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
      >
        {node.label}
      </span>
      {node.children && node.children.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2 border-l-2 border-amber-300 ml-2 pl-2">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

function TreeVisualizer({ root }: { root: VisualizationNode }) {
  return (
    <ul className="flex flex-col gap-2">
      <TreeNode node={root} depth={0} />
    </ul>
  )
}

function WhyChainVisualizer({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {steps.map((step, i) => (
        <div key={i} className="flex flex-col items-center w-full">
          <div
            className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm text-center ${
              i === steps.length - 1
                ? 'border-orange-500 bg-orange-100 text-orange-800 font-bold'
                : 'border-amber-300 bg-amber-50 text-[#5a3a1a]'
            }`}
            style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
          >
            {i === steps.length - 1 ? `根本原因: ${step}` : `なぜ${i + 1}: ${step}`}
          </div>
          {i < steps.length - 1 && (
            <span className="text-amber-500 text-xl leading-none py-0.5">▼</span>
          )}
        </div>
      ))}
    </div>
  )
}

function CycleVisualizer({ phases }: { phases: { name: string; items: string[] }[] }) {
  const arrows = ['→', '↓', '←', '↑']
  const positions = [
    'col-start-1 row-start-1',
    'col-start-2 row-start-1',
    'col-start-2 row-start-2',
    'col-start-1 row-start-2',
  ]
  const arrowPositions = [
    { className: 'col-start-1 row-start-1 self-center justify-self-end pr-1 text-amber-500 text-lg', arrow: '→' },
    { className: 'col-start-2 row-start-1 self-end justify-self-center pb-1 text-amber-500 text-lg', arrow: '↓' },
    { className: 'col-start-2 row-start-2 self-center justify-self-start pl-1 text-amber-500 text-lg', arrow: '←' },
    { className: 'col-start-1 row-start-2 self-start justify-self-center pt-1 text-amber-500 text-lg', arrow: '↑' },
  ]

  const capped = phases.slice(0, 4)

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] grid-rows-[1fr_auto_1fr] gap-2">
      {capped.map((phase, i) => (
        <div
          key={i}
          className={`${positions[i]} rounded-lg border-2 border-amber-300 bg-amber-50 p-3`}
          style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
        >
          <p className="text-xs font-bold text-[#5a3a1a] mb-1">{phase.name}</p>
          <ul className="flex flex-col gap-0.5">
            {phase.items.map((item, j) => (
              <li key={j} className="text-xs text-gray-600 flex gap-1">
                <span className="text-amber-500 flex-shrink-0">・</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {arrowPositions.slice(0, capped.length).map((ap, i) => (
        <div key={i} className={`${ap.className} flex items-center justify-center font-bold`}>
          {ap.arrow}
        </div>
      ))}
    </div>
  )
}

function JobTheoryVisualizer({
  job,
  gains,
  pains,
}: {
  job: string
  gains: string[]
  pains: string[]
}) {
  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-lg border-2 border-amber-400 bg-amber-100 px-4 py-3"
        style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
      >
        <p className="text-xs font-bold text-amber-700 mb-1">コアジョブ</p>
        <p className="text-sm text-[#5a3a1a] font-semibold">{job}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-lg border-2 border-green-300 bg-green-50 px-4 py-3"
          style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
        >
          <p className="text-xs font-bold text-green-700 mb-2">ゲイン（得たいこと）</p>
          <ul className="flex flex-col gap-1">
            {gains.map((g, i) => (
              <li key={i} className="text-xs text-gray-700 flex gap-1">
                <span className="text-green-500 flex-shrink-0">+</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
        <div
          className="rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3"
          style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
        >
          <p className="text-xs font-bold text-red-700 mb-2">ペイン（避けたいこと）</p>
          <ul className="flex flex-col gap-1">
            {pains.map((p, i) => (
              <li key={i} className="text-xs text-gray-700 flex gap-1">
                <span className="text-red-500 flex-shrink-0">-</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function FrameworkVisualizer({ visualization }: Props) {
  return (
    <div className="rounded-xl border-2 border-[#c4893a] bg-[#fffef0] p-5">
      {visualization.type === 'tree' && <TreeVisualizer root={visualization.root} />}
      {visualization.type === 'why_chain' && <WhyChainVisualizer steps={visualization.steps} />}
      {visualization.type === 'cycle' && <CycleVisualizer phases={visualization.phases} />}
      {visualization.type === 'job_theory' && (
        <JobTheoryVisualizer
          job={visualization.job}
          gains={visualization.gains}
          pains={visualization.pains}
        />
      )}
    </div>
  )
}
