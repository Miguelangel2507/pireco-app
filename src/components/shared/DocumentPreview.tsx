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
  expiryDate?: string | null
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
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-ES')
}

const TAG_LABEL: Record<string, string> = { int: 'Interior', ext: 'Exterior', met: 'Metal', oth: 'Otro' }
const TAG_STYLE: Record<string, React.CSSProperties> = {
  int: { background: '#D1FAE5', color: '#065F46' },
  ext: { background: '#DBEAFE', color: '#1E40AF' },
  met: { background: '#E5E7EB', color: '#374151' },
  oth: { background: '#F3E8FF', color: '#7E22CE' },
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', sent: 'Enviado', accepted: 'Aceptado', rejected: 'Rechazado',
  active: 'Activa', converted: 'Convertida', pending: 'Pendiente', paid: 'Pagada', overdue: 'Vencida',
}
const STATUS_STYLE: Record<string, React.CSSProperties> = {
  draft:    { background: '#FEF3C7', color: '#92400E' },
  sent:     { background: '#DBEAFE', color: '#1E40AF' },
  accepted: { background: '#D1FAE5', color: '#065F46' },
  rejected: { background: '#FEE2E2', color: '#B91C1C' },
  active:   { background: '#E0E7FF', color: '#3730A3' },
  pending:  { background: '#FEF3C7', color: '#92400E' },
  paid:     { background: '#D1FAE5', color: '#065F46' },
  overdue:  { background: '#FEE2E2', color: '#B91C1C' },
}
const DOC_LABEL: Record<string, string> = {
  FACTURA: 'Factura', PROFORMA: 'Proforma', PRESUPUESTO: 'Presupuesto',
}

const navy = '#1E3A8A'
const font = "'Montserrat', 'Inter', ui-sans-serif, sans-serif"

// Default conditions matching pdf_generator.py
const DEFAULT_CONDITIONS = [
  { title: '1. Materiales', text: 'El precio cotizado incluye el coste de todos los materiales necesarios para la correcta ejecución del trabajo, según lo especificado en la descripción del proyecto.' },
  { title: '2. Retoques y repasos', text: 'Una vez finalizado el trabajo y realizada la inspección final, se contemplará un plazo de 3 días para notificar cualquier defecto o imperfección. Los trabajos de repaso estarán cubiertos dentro del presupuesto original, siempre y cuando no sean consecuencia de un mal uso o causas ajenas a la ejecución.' },
  { title: '3. Desplazamientos y jornada reservada', text: 'En caso de que los trabajos no puedan ejecutarse en la fecha prevista por causas ajenas a Pinturas Pireco S.L., se facturará el desplazamiento y la jornada reservada: 25 €/desplazamiento + 240 €/jornada bloqueada de 2 personas.' },
  { title: '4. Pladur', text: 'No se incluyen reparaciones ni correcciones de desperfectos del pladur. Es responsabilidad de los pladuristas entregar paredes y techos lisos y listos para pintar.' },
  { title: '5. Alcance del trabajo', text: 'No se realizarán trabajos fuera de este presupuesto.' },
  { title: '6. Protección del área circundante', text: 'Cubrimos ventanas, puertas, muebles, suelos, jardines y elementos decorativos para evitar daños. Los residuos se gestionarán de forma responsable según normativa vigente.' },
]
const DEFAULT_ACCEPTANCE = [
  'El presente presupuesto deberá ser aceptado mediante firma manuscrita, firma digital o sello de la empresa, indicando conformidad con los precios, condiciones y formas de pago.',
  'La aceptación implica la conformidad íntegra con todas las condiciones generales y particulares descritas en este documento.',
  'La firma digital tendrá plena validez legal y será vinculante en los mismos términos que la manuscrita.',
  'El presupuesto tendrá una validez de 30 días naturales a partir de la fecha de emisión.',
  'Con la firma, el cliente autoriza a Pinturas Pireco S.L. a iniciar la planificación y ejecución de los trabajos en los términos acordados.',
]

function PageHeader({ company }: { company: CompanySettings | null }) {
  return (
    <div style={{ background: navy, padding: '8mm 14mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
      {/* Logo — shows image if available, fallback text */}
      <img
        src="/logo_blanco.png"
        alt="Pireco"
        style={{ height: '19mm', maxHeight: 72 }}
        onError={(e) => {
          const t = e.currentTarget
          t.style.display = 'none'
          const fb = t.nextElementSibling as HTMLElement
          if (fb) fb.style.display = 'block'
        }}
      />
      <div style={{ display: 'none', color: 'white', fontWeight: 900, fontSize: '18pt', fontFamily: font }}>PIRECO</div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '8pt', color: '#fff', fontWeight: 700, lineHeight: 1.7, fontFamily: font }}>{company?.name ?? 'Pinturas Pireco SL'} · {company?.cif ?? 'B75852400'}</div>
        <div style={{ fontSize: '8pt', color: '#BFDBFE', lineHeight: 1.7, fontFamily: font }}>{company?.address ?? 'Calle La Pitera 22B'}</div>
        <div style={{ fontSize: '8pt', color: '#BFDBFE', lineHeight: 1.7, fontFamily: font }}>12600 Vall de Uxó, Castellón, España</div>
        <div style={{ fontSize: '8pt', color: '#BFDBFE', lineHeight: 1.7, fontFamily: font }}>{[company?.phone, company?.email].filter(Boolean).join(' · ')}</div>
      </div>
    </div>
  )
}

