-- Add is_onboarded column to profiles table
-- Default to false and NOT NULL to ensure all profiles have this flag
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN NOT NULL DEFAULT false;

-- Set is_onboarded to true for existing profiles that have master_pin_hash set
-- This handles existing users who have completed onboarding
UPDATE profiles
SET is_onboarded = true
WHERE master_pin_hash IS NOT NULL;

