import { ShoppingCart, Plus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function ComprasPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lista de compras</h1>
          <p className="text-sm text-muted-foreground mt-1">Sincronización en tiempo real entre Miguel Ángel y Carlos</p>
        </div>
        <Button variant="primary" size="md">
          <Plus className="w-4 h-4" />
          Añadir artículo
        </Button>
      </div>

      <Card>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">Lista vacía</p>
            <p className="text-sm text-muted-foreground mt-1">Añade materiales o artículos vinculados a una obra</p>
          </div>
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4" />
            Añadir artículo
          </Button>
        </div>
      </Card>
    </div>
  )
}
