'use client'

import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'

const pageTitles: Record<string, string> = {
  '/':             'Panel de control',
  '/clientes':     'Clientes',
  '/presupuestos': 'Presupuestos',
  '/proformas':    'Proformas',
  '/facturas':     'Facturas',
  '/calendario':   'Calendario',
  '/compras':      'Lista de compras',
  '/ajustes':      'Ajustes',
}

export function Topbar() {
  const pathname = usePathname()
  const { profile } = useAuth()

  const title = Object.entries(pageTitles)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => pathname === path || (path !== '/' && pathname.startsWith(path)))?.[1]
    ?? 'Pinturas Pireco'

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-sm">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: profile?.avatar_color ?? '#1E3A8A' }}
          title={profile?.name}
        >
          {profile?.name?.charAt(0).toUpperCase() ?? '?'}
        </div>
      </div>
    </header>
  )
}
