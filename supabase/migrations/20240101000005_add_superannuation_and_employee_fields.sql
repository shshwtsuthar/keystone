-- Add superannuation_default_rate to organizations table
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS superannuation_default_rate DECIMAL(5,2);

-- Add new fields to employees table
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS classification TEXT,
  ADD COLUMN IF NOT EXISTS super_fund_name TEXT,
  ADD COLUMN IF NOT EXISTS member_number TEXT,
  ADD COLUMN IF NOT EXISTS saturday_sunday_rate DECIMAL(10,2);

