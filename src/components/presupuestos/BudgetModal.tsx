'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import type { Budget, BudgetItem, Client, Treatment, CompanySettings } from '@/types/database'

type BudgetWithItems = Budget & { budget_items: BudgetItem[] }

interface BudgetModalProps {
  isOpen: boolean
  onClose: () => void
  budget: BudgetWithItems | null
  onSaved: () => void
}

interface ItemDraft {
  id?: string
  description: string
  sub_description: string
  quantity: string
  unit: string
  unit_price: string
  tag: 'interior' | 'exterior' | 'metal' | 'otro' | ''
  sort_order: number
}

const TAG_OPTIONS = [
  { value: '', label: '—' },
  { value: 'interior', label: 'Interior' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'metal', label: 'Metal' },
  { value: 'otro', label: 'Otro' },
]

const IVA_OPTIONS = [0, 10, 21] as const

function newItem(sort_order: number): ItemDraft {
  return { description: '', sub_description: '', quantity: '', unit: 'ud', unit_price: '', tag: '', sort_order }
}

export default function BudgetModal({ isOpen, onClose, budget, onSaved }: BudgetModalProps) {
  const supabase = createClient()
  const isEdit = budget !== null

  const [clients, setClients] = useState<Client[]>([])
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([])

  const [budgetNumber, setBudgetNumber] = useState('')
  const [clientId, setClientId] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [ivaPct, setIvaPct] = useState<0 | 10 | 21>(21)
  const [notes, setNotes] = useState('')
  const [conditions, setConditions] = useState('')
  const [items, setItems] = useState<ItemDraft[]>([newItem(0)])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    const [clientsRes, treatmentsRes, settingsRes] = await Promise.all([
      supabase.from('clients').select('id, name').order('name'),
      supabase.from('treatments').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('company_settings').select('default_conditions, next_budget_num').single(),
    ])
    setClients((clientsRes.data as Client[]) ?? [])
    setTreatments((treatmentsRes.data as Treatment[]) ?? [])
    return settingsRes.data as Pick<CompanySettings, 'default_conditions' | 'next_budget_num'> | null
  }, [supabase])

  useEffect(() => {
    if (!isOpen) return
    fetchData().then((settings) => {
      if (budget) {
        setBudgetNumber(budget.number)
        setClientId(budget.client_id ?? '')
        setIssueDate(budget.issue_date ?? '')
        setExpiryDate(budget.expiry_date ?? '')
        setIvaPct(budget.iva_pct)
        setNotes(budget.notes ?? '')
        setConditions(budget.conditions_text ?? '')
        setItems(
          budget.budget_items.length > 0
            ? budget.budget_items
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((i) => ({
                  id: i.id,
                  description: i.description,
                  sub_description: i.sub_description ?? '',
                  quantity: i.quantity?.toString() ?? '',
                  unit: i.unit ?? 'ud',
                  unit_price: i.unit_price?.toString() ?? '',
                  tag: i.tag ?? '',
                  sort_order: i.sort_order,
                }))
            : [newItem(0)]
        )
        // Load linked treatments
        supabase
          .from('budget_treatments')
          .select('treatment_id')
          .eq('budget_id', budget.id)
          .then(({ data }) => setSelectedTreatments((data ?? []).map((r) => r.treatment_id)))
      } else {
        const nextNum = (settings?.next_budget_num ?? 1) as number
        setBudgetNumber(`PRE-${String(nextNum).padStart(4, '0')}`)
        setClientId('')
        setIssueDate(new Date().toISOString().slice(0, 10))
        setExpiryDate('')
        setIvaPct(21)
        setNotes('')
        setConditions(settings?.default_conditions ?? '')
        setItems([newItem(0)])
        setSelectedTreatments([])
      }
      setError(null)
    })
  }, [isOpen, budget, fetchData, supabase])

  function toggleTreatment(id: string) {
    setSelectedTreatments((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  function addItem() {
    setItems((prev) => [...prev, newItem(prev.length)])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateItem<K extends keyof ItemDraft>(index: number, key: K, value: ItemDraft[K]) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
  }

  function handleDragStart(index: number) {
    setDragIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    setDragOverIndex(index)
  }

  function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    setItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return next.map((item, i) => ({ ...item, sort_order: i }))
    })
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unit_price) || 0
    return sum + qty * price
  }, 0)
  const ivaAmount = subtotal * (ivaPct / 100)
  const total = subtotal + ivaAmount

  async function handleSave() {
    setError(null)
    if (!clientId) { setError('Selecciona un cliente'); return }
    if (!budgetNumber.trim()) { setError('El número de presupuesto es obligatorio'); return }

    setSaving(true)
    try {
      let budgetId: string

      if (isEdit && budget) {
        const { error: err } = await supabase
          .from('budgets')
          .update({
            number: budgetNumber.trim(),
            client_id: clientId,
            issue_date: issueDate || null,
            expiry_date: expiryDate || null,
            iva_pct: ivaPct,
            notes: notes.trim() || null,
            conditions_text: conditions.trim() || null,
          })
          .eq('id', budget.id)
        if (err) throw err
        budgetId = budget.id
      } else {
        const { data: inserted, error: err } = await supabase
          .from('budgets')
          .insert({
            number: budgetNumber.trim(),
            client_id: clientId,
            status: 'draft',
            issue_date: issueDate || null,
            expiry_date: expiryDate || null,
            iva_pct: ivaPct,
            notes: notes.trim() || null,
            conditions_text: conditions.trim() || null,
          })
          .select('id')
          .single()
        if (err) throw err
        budgetId = inserted.id

        // Increment counter only if number matches pattern PRE-XXXX
        if (/^PRE-\d+$/.test(budgetNumber.trim())) {
          const num = parseInt(budgetNumber.replace('PRE-', ''), 10)
          const { data: settings } = await supabase.from('company_settings').select('id, next_budget_num').single()
          if (settings && num >= (settings.next_budget_num ?? 1)) {
            await supabase
              .from('company_settings')
              .update({ next_budget_num: num + 1 })
              .eq('id', settings.id)
          }
        }
      }

      // Replace items
      if (isEdit && budget) {
        const { error: delErr } = await supabase.from('budget_items').delete().eq('budget_id', budget.id)
        if (delErr) throw delErr
      }

      const validItems = items.filter((i) => i.description.trim())
      if (validItems.length > 0) {
        const { error: itemsErr } = await supabase.from('budget_items').insert(
          validItems.map((item, idx) => ({
            budget_id: budgetId,
            description: item.description.trim(),
            sub_description: item.sub_description.trim() || null,
            quantity: parseFloat(item.quantity) || null,
            unit: item.unit.trim() || null,
            unit_price: parseFloat(item.unit_price) || null,
            tag: item.tag || null,
            sort_order: idx,
          }))
        )
        if (itemsErr) throw itemsErr
      }

      // Replace treatments
      await supabase.from('budget_treatments').delete().eq('budget_id', budgetId)
      if (selectedTreatments.length > 0) {
        await supabase.from('budget_treatments').insert(
          selectedTreatments.map((tid) => ({ budget_id: budgetId, treatment_id: tid }))
        )
      }

      onSaved()
      onClose()
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? JSON.stringify(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Editar ${budget?.number}` : 'Nuevo presupuesto'}
      className="max-w-4xl"
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Header fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Input
              label="Número"
              value={budgetNumber}
              onChange={(e) => setBudgetNumber(e.target.value)}
              placeholder="PRE-0001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cliente *
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent transition border-gray-300 dark:border-gray-600"
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Fecha emisión"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
          />
          <Input
            label="Fecha caducidad"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>

        {/* Line items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Partidas</span>
            <Button size="sm" variant="secondary" onClick={addItem}>
              <Plus className="w-3.5 h-3.5" />
              Añadir partida
            </Button>
          </div>

          <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1.5rem_1fr_5rem_4rem_5rem_4.5rem_1.5rem] gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
              <span />
              <span>Descripción</span>
              <span>Cant.</span>
              <span>Ud.</span>
              <span>P. unitario</span>
              <span>Tipo</span>
              <span />
            </div>

            {items.map((item, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => { setDragIndex(null); setDragOverIndex(null) }}
                className={`grid grid-cols-[1.5rem_1fr_5rem_4rem_5rem_4.5rem_1.5rem] gap-2 px-3 py-2 border-b last:border-b-0 border-gray-100 dark:border-gray-700 items-start transition-colors ${
                  dragOverIndex === index && dragIndex !== index
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : dragIndex === index
                    ? 'opacity-40'
                    : ''
                }`}
              >
                <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-2 cursor-grab active:cursor-grabbing" />
                <div className="space-y-1">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Descripción de la partida..."
                    className="w-full px-2 py-1.5 rounded-md border text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-700 border-gray-300 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={item.sub_description}
                    onChange={(e) => updateItem(index, 'sub_description', e.target.value)}
                    placeholder="Nota adicional (opcional)..."
                    className="w-full px-2 py-1.5 rounded-md border text-xs bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  placeholder="0"
                  min={0}
                  className="px-2 py-1.5 rounded-md border text-sm text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-700 border-gray-300 dark:border-gray-600 mt-0.5"
                />
                <input
                  type="text"
                  value={item.unit}
                  onChange={(e) => updateItem(index, 'unit', e.target.value)}
                  placeholder="ud"
                  className="px-2 py-1.5 rounded-md border text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-700 border-gray-300 dark:border-gray-600 mt-0.5"
                />
                <input
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  className="px-2 py-1.5 rounded-md border text-sm text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-700 border-gray-300 dark:border-gray-600 mt-0.5"
                />
                <select
                  value={item.tag}
                  onChange={(e) => updateItem(index, 'tag', e.target.value as ItemDraft['tag'])}
                  className="px-2 py-1.5 rounded-md border text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-700 border-gray-300 dark:border-gray-600 mt-0.5"
                >
                  {TAG_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="mt-2 p-0.5 rounded text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Treatments */}
        {treatments.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tratamientos</span>
            <div className="flex flex-wrap gap-2">
              {treatments.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTreatment(t.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedTreatments.includes(t.id)
                      ? 'bg-primary-700 text-white border-primary-700'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-700 hover:text-primary-700'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Totals + extra fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Notas internas..."
                className="w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent transition border-gray-300 dark:border-gray-600 resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Condiciones
                <span className="text-xs font-normal text-gray-400 ml-2">(se puede editar en Ajustes)</span>
              </label>
              <textarea
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                rows={4}
                placeholder="Condiciones del presupuesto..."
                className="w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent transition border-gray-300 dark:border-gray-600 resize-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">IVA</label>
              <div className="flex gap-2">
                {IVA_OPTIONS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setIvaPct(pct)}
                    className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      ivaPct === pct
                        ? 'bg-primary-700 text-white border-primary-700'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <div className="flex justify-between items-center px-4 py-2.5 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Base imponible</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </span>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">IVA ({ivaPct}%)</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {ivaAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </span>
                </div>
                <div className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-sm font-semibold">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-primary-700 dark:text-primary-400 text-base">
                    {total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-gray-200 dark:border-gray-700">
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear presupuesto'}
        </Button>
      </div>
    </Modal>
  )
}
