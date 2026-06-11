'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center',
        'text-muted-foreground hover:text-foreground hover:bg-muted',
        'transition-default focus:outline-none focus:ring-2 focus:ring-ring'
      )}
      aria-label="Cambiar tema"
    >
      {theme === 'dark' ? (
        <Sun className="w-4.5 h-4.5" />
      ) : (
        <Moon className="w-4.5 h-4.5" />
      )}
    </button>
  )
}
