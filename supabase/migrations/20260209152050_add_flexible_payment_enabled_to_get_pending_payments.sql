/*
  # إضافة flexible_payment_enabled لدالة get_pending_payments
  
  تحديث الدالة لإرجاع حقل flexible_payment_enabled
*/

-- حذف الدالة القديمة
DROP FUNCTION IF EXISTS get_pending_payments(text, text);

-- إعادة إنشاء الدالة مع الحقل الجديد
CREATE OR REPLACE FUNCTION get_pending_payments(
  p_path_type_filter text DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  path_type text,
  farm_name text,
  trees_count integer,
  total_amount numeric,
  created_at timestamptz,
  payment_deadline timestamptz,
  hours_remaining numeric,
  status_priority text,
  last_follow_up_date timestamptz,
  follow_up_count bigint,
  flexible_payment_enabled boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    COALESCE(up.full_name, 'عميل') as customer_name,
    up.phone as customer_phone,
    '' as customer_email,
    r.path_type,
    r.farm_name,
    r.total_trees as trees_count,
    r.total_price as total_amount,
    r.created_at,
    r.payment_deadline,
    EXTRACT(EPOCH FROM (r.payment_deadline - now())) / 3600 as hours_remaining,
    CASE 
      WHEN r.payment_deadline < now() THEN 'overdue'
      WHEN r.payment_deadline < now() + interval '24 hours' THEN 'critical'
      WHEN r.payment_deadline < now() + interval '3 days' THEN 'urgent'
      ELSE 'normal'
    END as status_priority,
    r.last_follow_up_date,
    (SELECT COUNT(*) FROM follow_up_activities WHERE reservation_id = r.id) as follow_up_count,
    r.flexible_payment_enabled
  FROM reservations r
  LEFT JOIN user_profiles up ON r.user_id = up.id
  WHERE r.status = 'pending_payment'
    AND r.flexible_payment_enabled = true
    AND (p_path_type_filter IS NULL OR r.path_type = p_path_type_filter)
    AND (p_search IS NULL OR 
      LOWER(COALESCE(up.full_name, '')) LIKE LOWER('%' || p_search || '%') OR
      COALESCE(up.phone, '') LIKE '%' || p_search || '%'
    )
  ORDER BY 
    CASE 
      WHEN r.payment_deadline < now() THEN 1
      WHEN r.payment_deadline < now() + interval '24 hours' THEN 2
      WHEN r.payment_deadline < now() + interval '3 days' THEN 3
      ELSE 4
    END,
    r.payment_deadline ASC;
END;
$$;
