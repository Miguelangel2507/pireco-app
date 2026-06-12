'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Pencil, Trash2, FileText, ChevronDown } from 'lucide-react'
import Button from '@/components/ui/Button'
import BudgetStatusBadge from '@/components/presupuestos/BudgetStatusBadge'
import BudgetModal from '@/components/presupuestos/BudgetModal'
import DeleteBudgetModal from '@/components/presupuestos/DeleteBudgetModal'
import type { Budget, BudgetItem, Client } from '@/types/database'

type BudgetWithItems = Budget & { budget_items: BudgetItem[] }
type BudgetWithClient = BudgetWithItems & { client: Client | null }

const STATUS_LABELS = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
} as const

function calcTotal(items: BudgetItem[], ivaPct: number) {
  const base = items.reduce((s, i) => s + (i.quantity ?? 0) * (i.unit_price ?? 0), 0)
  return base * (1 + ivaPct / 100)
}

export default function PresupuestosPage() {
  const [budgets, setBudgets] = useState<BudgetWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Budget['status'] | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selected, setSelected] = useState<BudgetWithItems | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('budgets')
      .select('*, budget_items(*), client:clients(id, name, cif, city, contact_name, phone, email, address, postal_code, notes, created_at)')
      .order('created_at', { ascending: false })
    setBudgets((data as BudgetWithClient[]) ?? [])
    setLoading(false)
  }, [])

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
    setUpdatingStatus(budget.id)
    const supabase = createClient()
    await supabase.from('budgets').update({ status: newStatus }).eq('id', budget.id)
    setUpdatingStatus(null)
    fetchBudgets()
  }

  const openCreate = () => { setSelected(null); setModalOpen(true) }
  const openEdit = (b: BudgetWithClient) => { setSelected(b); setModalOpen(true) }
  const openDelete = (b: BudgetWithClient) => { setSelected(b); setDeleteModalOpen(true) }

  return (
    <div>
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

      {/* Filters */}
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
              {s === 'all' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Número</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell">Fecha</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">Caducidad</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden lg:table-cell">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Estado</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((budget) => (
                  <tr key={budget.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-gray-900 dark:text-white text-xs">
                        {budget.number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {budget.client?.name ?? '—'}
                      </div>
                      {budget.client?.city && (
                        <div className="text-xs text-gray-400 mt-0.5">{budget.client.city}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                      {budget.issue_date
                        ? new Date(budget.issue_date).toLocaleDateString('es-ES')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {budget.expiry_date
                        ? new Date(budget.expiry_date).toLocaleDateString('es-ES')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {calcTotal(budget.budget_items, budget.iva_pct).toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} €
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative inline-block">
                        <div className="flex items-center gap-1">
                          <BudgetStatusBadge status={budget.status} />
                          <div className="relative group/status">
                            <button
                              className="p-0.5 rounded text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                              disabled={updatingStatus === budget.id}
                              title="Cambiar estado"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover/status:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[130px]">
                              {(['draft', 'sent', 'accepted', 'rejected'] as const).map((s) => (
                                <button
                                  key={s}
                                  onClick={() => handleStatusChange(budget, s)}
                                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                    budget.status === s ? 'font-semibold text-primary-700' : 'text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  {STATUS_LABELS[s]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                ))}
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
