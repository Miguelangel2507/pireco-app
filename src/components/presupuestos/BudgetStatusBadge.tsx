import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  draft:    { label: 'Borrador',  classes: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  sent:     { label: 'Enviado',   classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  accepted: { label: 'Aceptado',  classes: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  rejected: { label: 'Rechazado', classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

export default function BudgetStatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', cfg.classes)}>
      {cfg.label}
    </span>
  )
}
