/*
  # دعم الحجوزات المؤقتة (قبل التسجيل)

  1. التغييرات
    - جعل user_id nullable للسماح بالحجوزات المؤقتة
    - إضافة حقل guest_id لتعريف الحجوزات المؤقتة
    - إضافة حقول بيانات العقد (contract_id, duration, bonus_years)
    - إضافة timestamp للحجوزات المؤقتة منتهية الصلاحية
    - إضافة حالة جديدة 'temporary' للحجوزات قبل التسجيل

  2. تدفق الحجز المؤقت
    - temporary: حجز مؤقت قبل التسجيل
    - pending: بعد التسجيل، بانتظار اعتماد الإدارة
    - waiting_for_payment: معتمد من الإدارة
    - ... بقية الحالات

  3. الأمان
    - الحجوزات المؤقتة يمكن الوصول لها عبر guest_id
    - بعد التسجيل يتم ربطها بـ user_id
    - الحجوزات المؤقتة تنتهي صلاحيتها بعد 24 ساعة
*/

-- جعل user_id nullable
DO $$
BEGIN
  ALTER TABLE reservations
  ALTER COLUMN user_id DROP NOT NULL;
END $$;

-- إضافة حقول جديدة
DO $$
BEGIN
  -- معرف الضيف المؤقت
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'guest_id'
  ) THEN
    ALTER TABLE reservations ADD COLUMN guest_id text;
  END IF;

  -- معرف العقد
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'contract_id'
  ) THEN
    ALTER TABLE reservations ADD COLUMN contract_id uuid REFERENCES farm_contracts(id);
  END IF;

  -- اسم العقد
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'contract_name'
  ) THEN
    ALTER TABLE reservations ADD COLUMN contract_name text;
  END IF;

  -- مدة الاستثمار
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'duration_years'
  ) THEN
    ALTER TABLE reservations ADD COLUMN duration_years integer;
  END IF;

  -- السنوات المجانية
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'bonus_years'
  ) THEN
    ALTER TABLE reservations ADD COLUMN bonus_years integer DEFAULT 0;
  END IF;

  -- وقت انتهاء الحجز المؤقت
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'temporary_expires_at'
  ) THEN
    ALTER TABLE reservations ADD COLUMN temporary_expires_at timestamptz;
  END IF;
END $$;

-- تحديث قيود الحالات لإضافة 'temporary'
DO $$
BEGIN
  ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_status_check;

  ALTER TABLE reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN (
    'temporary',
    'pending',
    'waiting_for_payment',
    'payment_submitted',
    'paid',
    'transferred_to_harvest',
    'cancelled'
  ));
END $$;

-- إضافة قيد: يجب أن يكون user_id أو guest_id موجود
DO $$
BEGIN
  ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_user_or_guest_check;

  ALTER TABLE reservations
  ADD CONSTRAINT reservations_user_or_guest_check
  CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL);
END $$;

-- إضافة indexes
CREATE INDEX IF NOT EXISTS idx_reservations_guest_id ON reservations(guest_id)
WHERE guest_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_temporary ON reservations(status, temporary_expires_at)
WHERE status = 'temporary';

-- تحديث سياسات RLS للحجوزات المؤقتة
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON reservations;

-- السماح للجميع بإنشاء حجز مؤقت
CREATE POLICY "Anyone can create temporary reservations"
  ON reservations FOR INSERT
  WITH CHECK (status = 'temporary' AND user_id IS NULL AND guest_id IS NOT NULL);

-- المستخدمون المسجلون يمكنهم رؤية حجوزاتهم
CREATE POLICY "Users can view their own reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- الزوار يمكنهم رؤية حجوزاتهم المؤقتة
CREATE POLICY "Guests can view their temporary reservations"
  ON reservations FOR SELECT
  TO anon
  USING (guest_id IS NOT NULL AND status = 'temporary');

-- المستخدمون يمكنهم تحديث حجوزاتهم
CREATE POLICY "Users can update their own reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- السماح بربط الحجز المؤقت بالمستخدم بعد التسجيل
CREATE POLICY "Link temporary reservation to user after registration"
  ON reservations FOR UPDATE
  TO authenticated
  USING (guest_id IS NOT NULL AND status = 'temporary' AND user_id IS NULL)
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- تحديث سياسات reservation_items
DROP POLICY IF EXISTS "Users can view their reservation items" ON reservation_items;
DROP POLICY IF EXISTS "Users can create reservation items" ON reservation_items;

CREATE POLICY "Anyone can create temporary reservation items"
  ON reservation_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.id = reservation_items.reservation_id
      AND (reservations.status = 'temporary' OR reservations.user_id = auth.uid())
    )
  );

CREATE POLICY "Users and guests can view their reservation items"
  ON reservation_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.id = reservation_items.reservation_id
      AND (
        reservations.user_id = auth.uid()
        OR (reservations.guest_id IS NOT NULL AND reservations.status = 'temporary')
      )
    )
  );

-- وظيفة لتنظيف الحجوزات المؤقتة منتهية الصلاحية (24 ساعة)
CREATE OR REPLACE FUNCTION cleanup_expired_temporary_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE reservations
  SET status = 'cancelled'
  WHERE status = 'temporary'
  AND temporary_expires_at < now();
END;
$$;

-- تعليقات توضيحية
COMMENT ON COLUMN reservations.guest_id IS 'معرف مؤقت للحجوزات قبل التسجيل';
COMMENT ON COLUMN reservations.contract_id IS 'معرف العقد المحجوز';
COMMENT ON COLUMN reservations.contract_name IS 'اسم العقد المحجوز';
COMMENT ON COLUMN reservations.duration_years IS 'مدة الاستثمار بالسنوات';
COMMENT ON COLUMN reservations.bonus_years IS 'عدد السنوات المجانية';
COMMENT ON COLUMN reservations.temporary_expires_at IS 'وقت انتهاء صلاحية الحجز المؤقت (24 ساعة)';
COMMENT ON COLUMN reservations.status IS 'حالة الحجز: temporary, pending, waiting_for_payment, payment_submitted, paid, transferred_to_harvest, cancelled';
