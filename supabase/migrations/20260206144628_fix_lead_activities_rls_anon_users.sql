/*
  # Fix Lead Activities RLS for Anonymous Users

  1. Problem
    - Anonymous users cannot insert lead activities
    - RLS policy is blocking insertions
  
  2. Solution
    - Drop existing INSERT policy
    - Create new comprehensive INSERT policy for both anon and authenticated users
    - Ensure policy allows insertions without restrictions for tracking purposes
  
  3. Security
    - Lead activities are tracking data, should be insertable by anyone
    - No sensitive data stored
    - Read access still restricted to admins and owners
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Authenticated and anonymous can insert activities" ON lead_activities;

-- Create new INSERT policy that explicitly allows both anon and authenticated
CREATE POLICY "Allow all users to insert lead activities"
  ON lead_activities
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ensure table has RLS enabled
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
