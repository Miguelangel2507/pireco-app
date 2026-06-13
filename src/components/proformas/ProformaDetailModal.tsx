'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { FilePlus, FileText, LayoutList, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import DocumentPreview from '@/components/shared/DocumentPreview'
import { downloadPdf } from '@/lib/downloadPdf'
import type { Proforma, Client, Budget, BudgetItem, CompanySettings } from '@/types/database'

type ProformaFull = Proforma & {
  client: Client | null
  budget: (Budget & { budget_items: BudgetItem[] }) | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  proforma: ProformaFull | null
  onConvert: () => void
  converting: boolean
}

export default function ProformaDetailModal({ isOpen, onClose, proforma, onConvert, converting }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<'data' | 'preview'>('data')
  const [company, setCompany] = useState<CompanySettings | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      supabase.from('company_settings').select('*').single().then(({ data }) => {
        setCompany(data as CompanySettings)
      })
      setTab('data')
    }
  }, [isOpen])

  const budget = proforma?.budget ?? null
  const items = budget?.budget_items?.sort((a, b) => a.sort_order - b.sort_order) ?? []

  async function handleDownloadPdf() {
    if (!proforma) return
    setDownloading(true)
    try {
      await downloadPdf({
        docType: 'proforma',
        doc: {
          number:     proforma.number,
          status:     proforma.status,
          issue_date: proforma.issue_date,
          iva_pct:    budget?.iva_pct ?? 21,
          notes:      proforma.notes,
        },
        client:     proforma.client,
        items,
        conditions: budget?.conditions_text,
        company,
      })
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setDownloading(false)
    }
  }

  if (!proforma) return null
  const ivaPct = budget?.iva_pct ?? 21
  const subtotal = items.reduce((s, i) => s + (i.quantity ?? 0) * (i.unit_price ?? 0), 0)
  const ivaAmount = subtotal * (ivaPct / 100)
  const total = subtotal + ivaAmount

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={proforma.number} className="max-w-4xl">
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
        <div className="max-h-[72vh] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 p-4">
          <div className="shadow-lg rounded">
            <DocumentPreview
              docType="PROFORMA"
              docNumber={proforma.number}
              issueDate={proforma.issue_date}
              client={proforma.client}
              items={items}
              ivaPct={ivaPct}
              notes={proforma.notes}
              conditions={budget?.conditions_text}
              company={company}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6 max-h-[72vh] overflow-y-auto px-1">
          {/* Header info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cliente</p>
              <p className="font-semibold text-gray-900 dark:text-white">{proforma.client?.name ?? '—'}</p>
              {proforma.client?.cif && <p className="text-gray-500 dark:text-gray-400">{proforma.client.cif}</p>}
              {proforma.client?.address && <p className="text-gray-500 dark:text-gray-400">{proforma.client.address}</p>}
              {proforma.client?.city && <p className="text-gray-500 dark:text-gray-400">{proforma.client.city}</p>}
              {proforma.client?.phone && <p className="text-gray-500 dark:text-gray-400">{proforma.client.phone}</p>}
            </div>
            <div className="space-y-2 text-right">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Fecha emisión</p>
                <p className="text-gray-900 dark:text-white">
                  {proforma.issue_date ? new Date(proforma.issue_date).toLocaleDateString('es-ES') : '—'}
                </p>
              </div>
              {budget && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Presupuesto origen</p>
                  <p className="font-mono text-gray-900 dark:text-white">{budget.number}</p>
                </div>
              )}
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  proforma.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {proforma.status === 'active' ? 'Activa' : 'Convertida a factura'}
                </span>
              </div>
            </div>
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Partidas</p>
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
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
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">
                          <p className="text-gray-900 dark:text-white">{item.description}</p>
                          {item.sub_description && <p className="text-xs text-gray-400 mt-0.5">{item.sub_description}</p>}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                          {item.quantity ?? '—'} {item.unit ?? ''}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                          {item.unit_price != null
                            ? item.unit_price.toLocaleString('es-ES', { minimumFractionDigits: 2 }) + ' €'
                            : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">
                          {item.quantity != null && item.unit_price != null
                            ? (item.quantity * item.unit_price).toLocaleString('es-ES', { minimumFractionDigits: 2 }) + ' €'
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <div className="flex justify-between px-4 py-2 text-sm">
                  <span className="text-gray-500">Base imponible</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2 text-sm">
                  <span className="text-gray-500">IVA ({ivaPct}%)</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {ivaAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </span>
                </div>
                <div className="flex justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-sm font-semibold">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-primary-700 dark:text-primary-400 text-base">
                    {total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </span>
                </div>
              </div>
            </div>
          </div>

          {proforma.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notas</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{proforma.notes}</p>
            </div>
          )}
          {budget?.conditions_text && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Condiciones</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{budget.conditions_text}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center pt-5 mt-5 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          <Button variant="secondary" onClick={handleDownloadPdf} disabled={downloading}>
            <Download className="w-3.5 h-3.5" />
            {downloading ? 'Generando...' : 'PDF'}
          </Button>
        </div>
        {proforma.status === 'active' && (
          <Button onClick={onConvert} disabled={converting}>
            <FilePlus className="w-4 h-4" />
            {converting ? 'Convirtiendo...' : 'Convertir a factura'}
          </Button>
        )}
      </div>
    </Modal>
  )
}
