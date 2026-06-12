'use client'

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, FileText, Trash2, ChevronDown, CheckCircle } from 'lucide-react'
import InvoiceDetailModal from '@/components/facturas/InvoiceDetailModal'
import type { Invoice, InvoiceItem, Client } from '@/types/database'

type InvoiceFull = Invoice & {
  invoice_items: InvoiceItem[]
  client: Client | null
}

const STATUS_CONFIG = {
  pending:  { label: 'Pendiente', classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  paid:     { label: 'Pagada',    classes: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  overdue:  { label: 'Vencida',   classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
} as const

function calcTotal(items: InvoiceItem[], ivaPct: number) {
  const base = items.reduce((s, i) => s + (i.quantity ?? 0) * (i.unit_price ?? 0), 0)
  return base * (1 + ivaPct / 100)
}

export default function FacturasPage() {
  const supabase = createClient()
  const [invoices, setInvoices] = useState<InvoiceFull[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Invoice['status'] | 'all'>('all')
  const [openStatusId, setOpenStatusId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceFull | null>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useLayoutEffect(() => {
    if (!openStatusId) return
    const btn = buttonRefs.current[openStatusId]
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX })
  }, [openStatusId])

  useEffect(() => {
    function handleClickOutside() { setOpenStatusId(null) }
    if (openStatusId) {
      setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openStatusId])

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('invoices')
      .select('*, invoice_items(*), client:clients(id,name,cif,city,contact_name,phone,email,address,postal_code,notes,created_at)')
      .order('created_at', { ascending: false })
    setInvoices((data as InvoiceFull[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const filtered = invoices.filter((inv) => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false
    const q = search.toLowerCase()
    return (
      inv.number.toLowerCase().includes(q) ||
      (inv.client?.name ?? '').toLowerCase().includes(q)
    )
  })

  async function handleStatusChange(invoice: InvoiceFull, newStatus: Invoice['status']) {
    const update: Partial<Invoice> = { status: newStatus }
    if (newStatus === 'paid' && !invoice.paid_date) {
      update.paid_date = new Date().toISOString().slice(0, 10)
    }
    await supabase.from('invoices').update(update).eq('id', invoice.id)
    fetchInvoices()
  }

  async function handleMarkPaid(invoice: InvoiceFull) {
    await supabase
      .from('invoices')
      .update({ status: 'paid', paid_date: new Date().toISOString().slice(0, 10) })
      .eq('id', invoice.id)
    fetchInvoices()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta factura?')) return
    await supabase.from('invoices').delete().eq('id', id)
    fetchInvoices()
  }

  const totalPending = invoices
    .filter((i) => i.status === 'pending' || i.status === 'overdue')
    .reduce((s, i) => s + calcTotal(i.invoice_items, i.iva_pct), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Facturas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {invoices.length} {invoices.length === 1 ? 'factura' : 'facturas'} en total
            {totalPending > 0 && (
              <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-medium">
                · {totalPending.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € pendiente
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, cliente..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent transition"
          />
        </div>
        <div className="flex gap-1 p-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {(['all', 'pending', 'paid', 'overdue'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-primary-700 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {s === 'all' ? 'Todas' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="inline-block w-6 h-6 border-2 border-primary-700 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Cargando facturas...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {search || statusFilter !== 'all' ? 'No se encontraron facturas' : 'Aún no hay facturas'}
            </p>
            {!search && statusFilter === 'all' && (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Genera facturas desde un presupuesto aceptado
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Número</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell">Emisión</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">Vencimiento</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Estado</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer" onClick={() => { setSelectedInvoice(invoice); setDetailOpen(true) }}>
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-gray-900 dark:text-white text-xs">
                        {invoice.number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{invoice.client?.name ?? '—'}</div>
                      {invoice.client?.city && <div className="text-xs text-gray-400 mt-0.5">{invoice.client.city}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                      {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {invoice.due_date ? (
                        <span className={new Date(invoice.due_date) < new Date() && invoice.status === 'pending' ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                          {new Date(invoice.due_date).toLocaleDateString('es-ES')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {calcTotal(invoice.invoice_items, invoice.iva_pct).toLocaleString('es-ES', {
                          minimumFractionDigits: 2, maximumFractionDigits: 2,
                        })} €
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[invoice.status].classes}`}>
                          {STATUS_CONFIG[invoice.status].label}
                        </span>
                        <button
                          ref={(el) => { buttonRefs.current[invoice.id] = el }}
                          className="p-0.5 rounded text-gray-300 hover:text-gray-500 transition-colors"
                          title="Cambiar estado"
                          onClick={(e) => { e.stopPropagation(); setOpenStatusId(openStatusId === invoice.id ? null : invoice.id) }}
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                      {invoice.status === 'paid' && invoice.paid_date && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          Cobrada {new Date(invoice.paid_date).toLocaleDateString('es-ES')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {invoice.status !== 'paid' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMarkPaid(invoice) }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            title="Marcar como cobrada"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(invoice.id) }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openStatusId && (
        <div
          className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[130px]"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {(['pending', 'paid', 'overdue'] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                const inv = invoices.find((x) => x.id === openStatusId)
                if (inv) handleStatusChange(inv, s)
                setOpenStatusId(null)
              }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                invoices.find((x) => x.id === openStatusId)?.status === s
                  ? 'font-semibold text-primary-700'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      )}

      <InvoiceDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        invoice={selectedInvoice}
        onSaved={() => { fetchInvoices(); setDetailOpen(false) }}
      />
    </div>
  )
}