function PageFooter({ company, page, total }: { company: CompanySettings | null; page: number; total: number }) {
  return (
    <div style={{ background: '#F9FAFB', borderTop: '0.4pt solid #F3F4F6', padding: '3.5mm 14mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
      <div style={{ fontSize: '8pt', color: '#374151', fontFamily: font }}>
        <span style={{ fontWeight: 700, letterSpacing: '1pt', color: '#9CA3AF', textTransform: 'uppercase', fontSize: '6.5pt', marginRight: '2mm' }}>Método de pago</span>
        Transferencia bancaria
        {company?.iban && <span> — <span style={{ fontWeight: 700, color: navy }}>{company.iban}</span></span>}
        {company?.swift && <span> · SWIFT: {company.swift}</span>}
      </div>
      <div style={{ fontSize: '8pt', color: '#9CA3AF', flexShrink: 0, marginLeft: '6mm', fontFamily: font }}>{page} / {total}</div>
    </div>
  )
}

export default function DocumentPreview({
  docType, docNumber, issueDate, dueDate, expiryDate, client, items, ivaPct, notes, conditions, company,
}: DocumentPreviewProps) {
  const subtotal = items.reduce((s, i) => {
    const q = parseFloat(String(i.quantity ?? 0)) || 0
    const p = parseFloat(String(i.unit_price ?? 0)) || 0
    return s + q * p
  }, 0)
  const ivaAmount = subtotal * (ivaPct / 100)
  const total = subtotal + ivaAmount

  // Parse conditions from text if provided
  const condList = DEFAULT_CONDITIONS
  const totalPages = 2

  return (
    <div style={{ fontFamily: font, color: '#1C1C1E', background: 'white', width: '100%' }}>

      {/* ══════ PÁGINA 1 — PRECIOS ══════ */}
      <div style={{ pageBreakAfter: 'always' }}>
        <PageHeader company={company} />

        <div style={{ padding: '7mm 14mm 5mm' }}>
          {/* META: cliente izquierda + doc derecha */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5mm' }}>
            {/* Cliente */}
            <div style={{ width: '95mm' }}>
              <span style={{ display: 'inline-block', fontSize: '7pt', fontWeight: 700, letterSpacing: '1.5pt', color: navy, background: '#EEF2FF', padding: '1.5pt 7pt', borderRadius: '4pt', marginBottom: '2mm', fontFamily: font }}>CLIENTE</span>
              <div style={{ fontSize: '11pt', fontWeight: 700, marginBottom: '1.5mm', fontFamily: font }}>{client?.name ?? '—'}</div>
              <div style={{ fontSize: '8.5pt', color: '#6B7280', lineHeight: 1.55, fontFamily: font }}>
                {client?.cif && <div>{client.cif}</div>}
                {client?.address && <div>{client.address}</div>}
                {(client?.postal_code || client?.city) && <div>{[client.postal_code, client.city].filter(Boolean).join(' ')}{client?.city ? ', Castellón' : ''}</div>}
                <div>España</div>
              </div>
            </div>

            {/* Documento */}
            <div style={{ width: '62mm', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2mm 0 2mm' }}>
                <span style={{ fontSize: '7pt', fontWeight: 700, letterSpacing: '1.5pt', color: navy, textTransform: 'uppercase', fontFamily: font }}>{DOC_LABEL[docType]}</span>
                <span style={{ fontSize: '12pt', fontWeight: 700, color: navy, letterSpacing: '-0.3pt', fontFamily: font }}>{docNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.6mm 0', borderBottom: '0.4pt solid #E5E7EB' }}>
                <span style={{ fontSize: '7pt', fontWeight: 600, letterSpacing: '1pt', color: '#9CA3AF', textTransform: 'uppercase', fontFamily: font }}>Fecha emisión</span>
                <span style={{ fontSize: '8.5pt', fontWeight: 700, fontFamily: font }}>{fmtDate(issueDate)}</span>
              </div>
              {(dueDate || expiryDate) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.6mm 0', borderBottom: '0.4pt solid #E5E7EB' }}>
                  <span style={{ fontSize: '7pt', fontWeight: 600, letterSpacing: '1pt', color: '#9CA3AF', textTransform: 'uppercase', fontFamily: font }}>Vencimiento</span>
                  <span style={{ fontSize: '8.5pt', fontWeight: 700, fontFamily: font }}>{fmtDate(dueDate ?? expiryDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '0.4pt', background: '#E5E7EB', marginBottom: '4mm' }} />

          {/* Tabla header */}
          <div style={{ display: 'flex', background: navy, borderRadius: '5pt', padding: '2.4mm 4mm', marginBottom: '1.5mm' }}>
            <span style={{ flex: 1, fontSize: '7pt', fontWeight: 700, letterSpacing: '1pt', color: '#fff', textTransform: 'uppercase', fontFamily: font }}>Concepto</span>
            <span style={{ width: '26mm', textAlign: 'right', fontSize: '7pt', fontWeight: 700, letterSpacing: '1pt', color: '#fff', textTransform: 'uppercase', fontFamily: font }}>Cant.</span>
            <span style={{ width: '30mm', textAlign: 'right', fontSize: '7pt', fontWeight: 700, letterSpacing: '1pt', color: '#fff', textTransform: 'uppercase', fontFamily: font }}>Precio/Uni.</span>
            <span style={{ width: '30mm', textAlign: 'right', fontSize: '7pt', fontWeight: 700, letterSpacing: '1pt', color: '#fff', textTransform: 'uppercase', fontFamily: font }}>Total</span>
          </div>

          {/* Items */}
          {items.map((item, i) => {
            const q = parseFloat(String(item.quantity ?? 0)) || 0
            const p = parseFloat(String(item.unit_price ?? 0)) || 0
            const rowTotal = q * p
            const tag = item.tag
            return (
              <div key={i} style={{ marginBottom: '1.5mm' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#F9FAFB', borderRadius: '4pt', padding: '2.2mm 4mm' }}>
                  <div style={{ flex: 1, fontSize: '9pt', fontWeight: 700, fontFamily: font }}>{item.description}</div>
                  <div style={{ width: '26mm', textAlign: 'right', fontSize: '8.5pt', color: '#374151', fontFamily: font }}>{q ? `${String(q).replace('.', ',')} ${item.unit ?? ''}` : '—'}</div>
                  <div style={{ width: '30mm', textAlign: 'right', fontSize: '8.5pt', color: '#374151', fontFamily: font }}>{p ? `${fmt(p)} €` : '—'}</div>
                  <div style={{ width: '30mm', textAlign: 'right', fontSize: '8.5pt', fontWeight: 700, fontFamily: font }}>{rowTotal ? `${fmt(rowTotal)} €` : '—'}</div>
                </div>
                {(item.sub_description || tag) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', padding: '1.2mm 4mm 0.5mm' }}>
                    {tag && TAG_STYLE[tag] && (
                      <span style={{ display: 'inline-block', fontSize: '6.5pt', fontWeight: 700, padding: '1pt 6pt', borderRadius: '7pt', flexShrink: 0, fontFamily: font, ...TAG_STYLE[tag] }}>
                        {TAG_LABEL[tag]}
                      </span>
                    )}
                    {item.sub_description && (
                      <span style={{ fontSize: '7.5pt', color: '#9CA3AF', lineHeight: 1.45, fontFamily: font }}>{item.sub_description}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {items.length === 0 && (
            <div style={{ padding: '4mm', textAlign: 'center', color: '#9CA3AF', fontSize: '8.5pt', fontFamily: font }}>Sin partidas</div>
          )}

          {/* Notas */}
          {notes && (
            <div style={{ background: '#FFFBEB', borderLeft: '2mm solid #F59E0B', borderRadius: '0 5pt 5pt 0', padding: '2.5mm 4mm', margin: '3mm 0' }}>
              <div style={{ fontSize: '7.5pt', fontWeight: 700, letterSpacing: '1.5pt', color: '#92400E', textTransform: 'uppercase', marginBottom: '2mm', fontFamily: font }}>Notas</div>
              <div style={{ fontSize: '8.5pt', color: '#78350F', lineHeight: 1.5, whiteSpace: 'pre-wrap', fontFamily: font }}>{notes}</div>
            </div>
          )}

          {/* Totales */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4mm', marginBottom: '2mm' }}>
            <div style={{ width: '80mm' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.8mm 4mm', borderBottom: '0.4pt solid #F3F4F6' }}>
                <span style={{ fontSize: '8.5pt', color: '#6B7280', fontFamily: font }}>Base imponible</span>
                <span style={{ fontSize: '8.5pt', fontWeight: 700, fontFamily: font }}>{fmt(subtotal)} €</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.8mm 4mm', borderBottom: '0.4pt solid #F3F4F6' }}>
                <span style={{ fontSize: '8.5pt', color: '#6B7280', fontFamily: font }}>IVA {ivaPct}%</span>
                <span style={{ fontSize: '8.5pt', fontWeight: 700, fontFamily: font }}>{fmt(ivaAmount)} €</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2.5mm 4mm', borderTop: `1pt solid ${navy}`, marginTop: '1mm' }}>
                <span style={{ fontSize: '10.5pt', fontWeight: 700, color: navy, fontFamily: font }}>Total</span>
                <span style={{ fontSize: '14pt', fontWeight: 700, color: '#1C1C1E', letterSpacing: '-0.3pt', whiteSpace: 'nowrap', fontFamily: font }}>{fmt(total)} €</span>
              </div>
            </div>
          </div>
        </div>

        <PageFooter company={company} page={1} total={totalPages} />
      </div>

      {/* ══════ PÁGINA 2 — CONDICIONES ══════ */}
      <div>
        <PageHeader company={company} />
        <div style={{ padding: '7mm 14mm 5mm' }}>
          <div style={{ fontSize: '14pt', fontWeight: 700, color: navy, marginBottom: '3mm', fontFamily: font }}>Condiciones</div>
          <div style={{ height: '1pt', background: navy, marginBottom: '5mm' }} />
          {condList.map((c, i) => (
            <div key={i} style={{ marginBottom: '2.8mm' }}>
              <div style={{ fontSize: '7.5pt', lineHeight: 1.5, color: '#374151', fontFamily: font }}>
                <span style={{ fontWeight: 700, color: '#1C1C1E' }}>{c.title}:</span> {c.text}
              </div>
            </div>
          ))}
          <div style={{ fontSize: '14pt', fontWeight: 700, color: navy, marginTop: '5mm', marginBottom: '3mm', fontFamily: font }}>Condiciones de aceptación</div>
          <div style={{ height: '1pt', background: navy, marginBottom: '5mm' }} />
          {DEFAULT_ACCEPTANCE.map((item, i) => (
            <div key={i} style={{ fontSize: '7.5pt', lineHeight: 1.5, color: '#374151', marginBottom: '1.5mm', paddingLeft: '4mm', position: 'relative', fontFamily: font }}>
              <span style={{ position: 'absolute', left: '1mm', color: navy, fontWeight: 700 }}>•</span>
              {item}
            </div>
          ))}
        </div>
        <PageFooter company={company} page={2} total={totalPages} />
      </div>

    </div>
  )
}
