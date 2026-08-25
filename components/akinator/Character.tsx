'use client'

import Image from 'next/image'
import type { CharacterState } from '@/lib/types'
import { cn } from '@/lib/cn'

interface CharacterProps {
  state: CharacterState
}

const IMAGE_MAP: Record<CharacterState, string> = {
  idle: '/character-idle.png',
  thinking: '/character-thinking.png',
  eureka: '/character-eureka.png',
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
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes pulse-big {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
      `}</style>
      <Image
        src={IMAGE_MAP[state]}
        alt="アキネーターキャラクター"
        width={280}
        height={280}
        style={{ objectFit: 'contain' }}
        priority
        unoptimized
      />
    </div>
  )
}
