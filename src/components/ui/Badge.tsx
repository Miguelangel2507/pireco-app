import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'active'
  | 'converted'
  | 'pending'
  | 'paid'
  | 'overdue'
  | 'work'
  | 'vacation'
  | 'day_off'
  | 'other'

interface BadgeProps {
  variant: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  converted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  work: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  vacation: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  day_off: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

const variantLabels: Record<BadgeVariant, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  active: 'Activo',
  converted: 'Convertido',
  pending: 'Pendiente',
  paid: 'Pagado',
  overdue: 'Vencido',
  work: 'Trabajo',
  vacation: 'Vacaciones',
  day_off: 'Día libre',
  other: 'Otro',
}

export default function Badge({ variant, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {variantLabels[variant]}
    </span>
  )
}
