/*
  # إصلاح شامل لمشكلة RLS في جدول admins

  ## المشكلة الجذرية
  جميع السياسات الحالية تستخدم EXISTS subqueries التي تحاول قراءة من جدول admins نفسه،
  مما يسبب infinite recursion (حلقة لانهائية) وتعليق التطبيق.

  ## الحل
  1. حذف جميع السياسات القديمة
  2. إنشاء سياسات بسيطة تماماً تستخدم فقط auth.uid()
  3. نقل منطق التحقق من الصلاحيات إلى طبقة التطبيق بدلاً من RLS
  
  ## السياسات الجديدة
  - كل مستخدم مصادق يمكنه رؤية سجله فقط
  - لا توجد تحققات معقدة في RLS
  - التحقق من is_super_admin يتم في الكود وليس في قاعدة البيانات
*/

-- حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "Admins can view other admins" ON admins;
DROP POLICY IF EXISTS "Super admins can manage admins" ON admins;
DROP POLICY IF EXISTS "Users can view their own admin record" ON admins;
DROP POLICY IF EXISTS "Active admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Authenticated admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Users view own admin record" ON admins;
DROP POLICY IF EXISTS "Admins can update records" ON admins;
DROP POLICY IF EXISTS "Super admins can delete" ON admins;
DROP POLICY IF EXISTS "Users can insert their own admin record" ON admins;

-- سياسة قراءة بسيطة جداً: كل مستخدم يرى سجله فقط
CREATE POLICY "simple_select_own_record"
  ON admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- سياسة إضافة بسيطة: كل مستخدم يمكنه إضافة سجله فقط
CREATE POLICY "simple_insert_own_record"
  ON admins FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- سياسة تحديث بسيطة: كل مستخدم يمكنه تحديث سجله فقط
CREATE POLICY "simple_update_own_record"
  ON admins FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- حذف السياسات المعقدة من جداول أخرى تعتمد على admins
DROP POLICY IF EXISTS "Admins can view logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can create logs" ON admin_logs;

-- سياسات بسيطة لجدول admin_logs
CREATE POLICY "simple_admin_logs_select"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
    )
  );

CREATE POLICY "simple_admin_logs_insert"
  ON admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
    )
  );

-- إصلاح سياسات payment_transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Admins can manage transactions" ON payment_transactions;

CREATE POLICY "simple_payment_transactions_select"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
    )
  );

CREATE POLICY "simple_payment_transactions_all"
  ON payment_transactions FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
    )
  );
