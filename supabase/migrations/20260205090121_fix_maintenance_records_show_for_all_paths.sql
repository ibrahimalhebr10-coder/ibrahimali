/*
  # Fix Maintenance Records to Show for All Path Types

  ## Problem
  - Maintenance records have `path_type` set to 'agricultural'
  - Users with 'investment' reservations cannot see maintenance records
  - The same farm maintenance should be visible to both agricultural and investment users

  ## Solution
  - Modify `get_client_maintenance_records` to show maintenance records regardless of maintenance record's path_type
  - Only filter by the user's reservation path_type
  - Match maintenance_fees by the requested path_type (for correct pricing)
  - This allows investment users to see maintenance records created for the farm

  ## Logic
  - A user with investment reservations on a farm should see ALL maintenance records for that farm
  - The maintenance_fees will be filtered by path_type to ensure correct pricing
  - This reflects reality: farm maintenance is the same, but pricing may differ
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_client_maintenance_records(text);

-- Recreate with modified logic
CREATE OR REPLACE FUNCTION get_client_maintenance_records(
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
SECURITY INVOKER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

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
    user_trees.total_trees::bigint as client_tree_count,
    (mf.cost_per_tree * user_trees.total_trees) as client_due_amount,
    COALESCE(mp.payment_status, 'pending') as payment_status,
    mp.id as payment_id,
    COUNT(DISTINCT CASE WHEN mm.visible_to_client THEN mm.id END) as visible_media_count
  FROM maintenance_records mr
  INNER JOIN farms f ON f.id = mr.farm_id
  INNER JOIN (
    SELECT
      r.farm_id,
      SUM(r.total_trees) as total_trees
    FROM reservations r
    WHERE r.user_id = current_user_id
      AND r.status IN ('confirmed', 'active')
      AND r.path_type = filter_path_type
    GROUP BY r.farm_id
  ) user_trees ON user_trees.farm_id = mr.farm_id
  LEFT JOIN maintenance_fees mf
    ON mf.maintenance_id = mr.id
    AND mf.fees_status = 'active'
    AND mf.path_type = filter_path_type
  LEFT JOIN maintenance_media mm ON mm.maintenance_id = mr.id
  LEFT JOIN maintenance_payments mp
    ON mp.user_id = current_user_id
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
    user_trees.total_trees,
    mp.payment_status,
    mp.id
  ORDER BY mr.maintenance_date DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_client_maintenance_records(text) TO authenticated;

COMMENT ON FUNCTION get_client_maintenance_records(text) IS
'Returns maintenance records for farms where the user has reservations. The maintenance_fees are filtered by path_type to show correct pricing, but maintenance records are shown regardless of their path_type since farm maintenance applies to all reservation types.';
