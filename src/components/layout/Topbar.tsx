'use client'

import { usePathname } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/clientes': 'Clientes',
  '/presupuestos': 'Presupuestos',
  '/proformas': 'Proformas',
  '/facturas': 'Facturas',
  '/calendario': 'Calendario',
  '/compras': 'Compras',
  '/ajustes': 'Ajustes',
}

export default function Topbar() {
  const pathname = usePathname()
  const title = routeTitles[pathname] ?? 'Dashboard'

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white md:block hidden">
        {title}
      </h2>
      {/* Spacer for mobile (hamburger is fixed) */}
      <div className="md:hidden w-10" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white md:hidden">
        {title}
      </h2>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="w-9 h-9 rounded-full bg-primary-700 flex items-center justify-center text-white text-sm font-semibold">
          PP
        </div>
      </div>
    </header>
  )
}
