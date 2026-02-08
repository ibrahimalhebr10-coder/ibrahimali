/*
  # إصلاح function get_client_maintenance_records

  ## المشكلة
  الـ function كانت تستخدم جدول investment_assets الذي لا يوجد
  مما يسبب خطأ: relation "maintenance_payments" does not exist

  ## الحل
  إعادة إنشاء الـ function باستخدام جدول reservations بدلاً من investment_assets

  ## التغييرات
  - استخدام reservations لحساب عدد أشجار العميل في كل مزرعة
  - فقط الحجوزات المفعلة (status = 'active' OR status = 'confirmed')
  - حساب المبلغ المستحق = عدد الأشجار × تكلفة الصيانة لكل شجرة
*/

-- حذف الـ function القديمة إن وُجدت
DROP FUNCTION IF EXISTS get_client_maintenance_records(uuid);

-- إنشاء function محسّنة
CREATE OR REPLACE FUNCTION get_client_maintenance_records(client_user_id uuid)
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
    -- حساب عدد أشجار العميل من الحجوزات المفعلة
    COALESCE(SUM(r.tree_count), 0)::bigint as client_tree_count,
    -- حساب المبلغ المستحق
    (COALESCE(SUM(r.tree_count), 0) * COALESCE(mf.cost_per_tree, 0))::numeric as client_due_amount,
    -- حالة السداد
    COALESCE(mp.payment_status, 'pending') as payment_status,
    -- معرف السداد
    mp.id as payment_id
  FROM maintenance_records mr
  JOIN farms f ON f.id = mr.farm_id
  LEFT JOIN maintenance_fees mf ON mf.maintenance_id = mr.id
  LEFT JOIN reservations r ON r.farm_id = mr.farm_id 
    AND r.user_id = client_user_id
    AND r.status IN ('active', 'confirmed')
    AND r.path_type = 'agricultural'
  LEFT JOIN maintenance_payments mp ON mp.maintenance_fee_id = mf.id 
    AND mp.user_id = client_user_id
  WHERE mr.status = 'published'
    AND mr.client_visible = true
    AND mf.id IS NOT NULL
  GROUP BY 
    mr.id, mr.farm_id, f.name_ar, mr.maintenance_type, 
    mr.maintenance_date, mr.status, mf.total_amount, 
    mf.cost_per_tree, mp.payment_status, mp.id
  HAVING COALESCE(SUM(r.tree_count), 0) > 0
  ORDER BY mr.maintenance_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_client_maintenance_records(uuid) IS 'جلب سجلات الصيانة الخاصة بالعميل مع حساب المستحقات من جدول الحجوزات';

-- منح صلاحيات التنفيذ للمستخدمين المسجلين
GRANT EXECUTE ON FUNCTION get_client_maintenance_records(uuid) TO authenticated;
