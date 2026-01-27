/*
  # إصلاح RLS Policies للوحة تحكم الإدارة

  1. تغييرات الأمان
    - إصلاح policies على user_profiles للسماح للإدارة بالوصول
    - إصلاح policies على reservations للسماح للإدارة بالوصول
    - إصلاح policies على payment_transactions وإزالة الاستعلامات الخاطئة على auth.users
    - إصلاح policies على reservation_items للسماح للإدارة بالوصول
    - إضافة policies جديدة للإدارة بدلاً من محاولة الوصول إلى auth.users

  2. ملاحظات مهمة
    - استخدام admins table للتحقق من صلاحيات الإدارة
    - إزالة أي استعلامات على auth.users من RLS policies
    - الحفاظ على أمان البيانات للمستخدمين العاديين
*/

-- إزالة policies القديمة الخاطئة
DROP POLICY IF EXISTS "simple_payment_transactions_select" ON payment_transactions;
DROP POLICY IF EXISTS "simple_payment_transactions_all" ON payment_transactions;
DROP POLICY IF EXISTS "simple_admin_logs_select" ON admin_logs;

-- user_profiles: إضافة policy للإدارة
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- reservations: إضافة policy للإدارة
CREATE POLICY "Admins can view all reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Admins can update all reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- payment_transactions: إعادة إنشاء policies بدون استعلامات على auth.users
CREATE POLICY "Users can view own transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Admins can update all transactions"
  ON payment_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Admins can insert transactions"
  ON payment_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- reservation_items: إضافة policy للإدارة
CREATE POLICY "Admins can view all reservation items"
  ON reservation_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- admin_logs: إصلاح policy بدون استعلامات على auth.users
CREATE POLICY "Admins can view admin logs"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );
