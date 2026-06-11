-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text CHECK (role IN ('admin','employee')) DEFAULT 'employee',
  avatar_color text DEFAULT '#1E3A8A',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. company_settings table
CREATE TABLE IF NOT EXISTS public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  cif text,
  address text,
  phone text,
  email text,
  logo_url text,
  iban text,
  swift text,
  default_iva integer DEFAULT 21,
  next_budget_num integer DEFAULT 1,
  next_proforma_num integer DEFAULT 1,
  next_invoice_num integer DEFAULT 1,
  default_conditions text,
  default_payment text
);

-- 3. clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cif text UNIQUE,
  contact_name text,
  phone text,
  email text,
  address text,
  city text,
  postal_code text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 4. client_tags table
CREATE TABLE IF NOT EXISTS public.client_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  tag_name text NOT NULL,
  color text DEFAULT '#1E3A8A'
);

-- 5. budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text UNIQUE NOT NULL,
  client_id uuid REFERENCES public.clients(id),
  created_by uuid REFERENCES public.users(id),
  status text CHECK (status IN ('draft','sent','accepted','rejected')) DEFAULT 'draft',
  issue_date date,
  expiry_date date,
  iva_pct integer CHECK (iva_pct IN (0,10,21)) DEFAULT 21,
  notes text,
  conditions_text text,
  created_at timestamptz DEFAULT now()
);

-- 6. budget_items table
CREATE TABLE IF NOT EXISTS public.budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES public.budgets(id) ON DELETE CASCADE,
  description text NOT NULL,
  sub_description text,
  quantity decimal(10,2),
  unit text,
  unit_price decimal(10,2),
  tag text CHECK (tag IN ('interior','exterior','metal','otro')),
  sort_order integer DEFAULT 0
);

-- 7. treatments table
CREATE TABLE IF NOT EXISTS public.treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 8. budget_treatments table
CREATE TABLE IF NOT EXISTS public.budget_treatments (
  budget_id uuid REFERENCES public.budgets(id) ON DELETE CASCADE,
  treatment_id uuid REFERENCES public.treatments(id) ON DELETE CASCADE,
  PRIMARY KEY (budget_id, treatment_id)
);

-- 9. proformas table
CREATE TABLE IF NOT EXISTS public.proformas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text UNIQUE NOT NULL,
  budget_id uuid REFERENCES public.budgets(id),
  client_id uuid REFERENCES public.clients(id),
  status text CHECK (status IN ('active','converted')) DEFAULT 'active',
  issue_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 10. invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text UNIQUE NOT NULL,
  budget_id uuid REFERENCES public.budgets(id),
  proforma_id uuid REFERENCES public.proformas(id),
  client_id uuid REFERENCES public.clients(id),
  status text CHECK (status IN ('pending','paid','overdue')) DEFAULT 'pending',
  issue_date date,
  due_date date,
  paid_date date,
  iva_pct integer CHECK (iva_pct IN (0,10,21)) DEFAULT 21,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 11. invoice_items table
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  sub_description text,
  quantity decimal(10,2),
  unit text,
  unit_price decimal(10,2),
  tag text CHECK (tag IN ('interior','exterior','metal','otro')),
  sort_order integer DEFAULT 0
);

-- 12. calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text CHECK (type IN ('work','vacation','day_off','other')) DEFAULT 'work',
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  all_day boolean DEFAULT false,
  location text,
  notes text,
  budget_id uuid REFERENCES public.budgets(id),
  repeat_rule text,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

-- 13. event_users table
CREATE TABLE IF NOT EXISTS public.event_users (
  event_id uuid REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, user_id)
);

-- 14. shopping_items table
CREATE TABLE IF NOT EXISTS public.shopping_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity decimal(10,2),
  unit text,
  budget_id uuid REFERENCES public.budgets(id),
  assigned_to uuid REFERENCES public.users(id),
  supplier text,
  price decimal(10,2),
  is_bought boolean DEFAULT false,
  bought_by uuid REFERENCES public.users(id),
  bought_at timestamptz,
  notes text,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proformas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- RLS helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- SELECT policies: authenticated users can read all rows
CREATE POLICY "Authenticated users can select users" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select company_settings" ON public.company_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select client_tags" ON public.client_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select budgets" ON public.budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select budget_items" ON public.budget_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select treatments" ON public.treatments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select budget_treatments" ON public.budget_treatments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select proformas" ON public.proformas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select invoice_items" ON public.invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select calendar_events" ON public.calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select event_users" ON public.event_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can select shopping_items" ON public.shopping_items FOR SELECT TO authenticated USING (true);

-- INSERT/UPDATE/DELETE policies: only admins
CREATE POLICY "Admins can insert users" ON public.users FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update users" ON public.users FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete users" ON public.users FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can insert company_settings" ON public.company_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update company_settings" ON public.company_settings FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete company_settings" ON public.company_settings FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update clients" ON public.clients FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can insert client_tags" ON public.client_tags FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update client_tags" ON public.client_tags FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete client_tags" ON public.client_tags FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can insert budgets" ON public.budgets FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update budgets" ON public.budgets FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete budgets" ON public.budgets FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can insert budget_items" ON public.budget_items FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update budget_items" ON public.budget_items FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete budget_items" ON public.budget_items FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can insert treatments" ON public.treatments FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update treatments" ON public.treatments FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete treatments" ON public.treatments FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can insert budget_treatments" ON public.budget_treatments FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update budget_treatments" ON public.budget_treatments FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete budget_treatments" ON public.budget_treatments FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can insert proformas" ON public.proformas FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update proformas" ON public.proformas FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete proformas" ON public.proformas FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete invoices" ON public.invoices FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can insert invoice_items" ON public.invoice_items FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update invoice_items" ON public.invoice_items FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete invoice_items" ON public.invoice_items FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can insert calendar_events" ON public.calendar_events FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update calendar_events" ON public.calendar_events FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete calendar_events" ON public.calendar_events FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can insert event_users" ON public.event_users FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update event_users" ON public.event_users FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete event_users" ON public.event_users FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can insert shopping_items" ON public.shopping_items FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update shopping_items" ON public.shopping_items FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete shopping_items" ON public.shopping_items FOR DELETE TO authenticated USING (public.is_admin());

-- Trigger to sync auth.users -> public.users on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
