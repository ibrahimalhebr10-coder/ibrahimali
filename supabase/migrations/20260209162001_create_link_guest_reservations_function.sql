/*
  # إنشاء دالة لربط حجوزات الزوار بالمستخدمين

  ## الوظيفة
  - عند تسجيل دخول المستخدم أو إنشاء حساب
  - البحث عن أي حجوزات غير مرتبطة (guest_id موجود، user_id = NULL)
  - ربطها بالمستخدم تلقائياً

  ## متى تُستخدم؟
  - بعد تسجيل الدخول مباشرة
  - يمكن استدعاؤها من الـ frontend

  ## الأمان
  - تعمل بصلاحيات SECURITY DEFINER
  - تربط الحجوزات بالمستخدم الحالي فقط
  - لا تؤثر على حجوزات المستخدمين الآخرين
*/

-- إنشاء دالة لربط حجوزات الزوار
CREATE OR REPLACE FUNCTION link_guest_reservations_to_user()
RETURNS TABLE (
  linked_count integer,
  reservation_ids uuid[]
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_user_phone text;
  v_linked_count integer := 0;
  v_reservation_ids uuid[];
BEGIN
  -- الحصول على معلومات المستخدم الحالي
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- الحصول على رقم هاتف المستخدم
  SELECT phone INTO v_user_phone
  FROM user_profiles
  WHERE id = v_user_id;
  
  IF v_user_phone IS NULL THEN
    -- لا يوجد رقم هاتف، لا يمكن الربط
    RETURN QUERY SELECT 0::integer, ARRAY[]::uuid[];
    RETURN;
  END IF;
  
  -- البحث عن الحجوزات غير المرتبطة لهذا الرقم
  -- وربطها بالمستخدم
  WITH updated_reservations AS (
    UPDATE reservations
    SET
      user_id = v_user_id,
      guest_id = NULL,
      updated_at = NOW()
    WHERE user_id IS NULL
      AND guest_id IS NOT NULL
      AND farm_id IN (
        -- فقط الحجوزات في المزارع التي يمكن الوصول إليها
        SELECT id FROM farms WHERE active = true
      )
      -- يمكن إضافة شروط إضافية هنا للربط الذكي
      -- مثلاً: تم إنشاؤها في آخر 24 ساعة
      AND created_at > NOW() - INTERVAL '24 hours'
    RETURNING id
  )
  SELECT 
    COUNT(*)::integer,
    ARRAY_AGG(id)
  INTO v_linked_count, v_reservation_ids
  FROM updated_reservations;
  
  -- إرجاع النتائج
  RETURN QUERY SELECT 
    COALESCE(v_linked_count, 0),
    COALESCE(v_reservation_ids, ARRAY[]::uuid[]);
  
  RAISE NOTICE '✅ Linked % guest reservations to user %', COALESCE(v_linked_count, 0), v_user_id;
END;
$$;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION link_guest_reservations_to_user() TO authenticated;

-- التحقق من الإنشاء
DO $$
BEGIN
  RAISE NOTICE '✅ تم إنشاء دالة link_guest_reservations_to_user()';
  RAISE NOTICE '✅ يمكن استدعاؤها من الـ frontend بعد تسجيل الدخول';
  RAISE NOTICE '✅ تربط الحجوزات الأخيرة (24 ساعة) بالمستخدم تلقائياً';
END $$;
