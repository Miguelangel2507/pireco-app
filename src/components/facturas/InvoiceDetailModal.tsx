'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { CheckCircle, Plus, Trash2, GripVertical, FileText, LayoutList, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import DocumentPreview from '@/components/shared/DocumentPreview'
import { downloadPdf } from '@/lib/downloadPdf'
import type { Invoice, InvoiceItem, Client, CompanySettings } from '@/types/database'

type InvoiceFull = Invoice & { invoice_items: InvoiceItem[]; client: Client | null }

interface ItemDraft {
  id?: string
  description: string
  sub_description: string
  quantity: string
  unit: string
  unit_price: string
  sort_order: number
}

interface Props {
  isOpen: boolean
  onClose: () => void
  invoice: InvoiceFull | null
  onSaved: () => void
}

function toDraft(item: InvoiceItem): ItemDraft {
  return {
    id: item.id,
    description: item.description,
    sub_description: item.sub_description ?? '',
    quantity: item.quantity?.toString() ?? '',
    unit: item.unit ?? 'ud',
    unit_price: item.unit_price?.toString() ?? '',
    sort_order: item.sort_order,
  }
}

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', classes: 'bg-yellow-100 text-yellow-700' },
  paid:    { label: 'Pagada',    classes: 'bg-green-100 text-green-700' },
  overdue: { label: 'Vencida',   classes: 'bg-red-100 text-red-700' },
} as const

