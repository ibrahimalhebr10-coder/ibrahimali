/*
  # Fix Client Maintenance Records - Add Fee ID

  1. Changes
    - Update get_client_maintenance_records to return maintenance_fee_id
    - This is needed for payment creation
*/

DROP FUNCTION IF EXISTS get_client_maintenance_records(uuid, text);

CREATE OR REPLACE FUNCTION get_client_maintenance_records(
  client_user_id uuid,
  filter_path_type text DEFAULT 'agricultural'
)
RETURNS TABLE (
  maintenance_id uuid,
  maintenance_fee_id uuid,
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
    mf.id as maintenance_fee_id,
    mr.farm_id,
    f.name_ar as farm_name,
    mr.maintenance_type,
    mr.maintenance_date,
    mr.status,
    mf.total_amount,
    mf.cost_per_tree,
    mf.fees_status,
    r.total_trees::bigint as client_tree_count,
    (mf.cost_per_tree * r.total_trees) as client_due_amount,
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
    mf.id,
    mr.farm_id, 
    f.name_ar, 
    mr.maintenance_type, 
    mr.maintenance_date, 
    mr.status,
    mf.total_amount,
    mf.cost_per_tree,
    mf.fees_status,
    r.total_trees,
    mp.payment_status,
    mp.id
  ORDER BY mr.maintenance_date DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_client_maintenance_records(uuid, text) TO authenticated;
