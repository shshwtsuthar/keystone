-- Add new fields to organizations table
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS employer_business_name TEXT,
  ADD COLUMN IF NOT EXISTS abn TEXT;

