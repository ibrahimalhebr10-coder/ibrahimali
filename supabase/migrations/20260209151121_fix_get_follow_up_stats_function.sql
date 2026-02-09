/*
  # إصلاح دالة get_follow_up_stats
  
  تحديث الدالة لاستخدام أسماء الأعمدة الصحيحة
*/

-- حذف الدالة القديمة
DROP FUNCTION IF EXISTS get_follow_up_stats();

-- إعادة إنشاء الدالة بالأعمدة الصحيحة
CREATE OR REPLACE FUNCTION get_follow_up_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'total_pending', COUNT(*) FILTER (WHERE status = 'pending_payment'),
      'total_amount', COALESCE(SUM(total_price) FILTER (WHERE status = 'pending_payment'), 0),
      'critical_count', COUNT(*) FILTER (
        WHERE status = 'pending_payment' 
        AND payment_deadline < now() + interval '24 hours'
        AND payment_deadline > now()
      ),
      'overdue_count', COUNT(*) FILTER (
        WHERE status = 'pending_payment' 
        AND payment_deadline < now()
      )
    )
    FROM reservations
    WHERE flexible_payment_enabled = true
      AND created_at > now() - interval '30 days'
  );
END;
$$;
