import { Settings } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export default function AjustesPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ajustes</h1>
        <p className="text-sm text-muted-foreground mt-1">Datos de empresa, numeración y configuración global</p>
      </div>

      <Card>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Settings className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">Ajustes de empresa</p>
            <p className="text-sm text-muted-foreground mt-1">
              Configuración de Pinturas Pireco SL — próximamente
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
