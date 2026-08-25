import type { FrameworkName } from '@/lib/types'

const S = '#64748b' // stroke color

/* ── 5Why ──────────────────────────────────────── */
function FiveWhyDiagram() {
  const rows = [
    { label: '問題（事象）', fill: '#dc2626' },
    { label: '直接原因', fill: '#ea580c' },
    { label: '中間原因', fill: '#d97706', textFill: '#451a03' },
    { label: '根本原因 ★', fill: '#16a34a' },
  ]
  const bW = 210, bH = 38, gap = 22, x0 = 15, y0 = 5
  const totalH = rows.length * bH + (rows.length - 1) * gap + y0 + 10

  return (
    <svg viewBox={`0 0 240 ${totalH}`} className="w-full max-w-[240px]" aria-hidden="true">
      <defs>
        <marker id="arr-5why" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 7 3, 0 6" fill={S} />
        </marker>
      </defs>
      {rows.map((row, i) => {
        const y = y0 + i * (bH + gap)
        return (
          <g key={i}>
            <rect x={x0} y={y} width={bW} height={bH} rx="7" fill={row.fill} />
            <text
              x={x0 + bW / 2} y={y + bH / 2 + 5}
              textAnchor="middle" fill={row.textFill ?? 'white'}
              fontSize="12" fontFamily="sans-serif" fontWeight="bold"
            >
              {row.label}
            </text>
            {i < rows.length - 1 && (
              <>
                <line
                  x1={x0 + bW / 2} y1={y + bH}
                  x2={x0 + bW / 2} y2={y + bH + gap - 1}
                  stroke={S} strokeWidth="1.5" markerEnd="url(#arr-5why)"
                />
                <text
                  x={x0 + bW / 2 + 10} y={y + bH + gap / 2 + 4}
                  fill={S} fontSize="10" fontFamily="sans-serif"
                >
                  なぜ?
                </text>
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/* ── 水平ツリー（ロジックツリー / How Tree 共通） ──── */
function HorizontalTreeDiagram({
  rootLabel,
  branchA,
  branchB,
  leafColor,
}: {
  rootLabel: string
  branchA: string
  branchB: string
  leafColor: string
}) {
  // Root: (5,75) 75x40  center-y=95
  // A:   (105,25) 80x40  center-y=45
  // B:   (105,125) 80x40 center-y=145
  // L1:  (205,5)  75x30  center-y=20
  // L2:  (205,50) 75x30  center-y=65
  // L3:  (205,105) 75x30 center-y=120
  // L4:  (205,150) 75x30 center-y=165
  const lineStyle = { stroke: S, strokeWidth: '1.5', fill: 'none' }

  return (
    <svg viewBox="0 0 290 195" className="w-full max-w-[290px]" aria-hidden="true">
      {/* Connectors root → branches */}
      <polyline points="80,95 93,95 93,45 105,45" {...lineStyle} />
      <polyline points="80,95 93,95 93,145 105,145" {...lineStyle} />
      {/* Connectors A → leaves */}
      <polyline points="185,45 196,45 196,20 205,20" {...lineStyle} />
      <polyline points="185,45 196,45 196,65 205,65" {...lineStyle} />
      {/* Connectors B → leaves */}
      <polyline points="185,145 196,145 196,120 205,120" {...lineStyle} />
      <polyline points="185,145 196,145 196,165 205,165" {...lineStyle} />

      {/* Root */}
      <rect x="5" y="75" width="75" height="40" rx="7" fill="#2563eb" />
      <text x="42" y="99" textAnchor="middle" fill="white" fontSize="12" fontFamily="sans-serif" fontWeight="bold">
        {rootLabel}
      </text>

      {/* Branch A */}
      <rect x="105" y="25" width="80" height="40" rx="7" fill="#7c3aed" />
      <text x="145" y="49" textAnchor="middle" fill="white" fontSize="11" fontFamily="sans-serif">
        {branchA}
      </text>

      {/* Branch B */}
      <rect x="105" y="125" width="80" height="40" rx="7" fill="#7c3aed" />
      <text x="145" y="149" textAnchor="middle" fill="white" fontSize="11" fontFamily="sans-serif">
        {branchB}
      </text>

      {/* Leaves */}
      {[
        { x: 205, y: 5 },
        { x: 205, y: 50 },
        { x: 205, y: 105 },
        { x: 205, y: 150 },
      ].map((pos, i) => (
        <rect key={i} x={pos.x} y={pos.y} width="75" height="30" rx="6" fill={leafColor} />
      ))}
    </svg>
  )
}

/* ── 2×2 サイクル（PDCA / OODA 共通） ─────────── */
function CycleDiagram({
  markerId,
  phases,
}: {
  markerId: string
  phases: { label: string; sub: string; fill: string; pos: 'tl' | 'tr' | 'br' | 'bl' }[]
}) {
  const positions = {
    tl: { x: 10, y: 10, cx: 70, cy: 40 },
    tr: { x: 155, y: 10, cx: 215, cy: 40 },
    br: { x: 155, y: 110, cx: 215, cy: 140 },
    bl: { x: 10, y: 110, cx: 70, cy: 140 },
  }

  return (
    <svg viewBox="0 0 285 185" className="w-full max-w-[285px]" aria-hidden="true">
      <defs>
        <marker id={markerId} markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 7 3, 0 6" fill={S} />
        </marker>
      </defs>
      {/* Arrows: tl→tr, tr→br, br→bl, bl→tl */}
      <line x1="120" y1="33" x2="153" y2="33" stroke={S} strokeWidth="1.5" markerEnd={`url(#${markerId})`} />
      <line x1="218" y1="68" x2="218" y2="108" stroke={S} strokeWidth="1.5" markerEnd={`url(#${markerId})`} />
      <line x1="153" y1="140" x2="120" y2="140" stroke={S} strokeWidth="1.5" markerEnd={`url(#${markerId})`} />
      <line x1="68" y1="108" x2="68" y2="68" stroke={S} strokeWidth="1.5" markerEnd={`url(#${markerId})`} />
      {/* Center label */}
      <text x="142" y="88" textAnchor="middle" fill="#94a3b8" fontSize="18">↺</text>

      {phases.map((ph) => {
        const { x, y, cx, cy } = positions[ph.pos]
        return (
          <g key={ph.pos}>
            <rect x={x} y={y} width="120" height="60" rx="9" fill={ph.fill} />
            <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize="15" fontFamily="sans-serif" fontWeight="bold">
              {ph.label}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fill="white" fontSize="10" fontFamily="sans-serif">
              {ph.sub}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ── ジョブ理論 ──────────────────────────────── */
function JobTheoryDiagram() {
  return (
    <svg viewBox="0 0 280 175" className="w-full max-w-[280px]" aria-hidden="true">
      {/* Job (center top) */}
      <rect x="60" y="5" width="160" height="55" rx="9" fill="#2563eb" />
      <text x="140" y="27" textAnchor="middle" fill="white" fontSize="13" fontFamily="sans-serif" fontWeight="bold">ジョブ</text>
      <text x="140" y="46" textAnchor="middle" fill="white" fontSize="10" fontFamily="sans-serif">達成したいこと</text>

      {/* Arrows down */}
      <line x1="100" y1="60" x2="68" y2="110" stroke={S} strokeWidth="1.5" />
      <line x1="180" y1="60" x2="212" y2="110" stroke={S} strokeWidth="1.5" />

      {/* Pains (left) */}
      <rect x="5" y="110" width="120" height="60" rx="9" fill="#dc2626" />
      <text x="65" y="133" textAnchor="middle" fill="white" fontSize="13" fontFamily="sans-serif" fontWeight="bold">痛み</text>
      <text x="65" y="153" textAnchor="middle" fill="white" fontSize="10" fontFamily="sans-serif">避けたいこと・障壁</text>

      {/* Gains (right) */}
      <rect x="155" y="110" width="120" height="60" rx="9" fill="#16a34a" />
      <text x="215" y="133" textAnchor="middle" fill="white" fontSize="13" fontFamily="sans-serif" fontWeight="bold">利得</text>
      <text x="215" y="153" textAnchor="middle" fill="white" fontSize="10" fontFamily="sans-serif">得たい価値・結果</text>
    </svg>
  )
}

/* ── メインexport ─────────────────────────────── */
export function FrameworkDiagram({ name }: { name: FrameworkName }) {
  switch (name) {
    case '5Why':
      return <FiveWhyDiagram />

    case 'ロジックツリー':
      return (
        <HorizontalTreeDiagram
          rootLabel="課題"
          branchA="要因A"
          branchB="要因B"
          leafColor="#60a5fa"
        />
      )

    case 'How Tree':
      return (
        <HorizontalTreeDiagram
          rootLabel="目標"
          branchA="方法A"
          branchB="方法B"
          leafColor="#4ade80"
        />
      )

    case 'PDCAサイクル':
      return (
        <CycleDiagram
          markerId="arr-pdca"
          phases={[
            { label: 'P', sub: 'Plan（計画）', fill: '#2563eb', pos: 'tl' },
            { label: 'D', sub: 'Do（実行）', fill: '#16a34a', pos: 'tr' },
            { label: 'C', sub: 'Check（評価）', fill: '#ea580c', pos: 'br' },
            { label: 'A', sub: 'Act（改善）', fill: '#dc2626', pos: 'bl' },
          ]}
        />
      )

    case 'OODAループ':
      return (
        <CycleDiagram
          markerId="arr-ooda"
          phases={[
            { label: 'O', sub: 'Observe（観察）', fill: '#0369a1', pos: 'tl' },
            { label: 'O', sub: 'Orient（判断）', fill: '#7c3aed', pos: 'tr' },
            { label: 'D', sub: 'Decide（決定）', fill: '#ea580c', pos: 'br' },
            { label: 'A', sub: 'Act（行動）', fill: '#dc2626', pos: 'bl' },
          ]}
        />
      )

    case 'ジョブ理論':
      return <JobTheoryDiagram />
  }
}
