// Badge styles per spec pireco_design_specs.md

export const budgetStatusBadge: Record<string, { bg: string; color: string; label: string }> = {
  draft:    { bg: 'rgba(255,159,10,0.15)',  color: '#C07000', label: 'Borrador'  },
  sent:     { bg: 'rgba(59,111,212,0.18)',  color: '#2B5AB8', label: 'Enviado'   },
  accepted: { bg: 'rgba(48,209,88,0.15)',   color: '#1A8A38', label: 'Aceptado'  },
  rejected: { bg: 'rgba(255,69,58,0.12)',   color: '#C0392B', label: 'Rechazado' },
}

export const budgetStatusBadgeDark: Record<string, { bg: string; color: string; label: string }> = {
  draft:    { bg: 'rgba(255,159,10,0.15)',  color: '#FF9F0A', label: 'Borrador'  },
  sent:     { bg: 'rgba(59,111,212,0.18)',  color: '#7AABFF', label: 'Enviado'   },
  accepted: { bg: 'rgba(48,209,88,0.15)',   color: '#30D158', label: 'Aceptado'  },
  rejected: { bg: 'rgba(255,69,58,0.12)',   color: '#FF453A', label: 'Rechazado' },
}

export const invoiceStatusBadge = {
  pending: { bg: '#FEF3C7', color: '#92400E', label: 'Pendiente' },
  paid:    { bg: '#D1FAE5', color: '#065F46', label: 'Pagada'    },
  overdue: { bg: '#FEE2E2', color: '#B91C1C', label: 'Vencida'   },
} as const

export const proformaStatusBadge = {
  active:    { bg: '#E0E7FF', color: '#3730A3', label: 'Activa'     },
  converted: { bg: 'rgba(0,0,0,0.06)', color: '#6B7280', label: 'Convertida' },
} as const
