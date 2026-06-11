export type UserRole = 'admin' | 'employee'
export type BudgetStatus = 'draft' | 'sent' | 'accepted' | 'rejected'
export type ProformaStatus = 'active' | 'converted'
export type InvoiceStatus = 'pending' | 'paid' | 'overdue'
export type EventType = 'work' | 'vacation' | 'day_off' | 'other'
export type ItemTag = 'interior' | 'exterior' | 'metal' | 'otro'
export type IvaPct = 0 | 10 | 21

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar_color: string
  is_active: boolean
  created_at: string
}

export interface CompanySettings {
  id: string
  name: string | null
  cif: string | null
  address: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  iban: string | null
  swift: string | null
  default_iva: IvaPct
  next_budget_num: number
  next_proforma_num: number
  next_invoice_num: number
  default_conditions: string | null
  default_payment: string | null
}

export interface Client {
  id: string
  name: string
  cif: string | null
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  notes: string | null
  created_at: string
}

export interface ClientTag {
  id: string
  client_id: string
  tag_name: string
  color: string
}

export interface Budget {
  id: string
  number: string
  client_id: string
  created_by: string
  status: BudgetStatus
  issue_date: string | null
  expiry_date: string | null
  iva_pct: IvaPct
  notes: string | null
  conditions_text: string | null
  created_at: string
}

export interface BudgetItem {
  id: string
  budget_id: string
  description: string
  sub_description: string | null
  quantity: number | null
  unit: string | null
  unit_price: number | null
  tag: ItemTag | null
  sort_order: number
}

export interface Treatment {
  id: string
  name: string
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface BudgetTreatment {
  budget_id: string
  treatment_id: string
}

export interface Proforma {
  id: string
  number: string
  budget_id: string | null
  client_id: string
  status: ProformaStatus
  issue_date: string | null
  notes: string | null
  created_at: string
}

export interface Invoice {
  id: string
  number: string
  budget_id: string | null
  proforma_id: string | null
  client_id: string
  status: InvoiceStatus
  issue_date: string | null
  due_date: string | null
  paid_date: string | null
  iva_pct: IvaPct
  notes: string | null
  created_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  sub_description: string | null
  quantity: number | null
  unit: string | null
  unit_price: number | null
  tag: ItemTag | null
  sort_order: number
}

export interface CalendarEvent {
  id: string
  title: string
  type: EventType
  start_date: string
  end_date: string
  all_day: boolean
  location: string | null
  notes: string | null
  budget_id: string | null
  repeat_rule: string | null
  created_by: string
  created_at: string
}

export interface EventUser {
  event_id: string
  user_id: string
}

export interface ShoppingItem {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  budget_id: string | null
  assigned_to: string | null
  supplier: string | null
  price: number | null
  is_bought: boolean
  bought_by: string | null
  bought_at: string | null
  notes: string | null
  created_by: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      users: { Row: User; Insert: Omit<User, 'created_at'>; Update: Partial<User> }
      company_settings: { Row: CompanySettings; Insert: Partial<CompanySettings>; Update: Partial<CompanySettings> }
      clients: { Row: Client; Insert: Omit<Client, 'id' | 'created_at'>; Update: Partial<Client> }
      client_tags: { Row: ClientTag; Insert: Omit<ClientTag, 'id'>; Update: Partial<ClientTag> }
      budgets: { Row: Budget; Insert: Omit<Budget, 'id' | 'created_at'>; Update: Partial<Budget> }
      budget_items: { Row: BudgetItem; Insert: Omit<BudgetItem, 'id'>; Update: Partial<BudgetItem> }
      treatments: { Row: Treatment; Insert: Omit<Treatment, 'id' | 'created_at'>; Update: Partial<Treatment> }
      budget_treatments: { Row: BudgetTreatment; Insert: BudgetTreatment; Update: Partial<BudgetTreatment> }
      proformas: { Row: Proforma; Insert: Omit<Proforma, 'id' | 'created_at'>; Update: Partial<Proforma> }
      invoices: { Row: Invoice; Insert: Omit<Invoice, 'id' | 'created_at'>; Update: Partial<Invoice> }
      invoice_items: { Row: InvoiceItem; Insert: Omit<InvoiceItem, 'id'>; Update: Partial<InvoiceItem> }
      calendar_events: { Row: CalendarEvent; Insert: Omit<CalendarEvent, 'id' | 'created_at'>; Update: Partial<CalendarEvent> }
      event_users: { Row: EventUser; Insert: EventUser; Update: Partial<EventUser> }
      shopping_items: { Row: ShoppingItem; Insert: Omit<ShoppingItem, 'id' | 'created_at'>; Update: Partial<ShoppingItem> }
    }
  }
}
