'use client'

import type { CompanySettings, Client } from '@/types/database'

export interface DocItem {
  description: string
  sub_description?: string | null
  quantity?: number | string | null
  unit?: string | null
  unit_price?: number | string | null
  tag?: string | null
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

const TAG_LABELS: Record<string, string> = { int: 'Interior', ext: 'Exterior', met: 'Metal', oth: 'Otro' }
const TAG_STYLES: Record<string, { background: string; color: string }> = {
  int: { background: '#D1FAE5', color: '#065F46' },
  ext: { background: '#DBEAFE', color: '#1E40AF' },
  met: { background: '#E5E7EB', color: '#374151' },
  oth: { background: '#F3E8FF', color: '#7E22CE' },
}

const STATUS_CLASS: Record<string, { background: string; color: string }> = {
  draft:    { background: '#FEF3C7', color: '#92400E' },
  sent:     { background: '#DBEAFE', color: '#1E40AF' },
  accepted: { background: '#D1FAE5', color: '#065F46' },
  rejected: { background: '#FEE2E2', color: '#B91C1C' },
  active:   { background: '#E0E7FF', color: '#3730A3' },
  pending:  { background: '#FEF3C7', color: '#92400E' },
  paid:     { background: '#D1FAE5', color: '#065F46' },
  overdue:  { background: '#FEE2E2', color: '#B91C1C' },
}

const DOC_LABEL: Record<string, string> = { FACTURA: 'Factura', PROFORMA: 'Proforma', PRESUPUESTO: 'Presupuesto' }

export default function DocumentPreview({
  docType, docNumber, issueDate, dueDate, client, items, ivaPct, notes, company,
}: DocumentPreviewProps) {
  const subtotal = items.reduce((s, i) => {
    const q = parseFloat(String(i.quantity ?? 0)) || 0
    const p = parseFloat(String(i.unit_price ?? 0)) || 0
    return s + q * p
  }, 0)
  const ivaAmount = subtotal * (ivaPct / 100)
  const total = subtotal + ivaAmount

  const navy = '#1E3A8A'
  const font = "'Montserrat', 'Inter', sans-serif"

  return (
    <div style={{ fontFamily: font, color: '#1C1C1E', background: 'white', width: '100%' }}>

      {/* HEADER */}
      <div style={{ background: navy, padding: '8mm 14mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '18pt', fontWeight: 900, color: 'white', letterSpacing: '-0.5pt' }}>PIRECO</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '8pt', color: '#fff', fontWeight: 700, lineHeight: 1.7 }}>{company?.name ?? 'Pinturas Pireco SL'} · {company?.cif ?? ''}</div>
          <div style={{ fontSize: '8pt', color: '#BFDBFE', lineHeight: 1.7 }}>{company?.address ?? ''}</div>
          <div style={{ fontSize: '8pt', color: '#BFDBFE', lineHeight: 1.7 }}>{[company?.phone, company?.email].filter(Boolean).join(' · ')}</div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ padding: '7mm 14mm 5mm' }}>

        {/* META: cliente + número */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5mm' }}>
          <div style={{ flex: 1, marginRight: '8mm' }}>
            <span style={{ display: 'inline-block', fontSize: '7pt', fontWeight: 700, letterSpacing: '1.5pt', color: navy, background: '#EEF2FF', padding: '1.5pt 7pt', borderRadius: '4pt', marginBottom: '2mm' }}>CLIENTE</span>
            <div style={{ fontSize: '11pt', fontWeight: 700, marginBottom: '1.5mm' }}>{client?.name ?? '—'}</div>
            <div style={{ fontSize: '8.5pt', color: '#6B7280', lineHeight: 1.55 }}>
              {client?.cif && <div>{client.cif}</div>}
              {client?.address && <div>{client.address}</div>}
              {(client?.postal_code || client?.city) && <div>{[client.postal_code, client.city].filter(Boolean).join(' ')}</div>}
              {client?.phone && <div>{client.phone}</div>}
              {client?.email && <div>{client.email}</div>}
            </div>
          </div>
          <div style={{ width: '62mm', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '2mm' }}>
              <span style={{ fontSize: '7pt', fontWeight: 700, letterSpacing: '1.5pt', color: navy, textTransform: 'uppercase' }}>{DOC_LABEL[docType]}</span>
              <span style={{ fontSize: '12pt', fontWeight: 700, color: navy, letterSpacing: '-0.3pt' }}>{docNumber}</span>
            </div>
            <div style={{ borderBottom: '0.4pt solid #E5E7EB', padding: '1.6mm 0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '7pt', fontWeight: 600, letterSpacing: '1pt', color: '#9CA3AF', textTransform: 'uppercase' }}>Fecha emisión</span>
              <span style={{ fontSize: '8.5pt', fontWeight: 700 }}>{fmtDate(issueDate)}</span>
            </div>
            {dueDate && (
              <div style={{ borderBottom: '0.4pt solid #E5E7EB', padding: '1.6mm 0', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '7pt', fontWeight: 600, letterSpacing: '1pt', color: '#9CA3AF', textTransform: 'uppercase' }}>Vencimiento</span>
                <span style={{ fontSize: '8.5pt', fontWeight: 700 }}>{fmtDate(dueDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* DIVIDER */}
        <div style={{ height: '0.4pt', background: '#E5E7EB', marginBottom: '4mm' }} />

        {/* TABLA HEADER */}
        <div style={{ display: 'flex', background: navy, borderRadius: '5pt', padding: '2.4mm 4mm', marginBottom: '1.5mm' }}>
          <span style={{ flex: 1, fontSize: '7pt', fontWeight: 700, letterSpacing: '1pt', color: '#fff', textTransform: 'uppercase' }}>Concepto</span>
          <span style={{ width: '26mm', textAlign: 'right', fontSize: '7pt', fontWeight: 700, letterSpacing: '1pt', color: '#fff', textTransform: 'uppercase' }}>Cant.</span>
          <span style={{ width: '30mm', textAlign: 'right', fontSize: '7pt', fontWeight: 700, letterSpacing: '1pt', color: '#fff', textTransform: 'uppercase' }}>Precio/Uni.</span>
          <span style={{ width: '30mm', textAlign: 'right', fontSize: '7pt', fontWeight: 700, letterSpacing: '1pt', color: '#fff', textTransform: 'uppercase' }}>Total</span>
        </div>

        {/* ITEMS */}
        {items.map((item, i) => {
          const q = parseFloat(String(item.quantity ?? 0)) || 0
          const p = parseFloat(String(item.unit_price ?? 0)) || 0
          const rowTotal = q * p
          const tag = item.tag
          const tagStyle = tag ? TAG_STYLES[tag] : null
          return (
            <div key={i} style={{ marginBottom: '1.5mm' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#F9FAFB', borderRadius: '4pt', padding: '2.2mm 4mm' }}>
                <div style={{ flex: 1, fontSize: '9pt', fontWeight: 700 }}>{item.description}</div>
                <div style={{ width: '26mm', textAlign: 'right', fontSize: '8.5pt', color: '#374151' }}>{q ? `${q} ${item.unit ?? ''}` : '—'}</div>
                <div style={{ width: '30mm', textAlign: 'right', fontSize: '8.5pt', color: '#374151' }}>{p ? `${fmt(p)} €` : '—'}</div>
                <div style={{ width: '30mm', textAlign: 'right', fontSize: '8.5pt', fontWeight: 700 }}>{rowTotal ? `${fmt(rowTotal)} €` : '—'}</div>
              </div>
              {(item.sub_description || tag) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', padding: '1.2mm 4mm 0.5mm' }}>
                  {tagStyle && tag && (
                    <span style={{ display: 'inline-block', fontSize: '6.5pt', fontWeight: 700, padding: '1pt 6pt', borderRadius: '7pt', flexShrink: 0, ...tagStyle }}>
                      {TAG_LABELS[tag]}
                    </span>
                  )}
                  {item.sub_description && <span style={{ fontSize: '7.5pt', color: '#9CA3AF', lineHeight: 1.45 }}>{item.sub_description}</span>}
                </div>
              )}
            </div>
          )
        })}

        {items.length === 0 && (
          <div style={{ padding: '4mm', textAlign: 'center', color: '#9CA3AF', fontSize: '8.5pt' }}>Sin partidas</div>
        )}

        {/* NOTAS */}
        {notes && (
          <div style={{ background: '#FFFBEB', borderLeft: '2mm solid #F59E0B', borderRadius: '0 5pt 5pt 0', padding: '2.5mm 4mm', margin: '3mm 0' }}>
            <div style={{ fontSize: '7.5pt', fontWeight: 700, letterSpacing: '1.5pt', color: '#92400E', textTransform: 'uppercase', marginBottom: '2mm' }}>Notas</div>
            <div style={{ fontSize: '8.5pt', color: '#78350F', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{notes}</div>
          </div>
        )}

        {/* TOTALES */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4mm', marginBottom: '2mm' }}>
          <div style={{ width: '80mm' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.8mm 4mm', borderBottom: '0.4pt solid #F3F4F6' }}>
              <span style={{ fontSize: '8.5pt', color: '#6B7280' }}>Base imponible</span>
              <span style={{ fontSize: '8.5pt', fontWeight: 700 }}>{fmt(subtotal)} €</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.8mm 4mm', borderBottom: '0.4pt solid #F3F4F6' }}>
              <span style={{ fontSize: '8.5pt', color: '#6B7280' }}>IVA {ivaPct}%</span>
              <span style={{ fontSize: '8.5pt', fontWeight: 700 }}>{fmt(ivaAmount)} €</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2.5mm 4mm', borderTop: `1pt solid ${navy}`, marginTop: '1mm' }}>
              <span style={{ fontSize: '10.5pt', fontWeight: 700, color: navy }}>Total</span>
              <span style={{ fontSize: '14pt', fontWeight: 700, color: '#1C1C1E', letterSpacing: '-0.3pt', whiteSpace: 'nowrap' }}>{fmt(total)} €</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: '#F9FAFB', borderTop: '0.4pt solid #F3F4F6', padding: '3.5mm 14mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '8pt', color: '#374151' }}>
          <span style={{ fontWeight: 700, letterSpacing: '1pt', color: '#9CA3AF', textTransform: 'uppercase', fontSize: '6.5pt', marginRight: '2mm' }}>Método de pago</span>
          Transferencia bancaria
          {company?.iban && <span> — <span style={{ fontWeight: 700, color: navy }}>{company.iban}</span></span>}
          {company?.swift && <span> · SWIFT: {company.swift}</span>}
        </div>
      </div>

    </div>
  )
}
