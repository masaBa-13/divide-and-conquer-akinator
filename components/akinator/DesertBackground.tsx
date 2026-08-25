export function DesertBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-amber-400 via-amber-200 to-yellow-100">
      {/* Main content */}
      <div className="relative z-10">{children}</div>

      {/* Desert dune silhouette at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none">
        <svg
          viewBox="0 0 1440 200"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-40"
        >
          <path
            d="M0,200 L0,120 Q180,60 360,100 Q540,140 720,80 Q900,20 1080,70 Q1260,120 1440,90 L1440,200 Z"
            fill="#c4893a"
            fillOpacity="0.6"
          />
          <path
            d="M0,200 L0,150 Q240,100 480,130 Q720,160 960,110 Q1200,60 1440,130 L1440,200 Z"
            fill="#a6722e"
            fillOpacity="0.5"
          />
        </svg>
      </div>
    </div>
  )
}
