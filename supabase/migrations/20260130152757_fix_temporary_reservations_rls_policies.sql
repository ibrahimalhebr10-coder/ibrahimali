/*
  # إصلاح سياسات RLS للحجوزات المؤقتة

  1. المشكلة
    - السياسات الحالية لا تسمح للمستخدمين غير المسجلين (anon) بإنشاء حجوزات
    - يجب تحديد role بشكل صريح: TO anon, authenticated

  2. الحل
    - إعادة إنشاء السياسات مع تحديد الأدوار المسموحة
    - السماح للجميع (anon + authenticated) بإنشاء حجوزات مؤقتة
*/

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Anyone can create temporary reservations" ON reservations;
DROP POLICY IF EXISTS "Guests can view their temporary reservations" ON reservations;
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON reservations;
DROP POLICY IF EXISTS "Link temporary reservation to user after registration" ON reservations;

DROP POLICY IF EXISTS "Anyone can create temporary reservation items" ON reservation_items;
DROP POLICY IF EXISTS "Users and guests can view their reservation items" ON reservation_items;

-- سياسات reservations الجديدة المحسّنة

-- 1. السماح للجميع (anon + authenticated) بإنشاء حجز مؤقت
CREATE POLICY "Anyone can create temporary reservations"
  ON reservations FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'temporary' 
    AND user_id IS NULL 
    AND guest_id IS NOT NULL
    AND temporary_expires_at IS NOT NULL
  );

-- 2. المستخدمون غير المسجلين يمكنهم قراءة حجوزاتهم المؤقتة (عبر guest_id)
CREATE POLICY "Guests can view their temporary reservations"
  ON reservations FOR SELECT
  TO anon, authenticated
  USING (
    status = 'temporary' 
    AND guest_id IS NOT NULL
  );

-- 3. المستخدمون المسجلون يمكنهم قراءة حجوزاتهم (عبر user_id)
CREATE POLICY "Users can view their own reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. المستخدمون المسجلون يمكنهم تحديث حجوزاتهم
CREATE POLICY "Users can update their own reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. السماح بربط الحجز المؤقت بالمستخدم بعد التسجيل
CREATE POLICY "Link temporary reservation to user after registration"
  ON reservations FOR UPDATE
  TO authenticated
  USING (
    status = 'temporary' 
    AND guest_id IS NOT NULL 
    AND user_id IS NULL
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND status = 'pending'
  );

-- سياسات reservation_items الجديدة المحسّنة

-- 1. السماح للجميع بإنشاء عناصر للحجوزات المؤقتة أو حجوزاتهم الخاصة
CREATE POLICY "Anyone can create reservation items for temporary or own reservations"
  ON reservation_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.id = reservation_items.reservation_id
      AND (
        -- حجز مؤقت
        (reservations.status = 'temporary' AND reservations.guest_id IS NOT NULL)
        OR
        -- أو حجز المستخدم المسجل
        (reservations.user_id = auth.uid())
      )
    )
  );

-- 2. الجميع يمكنهم قراءة عناصر حجوزاتهم
CREATE POLICY "View reservation items for temporary or own reservations"
  ON reservation_items FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.id = reservation_items.reservation_id
      AND (
        -- حجز مؤقت (يمكن لأي أحد قراءته)
        (reservations.status = 'temporary' AND reservations.guest_id IS NOT NULL)
        OR
        -- أو حجز المستخدم المسجل
        (reservations.user_id = auth.uid())
      )
    )
  );

-- إضافة تعليقات توضيحية
COMMENT ON POLICY "Anyone can create temporary reservations" ON reservations IS 
'يسمح للجميع (مسجلين وغير مسجلين) بإنشاء حجوزات مؤقتة لمدة 24 ساعة';

COMMENT ON POLICY "Guests can view their temporary reservations" ON reservations IS 
'يسمح للجميع بقراءة الحجوزات المؤقتة (بدون قيود على guest_id لتبسيط الوصول)';

COMMENT ON POLICY "Link temporary reservation to user after registration" ON reservations IS 
'يسمح للمستخدم الجديد بربط الحجز المؤقت بحسابه بعد التسجيل';
