'use client'

import { cn } from '@/lib/cn'

interface ChoiceButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

export function ChoiceButton({ label, className, ...props }: ChoiceButtonProps) {
  return (
    <button
      className={cn(
        'w-full px-6 py-3 rounded-xl font-medium text-white text-left',
        'bg-[#c4893a] hover:bg-[#a6722e] transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-[#c4893a] focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'border border-[#a6722e] shadow-sm',
        className
      )}
      {...props}
    >
      {label}
    </button>
  )
}
