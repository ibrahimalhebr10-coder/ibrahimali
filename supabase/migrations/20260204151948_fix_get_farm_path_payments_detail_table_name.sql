/*
  # إصلاح دالة get_farm_path_payments_detail - تصحيح اسم الجدول

  ## المشكلة
  
  الدالة كانت تستخدم جدول غير موجود `maintenance_operations`
  الاسم الصحيح هو `maintenance_records`

  ## الحل
  
  تحديث الدالة لاستخدام الجدول الصحيح
*/

-- حذف الدالة القديمة
DROP FUNCTION IF EXISTS get_farm_path_payments_detail(uuid, text, text);

-- إنشاء الدالة الصحيحة
CREATE OR REPLACE FUNCTION get_farm_path_payments_detail(
  p_farm_id uuid,
  p_path_type text,
  p_status_filter text DEFAULT 'all'
)
RETURNS TABLE (
  payment_id uuid,
  user_id uuid,
  full_name text,
  tree_count integer,
  amount_due numeric,
  amount_paid numeric,
  payment_status text,
  payment_date timestamptz,
  maintenance_type text,
  maintenance_date text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mp.id as payment_id,
    mp.user_id,
    up.full_name,
    mp.tree_count,
    mp.amount_due,
    COALESCE(mp.amount_paid, 0) as amount_paid,
    mp.payment_status,
    mp.payment_date,
    mr.maintenance_type,
    to_char(mr.maintenance_date, 'YYYY-MM-DD') as maintenance_date,
    mp.created_at
  FROM maintenance_payments mp
  JOIN maintenance_fees mf ON mf.id = mp.maintenance_fee_id
  JOIN maintenance_records mr ON mr.id = mf.maintenance_id
  JOIN user_profiles up ON up.id = mp.user_id
  WHERE mf.farm_id = p_farm_id
    AND mf.path_type = p_path_type
    AND (
      p_status_filter = 'all' OR
      mp.payment_status = p_status_filter
    )
  ORDER BY mp.created_at DESC;
END;
$$;
