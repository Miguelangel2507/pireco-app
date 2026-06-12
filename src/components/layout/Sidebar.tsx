'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  FilePlus,
  Receipt,
  Calendar,
  ShoppingCart,
  Settings,
  LogOut,
  Paintbrush,
  X,
  Menu,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const sections = [
  {
    items: [
      { href: '/',          label: 'Panel',        icon: LayoutDashboard },
      { href: '/calendario', label: 'Calendario',   icon: Calendar },
    ],
  },
  {
    label: 'Negocio',
    items: [
      { href: '/clientes',      label: 'Clientes',      icon: Users },
      { href: '/presupuestos',  label: 'Presupuestos',  icon: FileText },
      { href: '/proformas',     label: 'Proformas',     icon: FilePlus },
      { href: '/facturas',      label: 'Facturas',      icon: Receipt },
      { href: '/compras',       label: 'Compras',       icon: ShoppingCart },
    ],
  },
  {
    label: 'Empresa',
    items: [
      { href: '/ajustes', label: 'Ajustes', icon: Settings },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#1E3A8A' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <Paintbrush className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-white leading-tight" style={{ fontSize: 13 }}>Pinturas</p>
          <p className="font-bold leading-tight" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Pireco SL</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-3">
        {sections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="px-3 mb-1 uppercase tracking-widest font-semibold" style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative"
                    style={{
                      backgroundColor: isActive ? 'rgba(255,255,255,0.13)' : 'transparent',
                      color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.72)',
                      borderLeft: isActive ? '2.5px solid #fff' : '2.5px solid transparent',
                      fontSize: 12,
                      fontWeight: isActive ? 600 : 500,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                    }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)' }}
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 h-full flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg shadow-md"
        style={{ backgroundColor: '#1E3A8A', color: 'white' }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-56 h-full z-50">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
