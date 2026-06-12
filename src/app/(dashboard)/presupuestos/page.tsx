'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Pencil, Trash2, FileText, Receipt, FilePlus } from 'lucide-react'
import Button from '@/components/ui/Button'
import BudgetModal from '@/components/presupuestos/BudgetModal'
import DeleteBudgetModal from '@/components/presupuestos/DeleteBudgetModal'
import type { Budget, BudgetItem, Client } from '@/types/database'
import { useRouter } from 'next/navigation'

type BudgetWithItems = Budget & { budget_items: BudgetItem[] }
type BudgetWithClient = BudgetWithItems & { client: Client | null }

const STATUS_OPTIONS = [
  { value: 'draft',    label: 'Borrador',  bg: 'rgba(255,159,10,0.15)',  color: '#C07000' },
  { value: 'sent',     label: 'Enviado',   bg: 'rgba(59,111,212,0.18)',  color: '#2B5AB8' },
  { value: 'accepted', label: 'Aceptado',  bg: 'rgba(48,209,88,0.15)',   color: '#1A8A38' },
  { value: 'rejected', label: 'Rechazado', bg: 'rgba(255,69,58,0.12)',   color: '#C0392B' },
] as const

function calcTotal(items: BudgetItem[], ivaPct: number) {
  const base = items.reduce((s, i) => s + (i.quantity ?? 0) * (i.unit_price ?? 0), 0)
  return base * (1 + ivaPct / 100)
}

