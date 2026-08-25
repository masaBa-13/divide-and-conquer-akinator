import { DesertBackground } from '@/components/akinator/DesertBackground'
import { Character } from '@/components/akinator/Character'
import { StartForm } from '@/components/StartForm'

export default function Home() {
  return (
    <DesertBackground>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">
        <div className="flex flex-col items-center gap-8 w-full max-w-xl">
          {/* Title */}
          <div className="text-center">
            <h1
              className="text-4xl font-bold text-[#5a3a1a] drop-shadow-sm"
              style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
            >
              課題分解アキネーター
            </h1>
            <p
              className="mt-3 text-lg text-[#8a6030]"
              style={{ fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}
            >
              1問1答で課題をアクションに分解します
            </p>
          </div>

          {/* Character */}
          <Character state="idle" />

          {/* Start form */}
          <StartForm />
        </div>
      </div>
    </DesertBackground>
  )
}
