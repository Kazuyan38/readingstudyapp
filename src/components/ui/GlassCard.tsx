import type { HTMLAttributes, ReactNode } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'sm' | 'md' | 'lg'
}

const paddingClass: Record<NonNullable<GlassCardProps['padding']>, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function GlassCard({ children, padding = 'md', className = '', ...rest }: GlassCardProps) {
  return (
    <div className={`glass ${paddingClass[padding]} ${className}`} {...rest}>
      {children}
    </div>
  )
}
