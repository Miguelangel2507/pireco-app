import Card from '@/components/ui/Card'

const metrics = [
  { label: 'Total Clientes', value: '0', icon: '👥', color: 'text-blue-600' },
  { label: 'Presupuestos Activos', value: '0', icon: '📄', color: 'text-green-600' },
  { label: 'Facturas Pendientes', value: '0', icon: '🧾', color: 'text-yellow-600' },
  { label: 'Compras Pendientes', value: '0', icon: '🛒', color: 'text-red-600' },
]

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Panel de control
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{metric.icon}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{metric.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
