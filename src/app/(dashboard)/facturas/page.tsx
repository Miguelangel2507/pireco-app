import { FileCheck, Plus, Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function FacturasPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Facturas</h1>
          <p className="text-sm text-muted-foreground mt-1">Serie FAC · derivadas de proformas o presupuestos</p>
        </div>
        <Button variant="primary" size="md">
          <Plus className="w-4 h-4" />
          Nueva factura
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Buscar facturas…"
          className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-default"
        />
      </div>

      <Card>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <FileCheck className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">No hay facturas aún</p>
            <p className="text-sm text-muted-foreground mt-1">Las facturas se generan desde una proforma o presupuesto</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
