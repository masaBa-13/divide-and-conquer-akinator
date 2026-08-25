'use client'

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-4 flex flex-col gap-3">
      <p className="text-red-700 font-medium text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="self-start rounded-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium transition-colors"
        >
          もう一度試す
        </button>
      )}
    </div>
  )
}
