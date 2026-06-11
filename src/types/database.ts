export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'employee'
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
  default_iva: number
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
  client_id: string | null
  created_by: string | null
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  issue_date: string | null
  expiry_date: string | null
  iva_pct: 0 | 10 | 21
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
  tag: 'interior' | 'exterior' | 'metal' | 'otro' | null
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
  client_id: string | null
  status: 'active' | 'converted'
  issue_date: string | null
  notes: string | null
  created_at: string
}

export interface Invoice {
  id: string
  number: string
  budget_id: string | null
  proforma_id: string | null
  client_id: string | null
  status: 'pending' | 'paid' | 'overdue'
  issue_date: string | null
  due_date: string | null
  paid_date: string | null
  iva_pct: 0 | 10 | 21
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
  tag: 'interior' | 'exterior' | 'metal' | 'otro' | null
  sort_order: number
}

export interface CalendarEvent {
  id: string
  title: string
  type: 'work' | 'vacation' | 'day_off' | 'other'
  start_date: string
  end_date: string
  all_day: boolean
  location: string | null
  notes: string | null
  budget_id: string | null
  repeat_rule: string | null
  created_by: string | null
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
  created_by: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Partial<User> & Pick<User, 'name' | 'email'>
        Update: Partial<User>
      }
      company_settings: {
        Row: CompanySettings
        Insert: Partial<CompanySettings>
        Update: Partial<CompanySettings>
      }
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Client>
      }
      client_tags: {
        Row: ClientTag
        Insert: Omit<ClientTag, 'id'> & { id?: string }
        Update: Partial<ClientTag>
      }
      budgets: {
        Row: Budget
        Insert: Omit<Budget, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Budget>
      }
      budget_items: {
        Row: BudgetItem
        Insert: Omit<BudgetItem, 'id'> & { id?: string }
        Update: Partial<BudgetItem>
      }
      treatments: {
        Row: Treatment
        Insert: Omit<Treatment, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Treatment>
      }
      budget_treatments: {
        Row: BudgetTreatment
        Insert: BudgetTreatment
        Update: Partial<BudgetTreatment>
      }
      proformas: {
        Row: Proforma
        Insert: Omit<Proforma, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Proforma>
      }
      invoices: {
        Row: Invoice
        Insert: Omit<Invoice, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Invoice>
      }
      invoice_items: {
        Row: InvoiceItem
        Insert: Omit<InvoiceItem, 'id'> & { id?: string }
        Update: Partial<InvoiceItem>
      }
      calendar_events: {
        Row: CalendarEvent
        Insert: Omit<CalendarEvent, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<CalendarEvent>
      }
      event_users: {
        Row: EventUser
        Insert: EventUser
        Update: Partial<EventUser>
      }
      shopping_items: {
        Row: ShoppingItem
        Insert: Omit<ShoppingItem, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<ShoppingItem>
      }
    }
  }
}
