'use client'

export async function printDocument(elementId: string, docNumber: string) {
  const el = document.getElementById(elementId)
  if (!el) return

  // Replace img src with data URLs so they work in the print window
  const clone = el.cloneNode(true) as HTMLElement
  const imgs = clone.querySelectorAll('img')
  await Promise.all(Array.from(imgs).map(async (img) => {
    try {
      const res = await fetch(img.src)
      const blob = await res.blob()
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
      img.src = dataUrl
    } catch {
      img.style.display = 'none'
    }
  }))

  const win = window.open('', '_blank', 'width=900,height=1200')
  if (!win) return

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${docNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Montserrat', sans-serif; background: white; }
    @page { size: A4; margin: 0; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>${clone.innerHTML}</body>
</html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 1200)
}
