-- Add master_pin_hash column to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS master_pin_hash TEXT;

