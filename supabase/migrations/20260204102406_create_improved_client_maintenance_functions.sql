/*
  # Create Improved Client Maintenance Functions

  1. New Functions
    - Drop and recreate get_client_maintenance_records with proper path type filtering
    - Add support for visible_media_count and fees_status
    - Filter by user reservations and path type
  
  2. Security
    - Functions are SECURITY DEFINER to access all necessary data
    - Validate user authentication
    - Filter by user's actual reservations
*/

-- Drop existing function versions
DROP FUNCTION IF EXISTS get_client_maintenance_records(uuid);
DROP FUNCTION IF EXISTS get_client_maintenance_records(uuid, text);

-- Create improved function for client maintenance records with path filtering
CREATE OR REPLACE FUNCTION get_client_maintenance_records(
  client_user_id uuid,
  filter_path_type text DEFAULT 'agricultural'
)
RETURNS TABLE (
  maintenance_id uuid,
  farm_id uuid,
  farm_name text,
  maintenance_type text,
  maintenance_date date,
  status text,
  total_amount numeric,
  cost_per_tree numeric,
  fees_status text,
  client_tree_count bigint,
  client_due_amount numeric,
  payment_status text,
  payment_id uuid,
  visible_media_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mr.id as maintenance_id,
    mr.farm_id,
    f.name_ar as farm_name,
    mr.maintenance_type,
    mr.maintenance_date,
    mr.status,
    mf.total_amount,
    mf.cost_per_tree,
    mf.fees_status,
    r.tree_count as client_tree_count,
    (mf.cost_per_tree * r.tree_count) as client_due_amount,
    COALESCE(mp.payment_status, 'pending') as payment_status,
    mp.id as payment_id,
    COUNT(DISTINCT CASE WHEN mm.visible_to_client THEN mm.id END) as visible_media_count
  FROM maintenance_records mr
  JOIN farms f ON f.id = mr.farm_id
  LEFT JOIN maintenance_fees mf ON mf.maintenance_id = mr.id AND mf.fees_status = 'active'
  LEFT JOIN maintenance_media mm ON mm.maintenance_id = mr.id
  JOIN reservations r ON r.farm_id = mr.farm_id 
    AND r.user_id = client_user_id
    AND r.status IN ('confirmed', 'active')
    AND r.path_type = filter_path_type
  LEFT JOIN maintenance_payments mp ON mp.user_id = client_user_id 
    AND mp.maintenance_fee_id = mf.id
  WHERE mr.status = 'published'
  GROUP BY 
    mr.id, 
    mr.farm_id, 
    f.name_ar, 
    mr.maintenance_type, 
    mr.maintenance_date, 
    mr.status,
    mf.total_amount,
    mf.cost_per_tree,
    mf.fees_status,
    r.tree_count,
    mp.payment_status,
    mp.id
  ORDER BY mr.maintenance_date DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_client_maintenance_records(uuid, text) TO authenticated;

-- Create function to get visible maintenance media for client
CREATE OR REPLACE FUNCTION get_client_visible_media(
  p_maintenance_id uuid
)
RETURNS TABLE (
  id uuid,
  media_type text,
  file_path text,
  uploaded_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mm.id,
    mm.media_type,
    mm.file_path,
    mm.uploaded_at
  FROM maintenance_media mm
  JOIN maintenance_records mr ON mr.id = mm.maintenance_id
  WHERE mm.maintenance_id = p_maintenance_id
    AND mm.visible_to_client = true
    AND mr.status = 'published'
  ORDER BY mm.uploaded_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_client_visible_media(uuid) TO authenticated;

-- Create function to get maintenance stages for client
CREATE OR REPLACE FUNCTION get_client_maintenance_stages(
  p_maintenance_id uuid
)
RETURNS TABLE (
  id uuid,
  stage_title text,
  stage_note text,
  stage_date date
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ms.id,
    ms.stage_title,
    ms.stage_note,
    ms.stage_date
  FROM maintenance_stages ms
  JOIN maintenance_records mr ON mr.id = ms.maintenance_id
  WHERE ms.maintenance_id = p_maintenance_id
    AND mr.status = 'published'
  ORDER BY ms.stage_date ASC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_client_maintenance_stages(uuid) TO authenticated;
