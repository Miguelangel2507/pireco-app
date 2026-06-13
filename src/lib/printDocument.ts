'use client'

export function printDocument(elementId: string, docNumber: string) {
  const el = document.getElementById(elementId)
  if (!el) return

  const win = window.open('', '_blank', 'width=900,height=1200')
  if (!win) return

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${docNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: sans-serif; background: white; }
    @page { size: A4; margin: 0; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>${el.innerHTML}</body>
</html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 500)
}
