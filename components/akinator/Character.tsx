'use client'

import type { CharacterState } from '@/lib/types'
import { cn } from '@/lib/cn'

interface CharacterProps {
  state: CharacterState
}

export function Character({ state }: CharacterProps) {
  return (
    <div
      className={cn(
        'select-none',
        state === 'idle' && 'animate-[float_3s_ease-in-out_infinite]',
        state === 'thinking' && 'animate-[sway_1s_ease-in-out_infinite]',
        state === 'eureka' && 'animate-[pulse-big_0.6s_ease-in-out]'
      )}
      style={{ display: 'inline-block' }}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes pulse-big {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
      <svg
        width="160"
        height="220"
        viewBox="0 0 160 220"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="アキネーターキャラクター"
      >
        {/* Turban base */}
        <ellipse cx="80" cy="52" rx="44" ry="20" fill="#1a6bb5" />
        {/* Turban top wrap */}
        <ellipse cx="80" cy="44" rx="38" ry="16" fill="#2980d4" />
        <ellipse cx="80" cy="38" rx="30" ry="12" fill="#1a6bb5" />
        {/* Turban gem */}
        <ellipse cx="80" cy="32" rx="8" ry="6" fill="#e74c3c" />
        <ellipse cx="80" cy="31" rx="4" ry="3" fill="#ff7675" />

        {/* Face */}
        <ellipse cx="80" cy="78" rx="32" ry="36" fill="#f5cba7" />

        {/* Eyes */}
        {state === 'thinking' ? (
          <>
            {/* Thinking eyes (squinting) */}
            <ellipse cx="65" cy="72" rx="7" ry="4" fill="#2c3e50" />
            <ellipse cx="95" cy="72" rx="7" ry="4" fill="#2c3e50" />
          </>
        ) : state === 'eureka' ? (
          <>
            {/* Wide open eyes */}
            <ellipse cx="65" cy="72" rx="9" ry="10" fill="white" />
            <ellipse cx="95" cy="72" rx="9" ry="10" fill="white" />
            <circle cx="65" cy="73" r="5" fill="#2c3e50" />
            <circle cx="95" cy="73" r="5" fill="#2c3e50" />
            <circle cx="67" cy="71" r="2" fill="white" />
            <circle cx="97" cy="71" r="2" fill="white" />
          </>
        ) : (
          <>
            {/* Normal eyes */}
            <ellipse cx="65" cy="72" rx="8" ry="9" fill="white" />
            <ellipse cx="95" cy="72" rx="8" ry="9" fill="white" />
            <circle cx="65" cy="73" r="4" fill="#2c3e50" />
            <circle cx="95" cy="73" r="4" fill="#2c3e50" />
            <circle cx="67" cy="71" r="1.5" fill="white" />
            <circle cx="97" cy="71" r="1.5" fill="white" />
          </>
        )}

        {/* Eyebrows */}
        {state === 'thinking' ? (
          <>
            <path d="M56 61 Q65 56 74 61" stroke="#8B4513" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M86 61 Q95 56 104 61" stroke="#8B4513" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M56 63 Q65 58 74 63" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M86 63 Q95 58 104 63" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* Nose */}
        <ellipse cx="80" cy="86" rx="4" ry="3" fill="#d4a574" />

        {/* Mouth / expression */}
        {state === 'eureka' ? (
          <path d="M67 98 Q80 110 93 98" stroke="#8B4513" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : state === 'thinking' ? (
          <path d="M67 98 Q80 96 93 98" stroke="#8B4513" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M68 98 Q80 105 92 98" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}

        {/* White beard */}
        <ellipse cx="80" cy="112" rx="22" ry="14" fill="white" />
        <ellipse cx="70" cy="116" rx="12" ry="10" fill="white" />
        <ellipse cx="90" cy="116" rx="12" ry="10" fill="white" />
        <ellipse cx="80" cy="120" rx="16" ry="10" fill="white" />

        {/* Robe body */}
        <path
          d="M36,120 Q28,130 24,160 L24,210 L136,210 L136,160 Q132,130 124,120 Q112,114 80,114 Q48,114 36,120 Z"
          fill="#1a6bb5"
        />
        {/* Robe highlight */}
        <path
          d="M60,118 Q70,125 80,122 Q90,125 100,118 L96,180 L64,180 Z"
          fill="#2980d4"
          fillOpacity="0.5"
        />

        {/* Arms */}
        <ellipse cx="26" cy="150" rx="14" ry="36" fill="#1a6bb5" transform="rotate(-10 26 150)" />
        <ellipse cx="134" cy="150" rx="14" ry="36" fill="#1a6bb5" transform="rotate(10 134 150)" />

        {/* Hands */}
        <ellipse cx="20" cy="180" rx="10" ry="8" fill="#f5cba7" />
        <ellipse cx="140" cy="180" rx="10" ry="8" fill="#f5cba7" />

        {/* Lamp in right hand */}
        <g transform="translate(135, 170)">
          {/* Lamp base/handle */}
          <rect x="-4" y="8" width="8" height="12" rx="2" fill="#c4893a" />
          {/* Lamp body */}
          <ellipse cx="0" cy="4" rx="12" ry="8" fill="#c4893a" />
          <ellipse cx="0" cy="2" rx="10" ry="6" fill="#e8b870" />
          {/* Lamp spout */}
          <path d="M10,0 Q18,-4 20,-2 Q18,2 10,2 Z" fill="#c4893a" />
          {/* Flame / glow */}
          {state === 'eureka' && (
            <>
              <ellipse cx="20" cy="-4" rx="4" ry="6" fill="#f39c12" fillOpacity="0.9" />
              <ellipse cx="20" cy="-6" rx="2" ry="4" fill="#f1c40f" fillOpacity="0.9" />
            </>
          )}
          {state !== 'eureka' && (
            <ellipse cx="20" cy="-3" rx="2" ry="3" fill="#f39c12" fillOpacity="0.7" />
          )}
        </g>
      </svg>
    </div>
  )
}
