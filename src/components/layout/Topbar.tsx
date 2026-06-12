'use client'

import { usePathname } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

const routeTitles: Record<string, string> = {
  '/':             'Panel',
  '/clientes':     'Clientes',
  '/presupuestos': 'Presupuestos',
  '/proformas':    'Proformas',
  '/facturas':     'Facturas',
  '/calendario':   'Calendario',
  '/compras':      'Compras',
  '/ajustes':      'Ajustes',
}

export default function Topbar() {
  const pathname = usePathname()
  const title = routeTitles[pathname] ?? 'Panel'

  return (
    <header
      className="flex items-center justify-between px-6 py-3.5 flex-shrink-0"
      style={{
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="md:hidden w-8" />
      <h2
        className="font-semibold"
        style={{ color: 'var(--text)', fontSize: 14 }}
      >
        {title}
      </h2>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
          style={{ backgroundColor: '#1E3A8A', fontSize: 11 }}
        >
          PP
        </div>
      </div>
    </header>
  )
}
