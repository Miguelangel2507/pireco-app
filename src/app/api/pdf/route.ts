import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const PDF_API = process.env.PDF_API_URL ?? 'http://localhost:8000'

export async function POST(req: NextRequest) {
  const payload = await req.json()

  // Wake up Railway service if sleeping (fire and forget health check first)
  try {
    await fetch(`${PDF_API}/health`, { method: 'GET', signal: AbortSignal.timeout(5000) })
  } catch {
    // ignore, proceed anyway
  }

  let res: Response
  try {
    res = await fetch(`${PDF_API}/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(55000),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'timeout'
    return NextResponse.json({ error: `PDF API no disponible: ${msg}` }, { status: 503 })
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