export default function PresupuestosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [budgets, setBudgets] = useState<BudgetWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Budget['status'] | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selected, setSelected] = useState<BudgetWithItems | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('budgets')
      .select('*, budget_items(*), client:clients(id, name, cif, city, contact_name, phone, email, address, postal_code, notes, created_at)')
      .order('created_at', { ascending: false })
    setBudgets((data as BudgetWithClient[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchBudgets() }, [fetchBudgets])

  const filtered = budgets.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false
    const q = search.toLowerCase()
    return (
      b.number.toLowerCase().includes(q) ||
      (b.client?.name ?? '').toLowerCase().includes(q) ||
      (b.client?.city ?? '').toLowerCase().includes(q)
    )
  })

  async function handleStatusChange(budget: BudgetWithClient, newStatus: Budget['status']) {
    setStatusError(null)
    const { error } = await supabase.from('budgets').update({ status: newStatus }).eq('id', budget.id)
    if (error) {
      setStatusError(`Error al cambiar estado: ${error.message}`)
    } else {
      fetchBudgets()
    }
  }

  async function getNextDocNumber(): Promise<{ num: number; settingsId: string }> {
    const { data } = await supabase.from('company_settings').select('id, next_invoice_num').single()
    return { num: data?.next_invoice_num ?? 1, settingsId: data?.id ?? '' }
  }

  async function handleGenerateProforma(budget: BudgetWithClient) {
    setGenerating(budget.id + ':proforma')
    try {
      const { num, settingsId } = await getNextDocNumber()
      const number = `PRO-${String(num).padStart(4, '0')}`
      const { error } = await supabase.from('proformas').insert({
        number,
        budget_id: budget.id,
        client_id: budget.client_id,
        status: 'active',
        issue_date: new Date().toISOString().slice(0, 10),
        notes: budget.notes,
      })
      if (error) throw error
      await supabase.from('company_settings').update({ next_invoice_num: num + 1 }).eq('id', settingsId)
      router.push('/proformas')
    } catch (err) {
      alert((err as { message?: string })?.message ?? 'Error al generar proforma')
    } finally {
      setGenerating(null)
    }
  }

  async function handleGenerateInvoice(budget: BudgetWithClient) {
    setGenerating(budget.id + ':invoice')
    try {
      const { num, settingsId } = await getNextDocNumber()
      const number = `FAC-${String(num).padStart(4, '0')}`
      const { data: inv, error } = await supabase
        .from('invoices')
        .insert({
          number,
          budget_id: budget.id,
          client_id: budget.client_id,
          status: 'pending',
          issue_date: new Date().toISOString().slice(0, 10),
          iva_pct: budget.iva_pct,
          notes: budget.notes,
        })
        .select('id')
        .single()
      if (error) throw error
      const validItems = budget.budget_items.filter((i) => i.description)
      if (validItems.length > 0) {
        await supabase.from('invoice_items').insert(
          validItems.map((i) => ({
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
      await supabase.from('company_settings').update({ next_invoice_num: num + 1 }).eq('id', settingsId)
      router.push('/facturas')
    } catch (err) {
      alert((err as { message?: string })?.message ?? 'Error al generar factura')
    } finally {
      setGenerating(null)
    }
  }

  const openCreate = () => { setSelected(null); setModalOpen(true) }
  const openEdit = (b: BudgetWithClient) => { setSelected(b); setModalOpen(true) }
  const openDelete = (b: BudgetWithClient) => { setSelected(b); setDeleteModalOpen(true) }

  return (
    <div>
      {statusError && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {statusError}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Presupuestos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {budgets.length} {budgets.length === 1 ? 'presupuesto' : 'presupuestos'} en total
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nuevo presupuesto
        </Button>
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
          {(['all', 'draft', 'sent', 'accepted', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-primary-700 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {s === 'all' ? 'Todos' : STATUS_OPTIONS.find((o) => o.value === s)?.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-card overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="inline-block w-6 h-6 border-2 border-primary-700 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Cargando presupuestos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {search || statusFilter !== 'all' ? 'No se encontraron presupuestos' : 'Aún no hay presupuestos'}
            </p>
            {!search && statusFilter === 'all' && (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Haz clic en &quot;Nuevo presupuesto&quot; para empezar
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                  <th className="text-left px-4 py-3" style={{ color: 'var(--text-sub)', fontSize: 11, fontWeight: 600 }}>Número</th>
                  <th className="text-left px-4 py-3" style={{ color: 'var(--text-sub)', fontSize: 11, fontWeight: 600 }}>Cliente</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell" style={{ color: 'var(--text-sub)', fontSize: 11, fontWeight: 600 }}>Fecha</th>
                  <th className="text-right px-4 py-3 hidden lg:table-cell" style={{ color: 'var(--text-sub)', fontSize: 11, fontWeight: 600 }}>Total</th>
                  <th className="text-left px-4 py-3" style={{ color: 'var(--text-sub)', fontSize: 11, fontWeight: 600 }}>Estado</th>
                  <th className="px-4 py-3 w-28" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((budget) => {
                  const statusOpt = STATUS_OPTIONS.find((o) => o.value === budget.status)
                  return (
                    <tr key={budget.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium" style={{ color: 'var(--text)', fontSize: 11 }}>{budget.number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{budget.client?.name ?? '—'}</div>
                        {budget.client?.city && <div className="text-xs text-gray-400 mt-0.5">{budget.client.city}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                        {budget.issue_date ? new Date(budget.issue_date).toLocaleDateString('es-ES') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {calcTotal(budget.budget_items, budget.iva_pct).toLocaleString('es-ES', {
                            minimumFractionDigits: 2, maximumFractionDigits: 2,
                          })} €
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={budget.status}
                          onChange={(e) => handleStatusChange(budget, e.target.value as Budget['status'])}
                          className="text-xs font-semibold px-2.5 py-0.5 rounded-chip border-0 cursor-pointer focus:outline-none"
                          style={{
                            backgroundColor: statusOpt?.bg ?? 'transparent',
                            color: statusOpt?.color ?? 'var(--text)',
                            fontSize: 11,
                          }}
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {budget.status === 'accepted' && (
                            <>
                              <button
                                onClick={() => handleGenerateProforma(budget)}
                                disabled={!!generating}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                title="Generar proforma"
                              >
                                <Receipt className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleGenerateInvoice(budget)}
                                disabled={!!generating}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                title="Generar factura directa"
                              >
                                <FilePlus className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openEdit(budget)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDelete(budget)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BudgetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        budget={selected}
        onSaved={fetchBudgets}
      />
      <DeleteBudgetModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        budget={selected}
        onDeleted={fetchBudgets}
      />
    </div>
  )
}
