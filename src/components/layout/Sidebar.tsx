'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, FileText, Receipt, Calendar,
  ShoppingCart, Settings, PaintBucket, LogOut, ChevronRight,
  FileCheck, FileClock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { href: '/',             label: 'Panel',        icon: LayoutDashboard },
  { href: '/clientes',     label: 'Clientes',     icon: Users },
  { href: '/presupuestos', label: 'Presupuestos', icon: FileText },
  { href: '/proformas',    label: 'Proformas',    icon: FileClock },
  { href: '/facturas',     label: 'Facturas',     icon: FileCheck },
  { href: '/calendario',   label: 'Calendario',   icon: Calendar },
  { href: '/compras',      label: 'Compras',      icon: ShoppingCart },
  { href: '/ajustes',      label: 'Ajustes',      icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useAuth()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl bg-navy-800 flex items-center justify-center shrink-0">
          <PaintBucket className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-sidebar-foreground leading-tight truncate">
            Pinturas Pireco
          </p>
          <p className="text-xs text-muted-foreground">Gestión interna</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                'transition-default group',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-border/60'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-80')} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: profile?.avatar_color ?? '#1E3A8A' }}
          >
            {profile?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {profile?.name ?? 'Cargando…'}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {profile?.role === 'admin' ? 'Administrador' : 'Empleado'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-default"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
