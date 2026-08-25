import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '課題分解アキネーター'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 40%, #f5c842 100%)',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Left: text area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            maxWidth: '620px',
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'flex',
              background: '#c4893a',
              color: 'white',
              fontSize: '22px',
              fontWeight: 'bold',
              borderRadius: '100px',
              padding: '8px 24px',
              width: 'fit-content',
            }}
          >
            ISARIBI with
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                fontSize: '68px',
                fontWeight: 'bold',
                color: '#5a3a1a',
                lineHeight: 1.1,
              }}
            >
              課題分解
            </div>
            <div
              style={{
                fontSize: '68px',
                fontWeight: 'bold',
                color: '#5a3a1a',
                lineHeight: 1.1,
              }}
            >
              アキネーター
            </div>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: '30px',
              color: '#92400e',
              lineHeight: 1.5,
            }}
          >
            悩みを1問1答で深掘りして
            <br />
            小さなアクションに分解します
          </div>

          {/* Framework pills */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['5Why', 'ロジックツリー', 'PDCA', 'OODA', 'ジョブ理論'].map((fw) => (
              <div
                key={fw}
                style={{
                  background: 'white',
                  color: '#92400e',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  padding: '6px 16px',
                  border: '2px solid #c4893a',
                }}
              >
                {fw}
              </div>
            ))}
          </div>
        </div>

        {/* Right: character (SVG drawn inline) */}
        <svg
          width="380"
          height="480"
          viewBox="0 0 64 80"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shadow */}
          <ellipse cx="32" cy="78" rx="18" ry="4" fill="#d97706" opacity="0.3" />
          {/* Blue robe */}
          <path d="M8 80 Q8 60 32 60 Q56 60 56 80Z" fill="#2563eb" />
          <path d="M14 60 Q32 56 50 60" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Body */}
          <rect x="20" y="52" width="24" height="12" rx="4" fill="#2563eb" />
          {/* Face */}
          <circle cx="32" cy="43" r="16" fill="#f5cfaa" />
          {/* Turban base */}
          <ellipse cx="32" cy="28" rx="20" ry="12" fill="white" />
          <ellipse cx="32" cy="32" rx="15" ry="7" fill="#e8e8e8" />
          {/* Gold ornament */}
          <circle cx="32" cy="27" r="4" fill="#f59e0b" stroke="#d97706" strokeWidth="0.5" />
          {/* Red feather */}
          <path d="M49 24 C54 15 60 8 57 3 C54 8 50 17 48 23 C52 16 56 9 57 3 Q54 11 49 24Z" fill="#dc2626" />
          {/* Hair peek */}
          <path d="M14 34 Q13 42 19 46" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M50 34 Q51 42 45 46" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Eyes */}
          <circle cx="27" cy="43" r="2.5" fill="#1a1a1a" />
          <circle cx="37" cy="43" r="2.5" fill="#1a1a1a" />
          <circle cx="28" cy="42" r="0.8" fill="white" />
          <circle cx="38" cy="42" r="0.8" fill="white" />
          {/* Smile */}
          <path d="M27 50 Q32 54 37 50" stroke="#1a1a1a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  )
}
