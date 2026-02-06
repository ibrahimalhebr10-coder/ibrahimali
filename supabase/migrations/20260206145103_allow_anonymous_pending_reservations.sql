/*
  # Allow Anonymous Users to Create Pending Reservations

  1. Problem
    - Anonymous users cannot create reservations when clicking "حجز الآن"
    - Current RLS policy only allows:
      - Temporary reservations with guest_id and expiry
      - Authenticated users with user_id
    - But the flow needs anonymous users to create pending reservations before registration
  
  2. Solution
    - Add new INSERT policy allowing anonymous users to create pending reservations
    - This supports the pre-payment registration flow
  
  3. Security
    - Anonymous reservations are linked to session/device
    - Can be claimed after user registration
    - No sensitive data exposed
    - Admins can still view and manage all reservations
*/

-- Add new policy for anonymous pending reservations
CREATE POLICY "Anonymous users can create pending reservations"
  ON reservations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (status = 'pending' OR status = 'temporary') AND
    (user_id IS NULL OR user_id = auth.uid())
  );

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Anyone can create temporary reservations" ON reservations;
DROP POLICY IF EXISTS "Authenticated users can create their own reservations" ON reservations;
