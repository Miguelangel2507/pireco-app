import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-btn transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-primary text-white hover:bg-primary-800 focus:ring-primary': variant === 'primary',
            'text-[color:var(--text)] hover:opacity-80 focus:ring-primary': variant === 'secondary',
            'text-[color:var(--text-sub)] hover:text-[color:var(--text)] focus:ring-primary': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600': variant === 'danger',
          },
          variant === 'secondary' && 'border',
          {
            'text-xs px-3 py-1.5 gap-1.5': size === 'sm',
            'text-xs px-4 py-2 gap-2':     size === 'md',
            'text-sm px-5 py-2.5 gap-2':   size === 'lg',
          },
          className
        )}
        style={variant === 'secondary' ? {
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)',
          color: 'var(--text)',
        } : undefined}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export default Button