export default function InvoiceDetailModal({ isOpen, onClose, invoice, onSaved }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<'data' | 'preview'>('data')
  const [editing, setEditing] = useState(false)
  const [items, setItems] = useState<ItemDraft[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [company, setCompany] = useState<CompanySettings | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      supabase.from('company_settings').select('*').single().then(({ data }) => {
        setCompany(data as CompanySettings)
      })
      setTab('data')
      setEditing(false)
      setError(null)
    }
  }, [isOpen])

  function startEditing() {
    setItems(
      (invoice?.invoice_items ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(toDraft)
    )
    setEditing(true)
    setTab('data')
  }

  function cancelEditing() {
    setEditing(false)
    setError(null)
  }

  function addItem() {
    setItems((prev) => [...prev, { description: '', sub_description: '', quantity: '', unit: 'ud', unit_price: '', sort_order: prev.length }])
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateItem<K extends keyof ItemDraft>(i: number, key: K, val: ItemDraft[K]) {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item))
  }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    if (dragIndex === null || dragIndex === i) return
    setItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(i, 0, moved)
      return next.map((item, idx) => ({ ...item, sort_order: idx }))
    })
    setDragIndex(i)
  }

  async function handleSave() {
    if (!invoice) return
    setSaving(true)
    setError(null)
    try {
      await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id)
      const valid = items.filter((i) => i.description.trim())
      if (valid.length > 0) {
        const { error: err } = await supabase.from('invoice_items').insert(
          valid.map((item, idx) => ({
            invoice_id: invoice.id,
            description: item.description.trim(),
            sub_description: item.sub_description.trim() || null,
            quantity: parseFloat(item.quantity) || null,
            unit: item.unit.trim() || null,
            unit_price: parseFloat(item.unit_price) || null,
            tag: null,
            sort_order: idx,
          }))
        )
        if (err) throw err
      }
      setEditing(false)
      onSaved()
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDownloadPdf() {
    if (!invoice) return
    setDownloading(true)
    try {
      await downloadPdf({
        docType: 'invoice',
        doc: {
          number:    invoice.number,
          status:    invoice.status,
          issue_date: invoice.issue_date,
          due_date:  invoice.due_date,
          iva_pct:   invoice.iva_pct,
          notes:     invoice.notes,
        },
        client: invoice.client,
        items:  invoice.invoice_items,
        company,
      })
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setDownloading(false)
    }
  }

  async function handleMarkPaid() {
    if (!invoice) return
    await supabase
      .from('invoices')
      .update({ status: 'paid', paid_date: new Date().toISOString().slice(0, 10) })
      .eq('id', invoice.id)
    onSaved()
    onClose()
  }

  if (!invoice) return null

  const displayItems = editing
    ? items
    : invoice.invoice_items.sort((a, b) => a.sort_order - b.sort_order)

  const subtotal = (editing ? items : invoice.invoice_items).reduce((s, i) => {
    const qty = (parseFloat((i as ItemDraft).quantity ?? String((i as InvoiceItem).quantity ?? 0)) || ((i as InvoiceItem).quantity ?? 0))
    const price = (parseFloat((i as ItemDraft).unit_price ?? String((i as InvoiceItem).unit_price ?? 0)) || ((i as InvoiceItem).unit_price ?? 0))
    return s + (qty as number) * (price as number)
  }, 0)
  const ivaAmount = subtotal * (invoice.iva_pct / 100)
  const total = subtotal + ivaAmount
  const statusCfg = STATUS_CONFIG[invoice.status]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={invoice.number} className="max-w-4xl">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-700 mb-5 w-fit">
        <button
          onClick={() => setTab('data')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === 'data' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <LayoutList className="w-3.5 h-3.5" />Datos
        </button>
        <button
          onClick={() => setTab('preview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === 'preview' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <FileText className="w-3.5 h-3.5" />Vista previa
        </button>
      </div>

      {tab === 'preview' ? (
        <div className="max-h-[72vh] overflow-y-auto">
          <div className="flex justify-end mb-3">
            <Button onClick={handleDownloadPdf} disabled={downloading}>
              <Download className="w-3.5 h-3.5" />
              {downloading ? 'Generando...' : 'Descargar PDF'}
            </Button>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 p-4">
          <div className="shadow-lg rounded">
            <DocumentPreview
              docType="FACTURA"
              docNumber={invoice.number}
              issueDate={invoice.issue_date}
              dueDate={invoice.due_date}
              client={invoice.client}
              items={invoice.invoice_items.sort((a, b) => a.sort_order - b.sort_order)}
              ivaPct={invoice.iva_pct}
              notes={invoice.notes}
              company={company}
            />
          </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 max-h-[72vh] overflow-y-auto px-1">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* Header */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cliente</p>
              <p className="font-semibold text-gray-900 dark:text-white">{invoice.client?.name ?? '—'}</p>
              {invoice.client?.cif && <p className="text-gray-500 dark:text-gray-400">{invoice.client.cif}</p>}
              {invoice.client?.address && <p className="text-gray-500 dark:text-gray-400">{invoice.client.address}</p>}
              {invoice.client?.city && <p className="text-gray-500 dark:text-gray-400">{invoice.client.city}</p>}
              {invoice.client?.phone && <p className="text-gray-500 dark:text-gray-400">{invoice.client.phone}</p>}
            </div>
            <div className="space-y-2 text-right">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Fecha emisión</p>
                <p className="text-gray-900 dark:text-white">
                  {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('es-ES') : '—'}
                </p>
              </div>
              {invoice.due_date && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Vencimiento</p>
                  <p className={new Date(invoice.due_date) < new Date() && invoice.status === 'pending' ? 'text-red-500 font-medium' : 'text-gray-900 dark:text-white'}>
                    {new Date(invoice.due_date).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.classes}`}>
                {statusCfg.label}
              </span>
              {invoice.status === 'paid' && invoice.paid_date && (
                <p className="text-xs text-gray-400">Cobrada {new Date(invoice.paid_date).toLocaleDateString('es-ES')}</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Partidas</p>
              {editing && (
                <Button size="sm" variant="secondary" onClick={addItem}>
                  <Plus className="w-3.5 h-3.5" />Añadir
                </Button>
              )}
            </div>
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              {editing ? (
                <>
                  <div className="grid grid-cols-[1.5rem_1fr_5rem_4rem_5rem_1.5rem] gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                    <span /><span>Descripción</span><span>Cant.</span><span>Ud.</span><span>P. unit.</span><span />
                  </div>
                  {items.map((item, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={() => setDragIndex(i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDragEnd={() => setDragIndex(null)}
                      className="grid grid-cols-[1.5rem_1fr_5rem_4rem_5rem_1.5rem] gap-2 px-3 py-2 border-b last:border-b-0 border-gray-100 dark:border-gray-700 items-start"
                    >
                      <GripVertical className="w-4 h-4 text-gray-300 mt-2 cursor-grab" />
                      <div className="space-y-1">
                        <input type="text" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} placeholder="Descripción..." className="w-full px-2 py-1.5 rounded-md border text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-700" />
                        <input type="text" value={item.sub_description} onChange={(e) => updateItem(i, 'sub_description', e.target.value)} placeholder="Nota..." className="w-full px-2 py-1.5 rounded-md border text-xs bg-white dark:bg-gray-700 text-gray-500 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-700" />
                      </div>
                      <input type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} placeholder="0" className="px-2 py-1.5 rounded-md border text-sm text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-700 mt-0.5" />
                      <input type="text" value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)} placeholder="ud" className="px-2 py-1.5 rounded-md border text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-700 mt-0.5" />
                      <input type="number" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)} placeholder="0.00" step={0.01} className="px-2 py-1.5 rounded-md border text-sm text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-700 mt-0.5" />
                      <button type="button" onClick={() => removeItem(i)} className="mt-2 p-0.5 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300">Descripción</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 w-20">Cant.</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 w-24">P. unit.</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {(displayItems as InvoiceItem[]).map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">
                          <p className="text-gray-900 dark:text-white">{item.description}</p>
                          {item.sub_description && <p className="text-xs text-gray-400 mt-0.5">{item.sub_description}</p>}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">{item.quantity ?? '—'} {item.unit ?? ''}</td>
                        <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">
                          {item.unit_price != null ? item.unit_price.toLocaleString('es-ES', { minimumFractionDigits: 2 }) + ' €' : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">
                          {item.quantity != null && item.unit_price != null
                            ? (item.quantity * item.unit_price).toLocaleString('es-ES', { minimumFractionDigits: 2 }) + ' €'
                            : '—'}
                        </td>
                      </tr>
                    ))}
                    {displayItems.length === 0 && (
                      <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400 text-sm">Sin partidas</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <div className="flex justify-between px-4 py-2 text-sm">
                  <span className="text-gray-500">Base imponible</span>
                  <span className="font-medium text-gray-900 dark:text-white">{subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                </div>
                <div className="flex justify-between px-4 py-2 text-sm">
                  <span className="text-gray-500">IVA ({invoice.iva_pct}%)</span>
                  <span className="font-medium text-gray-900 dark:text-white">{ivaAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                </div>
                <div className="flex justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-sm font-semibold">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-primary-700 dark:text-primary-400 text-base">{total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                </div>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notas</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-2 pt-5 mt-5 border-t border-gray-200 dark:border-gray-700">
        {editing ? (
          <>
            <Button variant="secondary" onClick={cancelEditing} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={onClose}>Cerrar</Button>
              <Button variant="secondary" onClick={startEditing}>Editar partidas</Button>
              {tab === 'data' && (
                <Button variant="secondary" onClick={handleDownloadPdf} disabled={downloading}>
                  <Download className="w-3.5 h-3.5" />
                  {downloading ? 'Generando...' : 'PDF'}
                </Button>
              )}
            </div>
            {invoice.status !== 'paid' && (
              <Button onClick={handleMarkPaid}>
                <CheckCircle className="w-4 h-4" />
                Marcar cobrada
              </Button>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
