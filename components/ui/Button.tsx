'use client'

import { cn } from '@/lib/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'yes' | 'no' | 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-full font-bold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'yes' && 'bg-[#2ecc71] hover:bg-[#27ae60] text-white focus:ring-[#2ecc71]',
        variant === 'no' && 'bg-[#e74c3c] hover:bg-[#c0392b] text-white focus:ring-[#e74c3c]',
        variant === 'primary' && 'bg-[#c4893a] hover:bg-[#a6722e] text-white focus:ring-[#c4893a]',
        variant === 'secondary' && 'bg-white hover:bg-gray-100 text-[#c4893a] border border-[#c4893a] focus:ring-[#c4893a]',
        size === 'sm' && 'px-4 py-2 text-sm',
        size === 'md' && 'px-6 py-3 text-base',
        size === 'lg' && 'px-8 py-4 text-lg',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
