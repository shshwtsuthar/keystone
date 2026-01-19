-- Fix infinite recursion in profiles RLS policy
-- Create a security definer function to get user's organization_id without RLS checks

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
DECLARE
  user_org_id UUID;
BEGIN
  SELECT organization_id INTO user_org_id
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN user_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;

-- Recreate the policy using the security definer function
CREATE POLICY "Users can view profiles in their organization"
  ON profiles FOR SELECT
  USING (organization_id = public.get_user_organization_id());

-- Also fix the organizations policies to use the same function to avoid potential issues
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can update their own organization" ON organizations;

CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (id = public.get_user_organization_id());

CREATE POLICY "Users can update their own organization"
  ON organizations FOR UPDATE
  USING (id = public.get_user_organization_id());

-- Fix all other policies that query profiles to use the function
DROP POLICY IF EXISTS "Users can view locations in their organization" ON locations;
DROP POLICY IF EXISTS "Users can insert locations in their organization" ON locations;
DROP POLICY IF EXISTS "Users can update locations in their organization" ON locations;
DROP POLICY IF EXISTS "Users can delete locations in their organization" ON locations;

CREATE POLICY "Users can view locations in their organization"
  ON locations FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can insert locations in their organization"
  ON locations FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update locations in their organization"
  ON locations FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can delete locations in their organization"
  ON locations FOR DELETE
  USING (organization_id = public.get_user_organization_id());

-- Fix employees policies
DROP POLICY IF EXISTS "Users can view employees in their organization" ON employees;
DROP POLICY IF EXISTS "Users can insert employees in their organization" ON employees;
DROP POLICY IF EXISTS "Users can update employees in their organization" ON employees;
DROP POLICY IF EXISTS "Users can delete employees in their organization" ON employees;

CREATE POLICY "Users can view employees in their organization"
  ON employees FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can insert employees in their organization"
  ON employees FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update employees in their organization"
  ON employees FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can delete employees in their organization"
  ON employees FOR DELETE
  USING (organization_id = public.get_user_organization_id());

-- Fix timesheets policies
DROP POLICY IF EXISTS "Users can view timesheets in their organization" ON timesheets;
DROP POLICY IF EXISTS "Users can insert timesheets in their organization" ON timesheets;
DROP POLICY IF EXISTS "Users can update timesheets in their organization" ON timesheets;

CREATE POLICY "Users can view timesheets in their organization"
  ON timesheets FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can insert timesheets in their organization"
  ON timesheets FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update timesheets in their organization"
  ON timesheets FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

