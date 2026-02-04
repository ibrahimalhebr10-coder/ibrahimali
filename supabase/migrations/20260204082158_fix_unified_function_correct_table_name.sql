/*
  # تصحيح الدالة الموحدة - اسم الجدول الصحيح
  
  ## المشكلة
  - الدالة الموحدة تبحث عن جدول `investment_assets`
  - لكن الجدول الحقيقي اسمه `investment_agricultural_assets`
  - لذلك تحصل خطأ: relation "investment_assets" does not exist
  
  ## الحل
  - تصحيح اسم الجدول في الدالة الموحدة
  - استخدام `investment_agricultural_assets` بدلاً من `investment_assets`
*/

-- =====================================================
-- 1. حذف الدالة القديمة
-- =====================================================
DROP FUNCTION IF EXISTS get_client_maintenance_records(uuid, text);

-- =====================================================
-- 2. دالة موحدة مصححة مع اسم الجدول الصحيح
-- =====================================================
CREATE OR REPLACE FUNCTION get_client_maintenance_records(
  client_user_id uuid,
  path_type text DEFAULT 'agricultural'
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
  -- إذا كان المسار زراعي
  IF path_type = 'agricultural' THEN
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
    JOIN farms f ON f.id = mr.farm_id
    JOIN reservations r ON r.farm_id = mr.farm_id 
      AND r.user_id = client_user_id 
      AND r.status IN ('active', 'confirmed')
      AND r.path_type = 'agricultural'
    LEFT JOIN maintenance_fees mf ON mf.maintenance_id = mr.id
    LEFT JOIN maintenance_payments mp ON mp.maintenance_fee_id = mf.id AND mp.user_id = client_user_id
    WHERE mr.status = 'published'
    ORDER BY mr.maintenance_date DESC;
  
  -- إذا كان المسار استثماري
  ELSE
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
      COUNT(DISTINCT ia.id) as client_tree_count,
      (COUNT(DISTINCT ia.id) * COALESCE(mf.cost_per_tree, 0)) as client_due_amount,
      COALESCE(mp.payment_status, 'pending') as payment_status,
      mp.id as payment_id
    FROM maintenance_records mr
    JOIN farms f ON f.id = mr.farm_id
    JOIN investment_agricultural_assets ia ON ia.farm_id = mr.farm_id AND ia.user_id = client_user_id
    LEFT JOIN maintenance_fees mf ON mf.maintenance_id = mr.id
    LEFT JOIN maintenance_payments mp ON mp.maintenance_fee_id = mf.id AND mp.user_id = client_user_id
    WHERE mr.status = 'published'
    GROUP BY 
      mr.id, mr.farm_id, f.name_ar, mr.maintenance_type, 
      mr.maintenance_date, mr.status, mf.total_amount, 
      mf.cost_per_tree, mp.payment_status, mp.id
    ORDER BY mr.maintenance_date DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_client_maintenance_records IS 'دالة موحدة لجلب صيانات العملاء للمسارين الزراعي والاستثماري';
