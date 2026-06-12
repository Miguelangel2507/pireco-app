'use client'

import type { CompanySettings, Client } from '@/types/database'

export interface DocItem {
  description: string
  sub_description?: string | null
  quantity?: number | string | null
  unit?: string | null
  unit_price?: number | string | null
}

export interface DocumentPreviewProps {
  docType: 'FACTURA' | 'PROFORMA' | 'PRESUPUESTO'
  docNumber: string
  issueDate?: string | null
  dueDate?: string | null
  client: Client | null
  items: DocItem[]
  ivaPct: number
  notes?: string | null
  conditions?: string | null
  company: CompanySettings | null
}

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES')
}

export default function DocumentPreview({
  docType, docNumber, issueDate, dueDate, client, items, ivaPct, notes, conditions, company,
}: DocumentPreviewProps) {
  const subtotal = items.reduce((s, i) => {
    const q = parseFloat(String(i.quantity ?? 0)) || 0
    const p = parseFloat(String(i.unit_price ?? 0)) || 0
    return s + q * p
  }, 0)
  const ivaAmount = subtotal * (ivaPct / 100)
  const total = subtotal + ivaAmount

  return (
    <div className="bg-white text-gray-900 text-[11px] leading-snug font-sans w-full" style={{ minHeight: '297mm', maxWidth: '210mm', margin: '0 auto', padding: '14mm 14mm 10mm' }}>

      {/* Header: company + title */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-lg font-bold text-gray-900">{company?.name ?? 'Empresa'}</p>
          {company?.cif && <p className="text-gray-500">NIF/CIF: {company.cif}</p>}
          {company?.address && <p className="text-gray-500">{company.address}</p>}
          {company?.phone && <p className="text-gray-500">Tel: {company.phone}</p>}
          {company?.email && <p className="text-gray-500">{company.email}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-black uppercase tracking-wide" style={{ color: '#1E3A8A' }}>{docType}</p>
          <p className="text-base font-mono font-semibold text-gray-700 mt-0.5">{docNumber}</p>
          <div className="mt-2 space-y-0.5">
            <p><span className="text-gray-400">Fecha emisión: </span>{fmtDate(issueDate)}</p>
            {dueDate && <p><span className="text-gray-400">Vencimiento: </span>{fmtDate(dueDate)}</p>}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t-2 mb-6" style={{ borderColor: '#1E3A8A' }} />

      {/* Client block */}
      <div className="mb-8 bg-gray-50 rounded-lg px-5 py-4 inline-block min-w-[220px]">
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Cliente</p>
        <p className="font-bold text-sm text-gray-900">{client?.name ?? '—'}</p>
        {client?.cif && <p className="text-gray-500">NIF/CIF: {client.cif}</p>}
        {client?.address && <p className="text-gray-500">{client.address}</p>}
        {(client?.postal_code || client?.city) && (
          <p className="text-gray-500">{[client.postal_code, client.city].filter(Boolean).join(' ')}</p>
        )}
        {client?.phone && <p className="text-gray-500">Tel: {client.phone}</p>}
        {client?.email && <p className="text-gray-500">{client.email}</p>}
      </div>

      {/* Items table */}
      <table className="w-full mb-6" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#1E3A8A', color: 'white' }}>
            <th className="text-left px-3 py-2 font-semibold rounded-tl">Descripción</th>
            <th className="text-right px-3 py-2 font-semibold w-16">Cant.</th>
            <th className="text-right px-3 py-2 font-semibold w-12">Ud.</th>
            <th className="text-right px-3 py-2 font-semibold w-20">P. unitario</th>
            <th className="text-right px-3 py-2 font-semibold w-20 rounded-tr">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const q = parseFloat(String(item.quantity ?? 0)) || 0
            const p = parseFloat(String(item.unit_price ?? 0)) || 0
            const rowTotal = q * p
            return (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F9FAFB' : 'white', borderBottom: '1px solid #E5E7EB' }}>
                <td className="px-3 py-2">
                  <p>{item.description}</p>
                  {item.sub_description && <p className="text-gray-400 text-[10px] mt-0.5">{item.sub_description}</p>}
                </td>
                <td className="px-3 py-2 text-right text-gray-600">{q || '—'}</td>
                <td className="px-3 py-2 text-right text-gray-600">{item.unit ?? ''}</td>
                <td className="px-3 py-2 text-right text-gray-600">{p ? fmt(p) + ' €' : '—'}</td>
                <td className="px-3 py-2 text-right font-medium">{rowTotal ? fmt(rowTotal) + ' €' : '—'}</td>
              </tr>
            )
          })}
          {items.length === 0 && (
            <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-400">Sin partidas</td></tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-56" style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
          <div className="flex justify-between px-4 py-1.5" style={{ borderBottom: '1px solid #F3F4F6' }}>
            <span className="text-gray-500">Base imponible</span>
            <span className="font-medium">{fmt(subtotal)} €</span>
          </div>
          <div className="flex justify-between px-4 py-1.5" style={{ borderBottom: '1px solid #F3F4F6' }}>
            <span className="text-gray-500">IVA ({ivaPct}%)</span>
            <span className="font-medium">{fmt(ivaAmount)} €</span>
          </div>
          <div className="flex justify-between px-4 py-2.5 font-bold" style={{ backgroundColor: '#1E3A8A', color: 'white', borderRadius: '0 0 8px 8px' }}>
            <span>TOTAL</span>
            <span className="text-base">{fmt(total)} €</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="mb-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Notas</p>
          <p className="text-gray-600 whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      {/* Conditions */}
      {conditions && (
        <div className="mb-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Condiciones</p>
          <p className="text-gray-600 whitespace-pre-wrap">{conditions}</p>
        </div>
      )}

      {/* Payment info */}
      {company?.iban && (
        <div className="mt-auto pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Datos de pago</p>
          <p className="font-mono text-gray-700">{company.iban}</p>
          {company.swift && <p className="text-gray-500">SWIFT: {company.swift}</p>}
        </div>
      )}
    </div>
  )
}
