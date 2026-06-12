'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Receipt, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ProformaDetailModal from '@/components/proformas/ProformaDetailModal'
import type { Proforma, Client, Budget, BudgetItem } from '@/types/database'

type ProformaFull = Proforma & {
  client: Client | null
  budget: (Budget & { budget_items: BudgetItem[] }) | null
}

function calcTotal(items: BudgetItem[], ivaPct: number) {
  const base = items.reduce((s, i) => s + (i.quantity ?? 0) * (i.unit_price ?? 0), 0)
  return base * (1 + ivaPct / 100)
}

export default function ProformasPage() {
  const supabase = createClient()
  const router = useRouter()
  const [proformas, setProformas] = useState<ProformaFull[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [converting, setConverting] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedProforma, setSelectedProforma] = useState<ProformaFull | null>(null)

  const fetchProformas = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('proformas')
      .select('*, client:clients(id,name,cif,city,contact_name,phone,email,address,postal_code,notes,created_at), budget:budgets(*, budget_items(*))')
      .order('created_at', { ascending: false })
    setProformas((data as ProformaFull[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchProformas() }, [fetchProformas])

  const filtered = proformas.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.number.toLowerCase().includes(q) ||
      (p.client?.name ?? '').toLowerCase().includes(q)
    )
  })

  async function handleConvertToInvoice(proforma: ProformaFull) {
    setDetailOpen(false)
    setConverting(proforma.id)
    try {
      // Number: same as proforma but FAC- prefix
      const invoiceNumber = proforma.number.replace(/^PRO-/, 'FAC-')
      const budget = proforma.budget

      const { data: inv, error } = await supabase
        .from('invoices')
        .insert({
          number: invoiceNumber,
          budget_id: proforma.budget_id,
          proforma_id: proforma.id,
          client_id: proforma.client_id,
          status: 'pending',
          issue_date: new Date().toISOString().slice(0, 10),
          iva_pct: budget?.iva_pct ?? 21,
          notes: proforma.notes,
        })
        .select('id')
        .single()
      if (error) throw error

      // Copy budget items to invoice items
      const items = budget?.budget_items ?? []
      if (items.length > 0) {
        await supabase.from('invoice_items').insert(
          items.map((i) => ({
            invoice_id: inv.id,
            description: i.description,
            sub_description: i.sub_description,
            quantity: i.quantity,
            unit: i.unit,
            unit_price: i.unit_price,
            tag: i.tag,
            sort_order: i.sort_order,
          }))
        )
      }

      // Mark proforma as converted
      await supabase.from('proformas').update({ status: 'converted' }).eq('id', proforma.id)
      router.push('/facturas')
    } catch (err) {
      alert((err as { message?: string })?.message ?? 'Error al convertir')
    } finally {
      setConverting(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta proforma?')) return
    await supabase.from('proformas').delete().eq('id', id)
    fetchProformas()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proformas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {proformas.length} {proformas.length === 1 ? 'proforma' : 'proformas'} en total
          </p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por número, cliente..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent transition"
        />
      </div>

      <div className="rounded-card overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="inline-block w-6 h-6 border-2 border-primary-700 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Cargando proformas...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {search ? 'No se encontraron proformas' : 'Aún no hay proformas'}
            </p>
            {!search && (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Genera una proforma desde un presupuesto aceptado
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
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell">Presupuesto</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell">Fecha</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden lg:table-cell">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Estado</th>
                  <th className="px-4 py-3 w-28" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((proforma) => (
                  <tr key={proforma.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer" onClick={() => { setSelectedProforma(proforma); setDetailOpen(true) }}>
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-gray-900 dark:text-white text-xs">
                        {proforma.number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{proforma.client?.name ?? '—'}</div>
                      {proforma.client?.city && <div className="text-xs text-gray-400 mt-0.5">{proforma.client.city}</div>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-mono text-xs text-gray-400">{proforma.budget?.number ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                      {proforma.issue_date ? new Date(proforma.issue_date).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {proforma.budget
                          ? calcTotal(proforma.budget.budget_items, proforma.budget.iva_pct).toLocaleString('es-ES', {
                              minimumFractionDigits: 2, maximumFractionDigits: 2,
                            }) + ' €'
                          : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {proforma.status === 'active' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-chip text-xs font-medium" style={{ backgroundColor: '#E0E7FF', color: '#3730A3' }}>
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-chip text-xs font-medium" style={{ backgroundColor: 'rgba(0,0,0,0.06)', color: 'var(--text-sub)' }}>
                          Convertida
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(proforma.id) }}
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
      <ProformaDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        proforma={selectedProforma}
        onConvert={() => selectedProforma && handleConvertToInvoice(selectedProforma)}
        converting={converting === selectedProforma?.id}
      />
    </div>
  )
}
