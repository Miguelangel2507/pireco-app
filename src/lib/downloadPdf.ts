import type { CompanySettings, Client } from '@/types/database'

interface DocItem {
  description: string
  sub_description?: string | null
  quantity?: number | null
  unit?: string | null
  unit_price?: number | null
  tag?: string | null
}

interface DocMeta {
  number: string
  status: string
  issue_date?: string | null
  expiry_date?: string | null
  due_date?: string | null
  iva_pct: number
  notes?: string | null
}

interface Treatment {
  name: string
  description?: string | null
}

interface DownloadPdfOptions {
  docType: 'budget' | 'proforma' | 'invoice'
  doc: DocMeta
  client: Client | null
  items: DocItem[]
  treatments?: Treatment[]
  conditions?: string | null
  company: CompanySettings | null
}

export async function downloadPdf(opts: DownloadPdfOptions): Promise<void> {
  const { docType, doc, client, items, treatments = [], conditions, company } = opts

  // Convertir condiciones de texto libre a array de objetos {title, text}
  // El texto viene como "1. Título: descripción\n2. ..."
  const parsedConditions = conditions
    ? conditions.split('\n').filter(Boolean).map((line) => {
        const m = line.match(/^(\d+\.\s*[^:]+):\s*(.+)$/)
        return m ? { title: m[1].trim(), text: m[2].trim() } : { title: '', text: line.trim() }
      }).filter((c) => c.text)
    : undefined

  const payload = {
    doc_type: docType,
    doc,
    client: client
      ? {
          name:         client.name,
          cif:          client.cif,
          address:      client.address,
          city:         client.city,
          postal_code:  client.postal_code,
          province:     null,
        }
      : { name: '—' },
    items: items.map((i) => ({
      description:     i.description,
      sub_description: i.sub_description ?? null,
      quantity:        i.quantity ?? null,
      unit:            i.unit ?? null,
      unit_price:      i.unit_price ?? null,
      tag:             i.tag ?? null,
    })),
    treatments,
    ...(company
      ? {
          company: {
            name:        company.name,
            cif:         company.cif,
            address:     company.address,
            phone:       company.phone,
            email:       company.email,
            iban:        company.iban,
            swift:       company.swift,
          },
        }
      : {}),
    ...(parsedConditions ? { conditions: parsedConditions } : {}),
  }

  const res = await fetch('/api/pdf', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error generando PDF' }))
    throw new Error(err.error ?? 'Error generando PDF')
  }

  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${doc.number}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
