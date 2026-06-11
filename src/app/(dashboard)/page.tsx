import { Users, FileText, Receipt, ShoppingCart, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

const metrics = [
  {
    label: 'Clientes totales',
    value: '48',
    change: '+3 este mes',
    trend: 'up',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
  },
  {
    label: 'Presupuestos activos',
    value: '12',
    change: '4 pendientes de respuesta',
    trend: 'neutral',
    icon: FileText,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
  },
  {
    label: 'Facturas pendientes',
    value: '5',
    change: formatCurrency(8450),
    trend: 'down',
    icon: Receipt,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/40',
  },
  {
    label: 'Compras pendientes',
    value: '9',
    change: 'Para 3 obras',
    trend: 'neutral',
    icon: ShoppingCart,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
]

const recentBudgets = [
  { number: 'P-2024-042', client: 'Comunidad Acacias 18', amount: 3200, status: 'sent' },
  { number: 'P-2024-041', client: 'José Martínez García', amount: 850, status: 'accepted' },
  { number: 'P-2024-040', client: 'Fincas Valdemar SL', amount: 12400, status: 'draft' },
  { number: 'P-2024-039', client: 'Ana López Sánchez', amount: 620, status: 'accepted' },
]

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400' },
  accepted: { label: 'Aceptado', color: 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400' },
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel de control</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen de actividad — junio 2026
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground font-medium truncate">{m.label}</p>
                <p className="text-3xl font-bold text-foreground mt-1">{m.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{m.change}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${m.bg} flex items-center justify-center shrink-0`}>
                <m.icon className={`w-5 h-5 ${m.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Budgets */}
        <div className="xl:col-span-2">
          <Card>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">Últimos presupuestos</h2>
              <a
                href="/presupuestos"
                className="text-xs text-navy-800 dark:text-navy-300 hover:underline font-medium"
              >
                Ver todos
              </a>
            </div>
            <div className="divide-y divide-border">
              {recentBudgets.map((b) => (
                <div
                  key={b.number}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-default"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-navy-50 dark:bg-navy-950/40 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-navy-800 dark:text-navy-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{b.number}</p>
                      <p className="text-xs text-muted-foreground truncate">{b.client}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(b.amount)}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig[b.status].color}`}
                    >
                      {statusConfig[b.status].label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold text-foreground mb-4">Estado de facturas</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Cobradas</span>
                </div>
                <span className="text-sm font-semibold text-foreground">23</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Pendientes</span>
                </div>
                <span className="text-sm font-semibold text-foreground">5</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Vencidas</span>
                </div>
                <span className="text-sm font-semibold text-foreground">2</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold text-foreground mb-4">Ingresos este mes</h2>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-foreground">{formatCurrency(14850)}</span>
              <div className="flex items-center gap-1 mb-0.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">+12%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">vs. {formatCurrency(13260)} mes anterior</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
