/*
  # إصلاح نهائي لمشكلة path_type الغامض
  
  ## المشكلة
  - لا يزال path_type غامض رغم تغيير اسم parameter
  - يجب استخدام table aliases واضحة في JOIN condition
  
  ## الحل
  - استخدام r.path_type بشكل صريح في WHERE clause
  - إزالة الغموض الكامل من الاستعلام
*/

-- =====================================================
-- حذف الدالة القديمة
-- =====================================================
DROP FUNCTION IF EXISTS get_client_maintenance_records(uuid, text);

-- =====================================================
-- دالة مصححة مع إزالة كاملة للغموض
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
    r.tree_count::bigint as client_tree_count,
    (r.tree_count * COALESCE(mf.cost_per_tree, 0)) as client_due_amount,
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

COMMENT ON FUNCTION get_client_maintenance_records IS 'دالة موحدة لجلب صيانات العملاء للمسارين الزراعي والاستثماري من جدول reservations';
