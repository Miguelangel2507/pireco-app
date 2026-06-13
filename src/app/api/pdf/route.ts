import { NextRequest, NextResponse } from 'next/server'

const PDF_API = process.env.PDF_API_URL ?? 'http://localhost:8000'

export async function POST(req: NextRequest) {
  const payload = await req.json()

  let res: Response
  try {
    res = await fetch(`${PDF_API}/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
  } catch {
    return NextResponse.json({ error: 'PDF API no disponible' }, { status: 503 })
  }

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: text }, { status: res.status })
  }

  const pdf = await res.arrayBuffer()
  const docNumber = payload?.doc?.number ?? 'documento'

  return new NextResponse(pdf, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="${docNumber}.pdf"`,
    },
  })
}
