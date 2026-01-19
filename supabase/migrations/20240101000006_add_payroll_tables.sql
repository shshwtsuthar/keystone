-- Create enum for pay run status
CREATE TYPE pay_run_status AS ENUM ('draft', 'finalized');

-- Pay runs table
CREATE TABLE pay_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pay_period_start TIMESTAMPTZ NOT NULL,
  pay_period_end TIMESTAMPTZ NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL,
  status pay_run_status NOT NULL DEFAULT 'finalized',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pay run earnings table
CREATE TABLE pay_run_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pay_run_id UUID NOT NULL REFERENCES pay_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  hours DECIMAL(10,2) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  description TEXT,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pay run deductions table
CREATE TABLE pay_run_deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pay_run_id UUID NOT NULL REFERENCES pay_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  tax_withheld DECIMAL(10,2) NOT NULL DEFAULT 0,
  superannuation DECIMAL(10,2) NOT NULL DEFAULT 0,
  gross_pay DECIMAL(10,2) NOT NULL,
  net_pay DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_pay_runs_organization_id ON pay_runs(organization_id);
CREATE INDEX idx_pay_runs_status ON pay_runs(status);
CREATE INDEX idx_pay_run_earnings_pay_run_id ON pay_run_earnings(pay_run_id);
CREATE INDEX idx_pay_run_earnings_employee_id ON pay_run_earnings(employee_id);
CREATE INDEX idx_pay_run_deductions_pay_run_id ON pay_run_deductions(pay_run_id);
CREATE INDEX idx_pay_run_deductions_employee_id ON pay_run_deductions(employee_id);

-- Triggers for updated_at
CREATE TRIGGER update_pay_runs_updated_at BEFORE UPDATE ON pay_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pay_run_earnings_updated_at BEFORE UPDATE ON pay_run_earnings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pay_run_deductions_updated_at BEFORE UPDATE ON pay_run_deductions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE pay_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_run_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_run_deductions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pay_runs
CREATE POLICY "Users can view pay runs in their organization"
  ON pay_runs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pay runs in their organization"
  ON pay_runs FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update pay runs in their organization"
  ON pay_runs FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pay runs in their organization"
  ON pay_runs FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for pay_run_earnings
CREATE POLICY "Users can view pay run earnings in their organization"
  ON pay_run_earnings FOR SELECT
  USING (
    pay_run_id IN (
      SELECT id FROM pay_runs WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert pay run earnings in their organization"
  ON pay_run_earnings FOR INSERT
  WITH CHECK (
    pay_run_id IN (
      SELECT id FROM pay_runs WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update pay run earnings in their organization"
  ON pay_run_earnings FOR UPDATE
  USING (
    pay_run_id IN (
      SELECT id FROM pay_runs WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete pay run earnings in their organization"
  ON pay_run_earnings FOR DELETE
  USING (
    pay_run_id IN (
      SELECT id FROM pay_runs WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for pay_run_deductions
CREATE POLICY "Users can view pay run deductions in their organization"
  ON pay_run_deductions FOR SELECT
  USING (
    pay_run_id IN (
      SELECT id FROM pay_runs WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert pay run deductions in their organization"
  ON pay_run_deductions FOR INSERT
  WITH CHECK (
    pay_run_id IN (
      SELECT id FROM pay_runs WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update pay run deductions in their organization"
  ON pay_run_deductions FOR UPDATE
  USING (
    pay_run_id IN (
      SELECT id FROM pay_runs WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete pay run deductions in their organization"
  ON pay_run_deductions FOR DELETE
  USING (
    pay_run_id IN (
      SELECT id FROM pay_runs WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

