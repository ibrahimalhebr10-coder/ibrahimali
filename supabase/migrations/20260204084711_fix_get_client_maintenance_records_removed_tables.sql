/*
  # تصحيح دالة سجلات الصيانة - حذف الإشارة للجداول المحذوفة
  
  ## المشكلة
  - الدالة `get_client_maintenance_records` تحاول الوصول إلى جدول `investment_agricultural_assets`
  - هذا الجدول تم حذفه في migration سابق (20260204060254)
  - خطأ: relation "investment_agricultural_assets" does not exist
  
  ## الحل
  - استخدام جدول `reservations` لكلا المسارين (الزراعي والاستثماري)
  - جدول `reservations` يحتوي على حقل `path_type` الذي يميز بين المسارين
  - حقل `tree_count` في `reservations` يحتوي على عدد الأشجار المملوكة
  
  ## المنطق الجديد
  - للمسار الزراعي: استخدام `reservations` مع `path_type = 'agricultural'`
  - للمسار الاستثماري: استخدام `reservations` مع `path_type = 'investment'`
*/

-- =====================================================
-- حذف الدالة القديمة
-- =====================================================
DROP FUNCTION IF EXISTS get_client_maintenance_records(uuid, text);

-- =====================================================
-- دالة مصححة تستخدم reservations لكلا المسارين
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
    AND r.path_type = path_type
  LEFT JOIN maintenance_fees mf ON mf.maintenance_id = mr.id
  LEFT JOIN maintenance_payments mp ON mp.maintenance_fee_id = mf.id AND mp.user_id = client_user_id
  WHERE mr.status = 'published'
  ORDER BY mr.maintenance_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_client_maintenance_records IS 'دالة موحدة لجلب صيانات العملاء للمسارين الزراعي والاستثماري من جدول reservations';
