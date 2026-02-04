/*
  # Add Client Visibility and Fee Status Fields

  1. Changes to maintenance_media
    - Add `visible_to_client` boolean field (default true)
    - This controls whether media appears in client-facing interfaces
  
  2. Changes to maintenance_fees
    - Add `fees_status` text field (default 'active')
    - Possible values: 'active', 'inactive', 'paid'
    - Controls whether fees are shown to clients
  
  3. Auto-activation
    - Media uploaded is automatically visible to clients
    - Fees are automatically active when published
*/

-- Add visible_to_client to maintenance_media
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'maintenance_media' AND column_name = 'visible_to_client'
  ) THEN
    ALTER TABLE maintenance_media 
    ADD COLUMN visible_to_client boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Add fees_status to maintenance_fees
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'maintenance_fees' AND column_name = 'fees_status'
  ) THEN
    ALTER TABLE maintenance_fees 
    ADD COLUMN fees_status text DEFAULT 'active' NOT NULL 
    CHECK (fees_status IN ('active', 'inactive', 'paid'));
  END IF;
END $$;

-- Set all existing media as visible
UPDATE maintenance_media 
SET visible_to_client = true 
WHERE visible_to_client IS NULL;

-- Set all existing fees as active
UPDATE maintenance_fees 
SET fees_status = 'active' 
WHERE fees_status IS NULL;

-- Create function to get client-visible maintenance data
CREATE OR REPLACE FUNCTION get_client_maintenance_records(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  farm_id uuid,
  farm_name text,
  maintenance_type text,
  maintenance_date date,
  status text,
  created_at timestamptz,
  stages_count bigint,
  media_count bigint,
  visible_media_count bigint,
  has_fees boolean,
  total_amount numeric,
  cost_per_tree numeric,
  fees_status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mr.id,
    mr.farm_id,
    f.name_ar as farm_name,
    mr.maintenance_type,
    mr.maintenance_date,
    mr.status,
    mr.created_at,
    COUNT(DISTINCT ms.id) as stages_count,
    COUNT(DISTINCT mm.id) as media_count,
    COUNT(DISTINCT CASE WHEN mm.visible_to_client THEN mm.id END) as visible_media_count,
    (mf.id IS NOT NULL) as has_fees,
    mf.total_amount,
    mf.cost_per_tree,
    mf.fees_status
  FROM maintenance_records mr
  JOIN farms f ON f.id = mr.farm_id
  LEFT JOIN maintenance_stages ms ON ms.maintenance_id = mr.id
  LEFT JOIN maintenance_media mm ON mm.maintenance_id = mr.id
  LEFT JOIN maintenance_fees mf ON mf.maintenance_id = mr.id
  WHERE mr.status = 'published'
    AND EXISTS (
      SELECT 1 FROM reservations 
      WHERE reservations.farm_id = mr.farm_id 
        AND reservations.user_id = p_user_id
        AND reservations.status IN ('confirmed', 'active')
    )
  GROUP BY mr.id, mr.farm_id, f.name_ar, mr.maintenance_type, mr.maintenance_date, 
           mr.status, mr.created_at, mf.id, mf.total_amount, mf.cost_per_tree, mf.fees_status
  ORDER BY mr.maintenance_date DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_client_maintenance_records(uuid) TO authenticated;
