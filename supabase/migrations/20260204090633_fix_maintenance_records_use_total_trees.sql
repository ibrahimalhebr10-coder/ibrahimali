/*
  # إصلاح استخدام total_trees بدلاً من tree_count
  
  ## المشكلة
  - الدالة تستخدم r.tree_count لكن جدول reservations يستخدم total_trees
  
  ## الحل
  - استبدال r.tree_count بـ r.total_trees
*/

-- =====================================================
-- حذف الدالة القديمة
-- =====================================================
DROP FUNCTION IF EXISTS get_client_maintenance_records(uuid, text);

-- =====================================================
-- دالة مصححة مع استخدام total_trees
-- =====================================================
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
  client_tree_count bigint,
  client_due_amount numeric,
  payment_status text,
  payment_id uuid
) AS $$
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
    r.total_trees::bigint as client_tree_count,
    (r.total_trees * COALESCE(mf.cost_per_tree, 0)) as client_due_amount,
    COALESCE(mp.payment_status, 'pending') as payment_status,
    mp.id as payment_id
  FROM maintenance_records mr
  INNER JOIN farms f ON f.id = mr.farm_id
  INNER JOIN reservations r ON r.farm_id = mr.farm_id 
  LEFT JOIN maintenance_fees mf ON mf.maintenance_id = mr.id
  LEFT JOIN maintenance_payments mp ON mp.maintenance_fee_id = mf.id AND mp.user_id = client_user_id
  WHERE mr.status = 'published'
    AND r.user_id = client_user_id 
    AND r.status IN ('active', 'confirmed')
    AND r.path_type = filter_path_type
  ORDER BY mr.maintenance_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_client_maintenance_records IS 'دالة موحدة لجلب صيانات العملاء للمسارين الزراعي والاستثماري - تستخدم total_trees من جدول reservations';
