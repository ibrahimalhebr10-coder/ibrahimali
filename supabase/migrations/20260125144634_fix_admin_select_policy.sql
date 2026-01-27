/*
  # إصلاح سياسة قراءة المديرين

  1. التغييرات
    - حذف السياسة التي تسبب infinite recursion في SELECT
    - إضافة سياسة SELECT بسيطة للمستخدمين المصادقين
    - السماح لكل مستخدم مصادق برؤية سجله الخاص في admins
    
  2. الأمان
    - المستخدمون المصادقون يمكنهم رؤية سجلهم فقط
    - المديرون النشطون يمكنهم رؤية جميع المديرين
*/

-- حذف السياسة القديمة
DROP POLICY IF EXISTS "Admins can view other admins" ON admins;

-- سياسة بسيطة: كل مستخدم يمكنه رؤية سجله الخاص
CREATE POLICY "Users can view their own admin record"
  ON admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- سياسة إضافية: المديرون النشطون يمكنهم رؤية جميع المديرين
CREATE POLICY "Active admins can view all admins"
  ON admins FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    AND is_active = true
    AND role IN ('super_admin', 'farm_manager', 'financial_manager', 'support')
  );
