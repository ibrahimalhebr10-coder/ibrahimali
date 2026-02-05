/*
  # Fix Investment Cycles RLS Policy - Status Check

  1. Problem
    - Current RLS policy checks for `r.status = 'active'` only
    - User reservations have status = 'confirmed' 
    - This prevents users from seeing their investment cycles

  2. Solution
    - Update RLS policy to allow 'active', 'confirmed', and 'paid' statuses
    - This matches the service layer logic

  3. Security
    - Still maintains proper access control
    - Users can only see cycles for farms they have active/confirmed/paid reservations in
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Investors can view published investment cycles for their farms" ON investment_cycles;

-- Create updated policy with correct status check
CREATE POLICY "Investors can view published investment cycles for their farms"
  ON investment_cycles
  FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    AND visible_to_client = true
    AND EXISTS (
      SELECT 1 
      FROM reservations r
      WHERE r.farm_id = investment_cycles.farm_id
        AND r.user_id = auth.uid()
        AND r.status IN ('active', 'confirmed', 'paid')
        AND r.path_type = 'investment'
    )
  );
