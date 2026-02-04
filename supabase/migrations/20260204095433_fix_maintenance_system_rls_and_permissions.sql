/*
  # Fix Maintenance System RLS and Permissions

  1. Security Updates
    - Add RLS policies for maintenance_fee_records table
    - Add RLS policies for maintenance_fees_grouped table
    - Grant necessary permissions on views
  
  2. Changes Made
    - Enable RLS on missing tables
    - Add admin and user policies for all maintenance tables
    - Grant SELECT on maintenance views to authenticated users
*/

-- Enable RLS on tables if not already enabled
ALTER TABLE IF EXISTS maintenance_fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS maintenance_fees_grouped ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage maintenance fee records" ON maintenance_fee_records;
DROP POLICY IF EXISTS "Users can view fee records" ON maintenance_fee_records;
DROP POLICY IF EXISTS "Admins can manage grouped fees" ON maintenance_fees_grouped;
DROP POLICY IF EXISTS "Users can view published grouped fees" ON maintenance_fees_grouped;

-- Create policies for maintenance_fee_records
CREATE POLICY "Admins can manage maintenance fee records"
  ON maintenance_fee_records
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
  ));

CREATE POLICY "Users can view fee records"
  ON maintenance_fee_records
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for maintenance_fees_grouped
CREATE POLICY "Admins can manage grouped fees"
  ON maintenance_fees_grouped
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
  ));

CREATE POLICY "Users can view published grouped fees"
  ON maintenance_fees_grouped
  FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Grant permissions on views
GRANT SELECT ON maintenance_full_details TO authenticated;
GRANT SELECT ON maintenance_payments_summary TO authenticated;
