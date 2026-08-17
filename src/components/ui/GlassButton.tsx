import type { ButtonHTMLAttributes } from 'react'

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
}

export function GlassButton({ variant = 'ghost', className = '', ...rest }: GlassButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium transition-all duration-300 ease-out disabled:opacity-40 disabled:pointer-events-none'
  const variants: Record<NonNullable<GlassButtonProps['variant']>, string> = {
    primary: 'bg-(--accent) text-white shadow-[0_4px_20px_rgb(79_107_255_/_0.35)] hover:brightness-110',
    ghost: 'glass hover:brightness-110 text-(--text-primary)',
    danger: 'bg-(--danger) text-white hover:brightness-110',
  }
  return <button className={`${base} ${variants[variant]} ${className}`} {...rest} />
}
