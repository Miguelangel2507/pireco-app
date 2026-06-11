import { cn } from '@/lib/utils'

type Variant =
  | 'draft' | 'sent' | 'accepted' | 'rejected'
  | 'active' | 'converted'
  | 'pending' | 'paid' | 'overdue'
  | 'work' | 'vacation' | 'day_off' | 'other'
  | 'default'

const variantClasses: Record<Variant, string> = {
  draft:     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  sent:      'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
  accepted:  'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400',
  rejected:  'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400',
  active:    'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
  converted: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400',
  pending:   'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
  paid:      'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400',
  overdue:   'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400',
  work:      'bg-navy-100 text-navy-800 dark:bg-navy-950/60 dark:text-navy-300',
  vacation:  'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400',
  day_off:   'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400',
  other:     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  default:   'bg-muted text-muted-foreground',
}

const variantLabels: Partial<Record<Variant, string>> = {
  draft:     'Borrador',
  sent:      'Enviado',
  accepted:  'Aceptado',
  rejected:  'Rechazado',
  active:    'Activa',
  converted: 'Convertida',
  pending:   'Pendiente',
  paid:      'Cobrada',
  overdue:   'Vencida',
  work:      'Trabajo',
  vacation:  'Vacaciones',
  day_off:   'Día libre',
  other:     'Otro',
}

interface BadgeProps {
  variant?: Variant
  label?: string
  className?: string
}

export function Badge({ variant = 'default', label, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {label ?? variantLabels[variant] ?? variant}
    </span>
  )
}
