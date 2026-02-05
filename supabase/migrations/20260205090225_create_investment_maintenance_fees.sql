/*
  # Create Investment Path Maintenance Fees

  ## Problem
  - Existing maintenance records only have fees for agricultural path
  - Investment users cannot see fee amounts or make payments
  - Admin created maintenance records but only for one path

  ## Solution
  - Create maintenance_fees for investment path for all published maintenance records
  - Use same cost_per_tree as agricultural (can be adjusted later)
  - Set fees_status to 'active' so they appear to users

  ## Logic
  - For each published maintenance_record that has agricultural fees
  - Create corresponding investment fees with same pricing
  - This allows both user types to see and pay for maintenance
*/

-- Create investment fees for existing maintenance records
INSERT INTO maintenance_fees (
  maintenance_id,
  farm_id,
  total_amount,
  cost_per_tree,
  fees_status,
  path_type
)
SELECT 
  mf.maintenance_id,
  mf.farm_id,
  mf.total_amount,
  mf.cost_per_tree,
  'active' as fees_status,
  'investment' as path_type
FROM maintenance_fees mf
INNER JOIN maintenance_records mr ON mr.id = mf.maintenance_id
WHERE mf.path_type = 'agricultural'
  AND mr.status = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM maintenance_fees mf2
    WHERE mf2.maintenance_id = mf.maintenance_id
    AND mf2.path_type = 'investment'
  );
