/*
  # إنشاء RPC Function للمسار الزراعي - زر أشجاري الخضراء
  
  ## الملخص
  إنشاء دالة لجلب صيانات الأشجار الزراعية للعميل من قسم التشغيل مباشرة.
  
  ## التفاصيل
  - المسار: client → agricultural_tree_inventory → farms → maintenance_records
  - فقط الصيانات المنشورة (status = 'published')
  - حساب نصيب العميل: عدد أشجاره × تكلفة الشجرة
  - ربط مع حالة السداد
  
  ## الفرق عن المسار الاستثماري
  - المسار الزراعي: agricultural_tree_inventory (الأشجار حسب farm_id + tree_type)
  - المسار الاستثماري: investment_assets (الأشجار حسب farm_id)
*/

-- =====================================================
-- 1. دالة للحصول على صيانات المزارع الزراعية للعميل
-- =====================================================
CREATE OR REPLACE FUNCTION get_agricultural_client_maintenance_records(client_user_id uuid)
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
    COALESCE(SUM(ati.quantity), 0::bigint) as client_tree_count,
    (COALESCE(SUM(ati.quantity), 0) * COALESCE(mf.cost_per_tree, 0)) as client_due_amount,
    COALESCE(mp.payment_status, 'pending') as payment_status,
    mp.id as payment_id
  FROM maintenance_records mr
  JOIN farms f ON f.id = mr.farm_id
  LEFT JOIN maintenance_fees mf ON mf.maintenance_id = mr.id
  LEFT JOIN agricultural_tree_inventory ati ON ati.farm_id = mr.farm_id
  LEFT JOIN reservations r ON r.farm_id = mr.farm_id 
    AND r.user_id = client_user_id 
    AND r.status IN ('active', 'confirmed')
    AND r.path_type = 'agricultural'
  LEFT JOIN maintenance_payments mp ON mp.maintenance_fee_id = mf.id AND mp.user_id = client_user_id
  WHERE mr.status = 'published'
    AND r.id IS NOT NULL
  GROUP BY 
    mr.id, mr.farm_id, f.name_ar, mr.maintenance_type, 
    mr.maintenance_date, mr.status, mf.total_amount, 
    mf.cost_per_tree, mp.payment_status, mp.id
  ORDER BY mr.maintenance_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_agricultural_client_maintenance_records IS 'جلب صيانات المزارع الزراعية المملوكة للعميل مع حساب المستحقات';
