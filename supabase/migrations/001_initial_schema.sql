-- ============================================================
-- Pinturas Pireco SL — Esquema inicial (13 tablas)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USUARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            uuid PRIMARY KEY,
  name          text NOT NULL,
  email         text UNIQUE NOT NULL,
  role          text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  avatar_color  text NOT NULL DEFAULT '#1E3A8A',
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Sync auth.users → public.users on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- AJUSTES DE EMPRESA (fila única)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.company_settings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text,
  cif                  text,
  address              text,
  phone                text,
  email                text,
  logo_url             text,
  iban                 text,
  swift                text,
  default_iva          integer NOT NULL DEFAULT 21 CHECK (default_iva IN (0, 10, 21)),
  next_budget_num      integer NOT NULL DEFAULT 1,
  next_proforma_num    integer NOT NULL DEFAULT 1,
  next_invoice_num     integer NOT NULL DEFAULT 1,
  default_conditions   text,
  default_payment      text
);

-- Seed one row
INSERT INTO public.company_settings (name, cif)
VALUES ('Pinturas Pireco SL', '')
ON CONFLICT DO NOTHING;

-- ============================================================
-- CLIENTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  cif          text UNIQUE,
  contact_name text,
  phone        text,
  email        text,
  address      text,
  city         text,
  postal_code  text,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ETIQUETAS DE CLIENTE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.client_tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tag_name   text NOT NULL,
  color      text NOT NULL DEFAULT '#1E3A8A'
);

-- ============================================================
-- PRESUPUESTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number           text UNIQUE NOT NULL,
  client_id        uuid REFERENCES public.clients(id),
  created_by       uuid REFERENCES public.users(id),
  status           text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  issue_date       date,
  expiry_date      date,
  iva_pct          integer NOT NULL DEFAULT 21 CHECK (iva_pct IN (0, 10, 21)),
  notes            text,
  conditions_text  text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- LÍNEAS DE PRESUPUESTO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.budget_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id        uuid NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  description      text NOT NULL,
  sub_description  text,
  quantity         decimal(10, 2),
  unit             text,
  unit_price       decimal(10, 2),
  tag              text CHECK (tag IN ('interior', 'exterior', 'metal', 'otro')),
  sort_order       integer NOT NULL DEFAULT 0
);

-- ============================================================
-- TRATAMIENTOS (biblioteca global)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.treatments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PRESUPUESTO ↔ TRATAMIENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.budget_treatments (
  budget_id    uuid NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  treatment_id uuid NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  PRIMARY KEY (budget_id, treatment_id)
);

-- ============================================================
-- PROFORMAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.proformas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number      text UNIQUE NOT NULL,
  budget_id   uuid REFERENCES public.budgets(id),
  client_id   uuid REFERENCES public.clients(id),
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted')),
  issue_date  date,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- FACTURAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number       text UNIQUE NOT NULL,
  budget_id    uuid REFERENCES public.budgets(id),
  proforma_id  uuid REFERENCES public.proformas(id),
  client_id    uuid REFERENCES public.clients(id),
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  issue_date   date,
  due_date     date,
  paid_date    date,
  iva_pct      integer NOT NULL DEFAULT 21 CHECK (iva_pct IN (0, 10, 21)),
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- LÍNEAS DE FACTURA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id       uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description      text NOT NULL,
  sub_description  text,
  quantity         decimal(10, 2),
  unit             text,
  unit_price       decimal(10, 2),
  tag              text CHECK (tag IN ('interior', 'exterior', 'metal', 'otro')),
  sort_order       integer NOT NULL DEFAULT 0
);

-- ============================================================
-- EVENTOS DE CALENDARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  type         text NOT NULL DEFAULT 'work' CHECK (type IN ('work', 'vacation', 'day_off', 'other')),
  start_date   timestamptz NOT NULL,
  end_date     timestamptz NOT NULL,
  all_day      boolean NOT NULL DEFAULT false,
  location     text,
  notes        text,
  budget_id    uuid REFERENCES public.budgets(id),
  repeat_rule  text,
  created_by   uuid REFERENCES public.users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- EVENTO ↔ USUARIOS ASIGNADOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_users (
  event_id  uuid NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, user_id)
);

-- ============================================================
-- LISTA DE COMPRAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shopping_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  quantity     decimal(10, 2),
  unit         text,
  budget_id    uuid REFERENCES public.budgets(id),
  assigned_to  uuid REFERENCES public.users(id),
  supplier     text,
  price        decimal(10, 2),
  is_bought    boolean NOT NULL DEFAULT false,
  bought_by    uuid REFERENCES public.users(id),
  bought_at    timestamptz,
  notes        text,
  created_by   uuid NOT NULL REFERENCES public.users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_treatments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proformas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items     ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is the current user authenticated and active?
CREATE OR REPLACE FUNCTION public.is_authenticated_user()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Macro to apply standard policies to a table
-- All authenticated users: SELECT
-- Only admins: INSERT, UPDATE, DELETE
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'users', 'company_settings', 'clients', 'client_tags',
    'budgets', 'budget_items', 'treatments', 'budget_treatments',
    'proformas', 'invoices', 'invoice_items',
    'calendar_events', 'event_users', 'shopping_items'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('
      CREATE POLICY "authenticated_read_%1$s"
        ON public.%1$s FOR SELECT
        TO authenticated
        USING (public.is_authenticated_user());

      CREATE POLICY "admin_insert_%1$s"
        ON public.%1$s FOR INSERT
        TO authenticated
        WITH CHECK (public.is_admin());

      CREATE POLICY "admin_update_%1$s"
        ON public.%1$s FOR UPDATE
        TO authenticated
        USING (public.is_admin());

      CREATE POLICY "admin_delete_%1$s"
        ON public.%1$s FOR DELETE
        TO authenticated
        USING (public.is_admin());
    ', t);
  END LOOP;
END $$;

-- shopping_items: employees can also insert and update their own items
CREATE POLICY "employee_insert_shopping"
  ON public.shopping_items FOR INSERT
  TO authenticated
  WITH CHECK (public.is_authenticated_user());

CREATE POLICY "employee_update_own_shopping"
  ON public.shopping_items FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.is_admin());
