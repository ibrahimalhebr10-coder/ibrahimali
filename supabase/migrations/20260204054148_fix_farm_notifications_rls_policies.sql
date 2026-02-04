/*
  # إصلاح RLS Policies لجدول farm_operation_notifications

  ## المشكلة
  RLS policy تستخدم admins.user_id بدلاً من admins.id
  هذا يسبب فشل في الوصول للبيانات

  ## الحل
  - حذف policy القديمة
  - إنشاء policy جديدة تستخدم admins.id بشكل صحيح
  - استخدام نفس النمط المطبق في باقي الجداول

  ## الجداول المتأثرة
  - farm_operation_notifications
*/

-- حذف policy القديمة
DROP POLICY IF EXISTS "Admins have full access to farm notifications" ON farm_operation_notifications;

-- إنشاء policy جديدة صحيحة
CREATE POLICY "Admins have full access to farm notifications"
  ON farm_operation_notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );
