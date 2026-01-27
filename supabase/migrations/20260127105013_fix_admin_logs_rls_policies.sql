/*
  # Fix Admin Logs RLS Policies

  1. Changes
    - Remove complex policies that reference auth.users incorrectly
    - Simplify INSERT policy to allow any authenticated user to create logs
    - Keep SELECT policies for admins only
  
  2. Security
    - Authenticated users can insert logs (needed for logging actions)
    - Only admins can read logs
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can create logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can view admin logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can view logs" ON admin_logs;
DROP POLICY IF EXISTS "simple_admin_logs_insert" ON admin_logs;

-- Allow authenticated users to insert logs
CREATE POLICY "Authenticated users can create logs"
  ON admin_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins can view logs
CREATE POLICY "Admins can view logs"
  ON admin_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );
