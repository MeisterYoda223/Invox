-- ============================================================================
-- INVOX - PRODUCTION-READY MULTI-TENANT SAAS DATABASE SCHEMA
-- ============================================================================
-- Version: 2.0
-- Erstellt: 2026-03-16
-- 
-- WICHTIG:
-- - Alle Tabellen haben RLS aktiviert
-- - company_id ist in allen Business-Tabellen vorhanden
-- - Indizes für Performance
-- - Foreign Keys für Datenintegrität
-- - Timestamps für Auditing
-- ============================================================================

-- ============================================================================
-- 1. COMPANIES - Unternehmensdaten
-- ============================================================================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company Info
  company_name TEXT NOT NULL,
  owner TEXT NOT NULL,
  
  -- Address
  street TEXT,
  zip TEXT,
  city TEXT,
  
  -- Contact
  phone TEXT,
  email TEXT,
  website TEXT,
  
  -- License & Limits
  license_type TEXT NOT NULL DEFAULT 'starter', -- starter, professional, enterprise
  license_status TEXT NOT NULL DEFAULT 'active', -- active, expired, cancelled
  license_count INTEGER NOT NULL DEFAULT 3, -- Anzahl erlaubter Benutzer
  license_valid_until TIMESTAMPTZ,
  
  -- Tax Info
  tax_number TEXT,
  vat_id TEXT,
  default_vat_rate NUMERIC(5,2) DEFAULT 19.00,
  
  -- Banking
  bank_name TEXT,
  iban TEXT,
  bic TEXT,
  
  -- Document Settings
  next_quote_number TEXT DEFAULT 'ANG-2026-001',
  next_invoice_number TEXT DEFAULT 'RE-2026-001',
  payment_terms INTEGER DEFAULT 14,
  quote_footer TEXT DEFAULT 'Wir freuen uns auf Ihre Auftragserteilung.',
  invoice_footer TEXT DEFAULT 'Vielen Dank für Ihren Auftrag.',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index für Performance
CREATE INDEX idx_companies_license_status ON companies(license_status);
CREATE INDEX idx_companies_created_at ON companies(created_at);

-- RLS aktivieren
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies für companies
CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their company"
  ON companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 2. USER_PROFILES - Benutzer-Profile mit Rollen
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- User Info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  
  -- Settings
  avatar_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indizes für Performance
CREATE INDEX idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);

-- Unique constraint: Email pro Company nur einmal
CREATE UNIQUE INDEX idx_user_profiles_company_email ON user_profiles(company_id, email);

-- RLS aktivieren
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies für user_profiles
CREATE POLICY "Users can view profiles in their company"
  ON user_profiles FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can update all profiles in their company"
  ON user_profiles FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert user profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 3. EMPLOYEE_INVITATIONS - Mitarbeiter-Einladungen
-- ============================================================================

CREATE TABLE IF NOT EXISTS employee_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Invitation Details
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  
  -- Timestamps
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indizes für Performance
CREATE INDEX idx_employee_invitations_company_id ON employee_invitations(company_id);
CREATE INDEX idx_employee_invitations_email ON employee_invitations(email);
CREATE INDEX idx_employee_invitations_token ON employee_invitations(token);
CREATE INDEX idx_employee_invitations_status ON employee_invitations(status);
CREATE INDEX idx_employee_invitations_expires_at ON employee_invitations(expires_at);

-- Unique constraint: Nur eine aktive Einladung pro Email und Company
CREATE UNIQUE INDEX idx_employee_invitations_unique_pending 
  ON employee_invitations(company_id, email, status) 
  WHERE status = 'pending';

-- RLS aktivieren
ALTER TABLE employee_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies für employee_invitations
CREATE POLICY "Admins can view invitations in their company"
  ON employee_invitations FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create invitations"
  ON employee_invitations FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update invitations in their company"
  ON employee_invitations FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete invitations in their company"
  ON employee_invitations FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can read invitations by email"
  ON employee_invitations FOR SELECT
  USING (true);

CREATE POLICY "System can update accepted invitations"
  ON employee_invitations FOR UPDATE
  USING (true);

-- ============================================================================
-- 4. ACTIVITY_LOGS - Audit Trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Activity Details
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'invited', 'login', etc.
  entity_type TEXT NOT NULL, -- 'quote', 'invoice', 'customer', 'user', etc.
  entity_id UUID,
  
  -- Additional Data
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indizes für Performance
CREATE INDEX idx_activity_logs_company_id ON activity_logs(company_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX idx_activity_logs_entity_id ON activity_logs(entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

-- GIN Index für JSONB metadata
CREATE INDEX idx_activity_logs_metadata ON activity_logs USING GIN (metadata);

-- RLS aktivieren
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies für activity_logs
CREATE POLICY "Admins can view activity logs in their company"
  ON activity_logs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 5. CUSTOMERS - Kundendaten (Multi-Tenant)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Customer Info
  customer_number TEXT NOT NULL,
  company_name TEXT,
  first_name TEXT,
  last_name TEXT,
  
  -- Address
  street TEXT,
  zip TEXT,
  city TEXT,
  country TEXT DEFAULT 'Deutschland',
  
  -- Contact
  email TEXT,
  phone TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indizes für Performance
CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_customers_customer_number ON customers(customer_number);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

-- Unique constraint: Customer number pro Company
CREATE UNIQUE INDEX idx_customers_company_customer_number 
  ON customers(company_id, customer_number);

-- RLS aktivieren
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies für customers
CREATE POLICY "Users can view customers in their company"
  ON customers FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create customers in their company"
  ON customers FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update customers in their company"
  ON customers FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete customers in their company"
  ON customers FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- 6. SERVICES - Leistungen/Services (Multi-Tenant)
-- ============================================================================

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Service Info
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT DEFAULT 'Std.',
  price NUMERIC(10,2) NOT NULL,
  vat_rate NUMERIC(5,2) DEFAULT 19.00,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indizes für Performance
CREATE INDEX idx_services_company_id ON services(company_id);
CREATE INDEX idx_services_is_active ON services(is_active);
CREATE INDEX idx_services_created_at ON services(created_at DESC);

-- RLS aktivieren
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- RLS Policies für services
CREATE POLICY "Users can view services in their company"
  ON services FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create services in their company"
  ON services FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update services in their company"
  ON services FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete services in their company"
  ON services FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- 7. QUOTES - Angebote (Multi-Tenant)
-- ============================================================================

CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Quote Info
  quote_number TEXT NOT NULL,
  title TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  
  -- Amounts
  subtotal NUMERIC(10,2) DEFAULT 0,
  vat_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  
  -- Dates
  quote_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  
  -- Content
  items JSONB DEFAULT '[]',
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indizes für Performance
CREATE INDEX idx_quotes_company_id ON quotes(company_id);
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_quotes_created_by ON quotes(created_by);
CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_quote_date ON quotes(quote_date DESC);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);

-- Unique constraint: Quote number pro Company
CREATE UNIQUE INDEX idx_quotes_company_quote_number 
  ON quotes(company_id, quote_number);

-- RLS aktivieren
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies für quotes
CREATE POLICY "Users can view quotes in their company"
  ON quotes FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create quotes in their company"
  ON quotes FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update quotes in their company"
  ON quotes FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete quotes in their company"
  ON quotes FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- 8. INVOICES - Rechnungen (Multi-Tenant)
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Invoice Info
  invoice_number TEXT NOT NULL,
  title TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  
  -- Amounts
  subtotal NUMERIC(10,2) DEFAULT 0,
  vat_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  
  -- Dates
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_date DATE,
  
  -- Content
  items JSONB DEFAULT '[]',
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indizes für Performance
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_quote_id ON invoices(quote_id);
CREATE INDEX idx_invoices_created_by ON invoices(created_by);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date DESC);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);

-- Unique constraint: Invoice number pro Company
CREATE UNIQUE INDEX idx_invoices_company_invoice_number 
  ON invoices(company_id, invoice_number);

-- RLS aktivieren
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies für invoices
CREATE POLICY "Users can view invoices in their company"
  ON invoices FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create invoices in their company"
  ON invoices FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update invoices in their company"
  ON invoices FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete invoices in their company"
  ON invoices FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- 9. HELPER FUNCTIONS
-- ============================================================================

-- Function: Get company_id for current user
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function: Check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function: Check license count
CREATE OR REPLACE FUNCTION check_license_count(p_company_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_license_count INTEGER;
  v_user_count INTEGER;
BEGIN
  -- Hole Lizenz-Limit
  SELECT license_count INTO v_license_count
  FROM companies
  WHERE id = p_company_id;
  
  -- Zähle aktive User
  SELECT COUNT(*) INTO v_user_count
  FROM user_profiles
  WHERE company_id = p_company_id AND is_active = true;
  
  -- Prüfe ob Platz ist
  RETURN v_user_count < v_license_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_company_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_logs (
    company_id,
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    p_company_id,
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. TRIGGERS für updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für alle Tabellen mit updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_invitations_updated_at BEFORE UPDATE ON employee_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION ABGESCHLOSSEN
-- ============================================================================
