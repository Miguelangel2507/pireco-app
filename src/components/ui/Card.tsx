import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
}

export function Card({ header, children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border shadow-card',
        className
      )}
      {...props}
    >
      {header && (
        <div className="px-5 py-4 border-b border-border font-semibold text-foreground">
          {header}
        </div>
      )}
      {children}
    </div>
  )
}
