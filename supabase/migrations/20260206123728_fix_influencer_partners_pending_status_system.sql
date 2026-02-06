/*
  # Fix Influencer Partners Pending Status System

  1. Changes
    - Add default value 'pending' to status column
    - Add constraint to ensure status is valid
    - Fix RLS policies to allow admins to read all partners
    - Add trigger to set default status on insert

  2. Security
    - RLS policies allow admins to manage partners
    - Only authenticated users can create partner requests
*/

-- Add constraint for status values if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'influencer_partners_status_check'
  ) THEN
    ALTER TABLE influencer_partners
    ADD CONSTRAINT influencer_partners_status_check 
    CHECK (status IN ('pending', 'active', 'suspended'));
  END IF;
END $$;

-- Set default value for status column
ALTER TABLE influencer_partners 
ALTER COLUMN status SET DEFAULT 'pending';

-- Update existing NULL status to 'pending' if auto_activate is false
UPDATE influencer_partners 
SET status = 'pending' 
WHERE status IS NULL 
AND NOT EXISTS (
  SELECT 1 FROM influencer_settings 
  WHERE is_system_active = true 
  AND auto_activate_partners = true
);

-- Update existing NULL status to 'active' if auto_activate is true
UPDATE influencer_partners 
SET status = 'active' 
WHERE status IS NULL 
AND EXISTS (
  SELECT 1 FROM influencer_settings 
  WHERE is_system_active = true 
  AND auto_activate_partners = true
);

-- Create or replace function to set default status based on settings
CREATE OR REPLACE FUNCTION set_default_partner_status()
RETURNS TRIGGER AS $$
DECLARE
  auto_activate BOOLEAN;
BEGIN
  -- If status is not provided, check settings
  IF NEW.status IS NULL THEN
    SELECT auto_activate_partners INTO auto_activate
    FROM influencer_settings
    WHERE id = '00000000-0000-0000-0000-000000000001'
    LIMIT 1;

    -- Set status based on auto_activate setting
    IF auto_activate = true THEN
      NEW.status := 'active';
      NEW.is_active := true;
    ELSE
      NEW.status := 'pending';
      NEW.is_active := false;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS set_partner_status_on_insert ON influencer_partners;

-- Create trigger to set default status
CREATE TRIGGER set_partner_status_on_insert
  BEFORE INSERT ON influencer_partners
  FOR EACH ROW
  EXECUTE FUNCTION set_default_partner_status();

-- Fix RLS policies for admins to read all partners
DROP POLICY IF EXISTS "Admins can view all partners" ON influencer_partners;

CREATE POLICY "Admins can view all partners"
  ON influencer_partners
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Allow admins to update partner status
DROP POLICY IF EXISTS "Admins can update partners" ON influencer_partners;

CREATE POLICY "Admins can update partners"
  ON influencer_partners
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );
