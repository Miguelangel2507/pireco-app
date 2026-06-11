import { Calendar } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export default function CalendarioPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calendario</h1>
        <p className="text-sm text-muted-foreground mt-1">Calendario compartido de obras, vacaciones y días libres</p>
      </div>

      <Card>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Calendar className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">Calendario en construcción</p>
            <p className="text-sm text-muted-foreground mt-1">Vista mensual con barras de eventos multidía — próximamente</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
