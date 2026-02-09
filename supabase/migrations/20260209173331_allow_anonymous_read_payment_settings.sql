/*
  # السماح للزوار بقراءة إعدادات الدفع المرن

  1. المشكلة
    - الزوار غير المسجلين لا يمكنهم قراءة إعدادات system_settings
    - زر الدفع المرن لا يظهر للزوار
    - فقط المستخدمين المسجلين يمكنهم رؤية خيارات الدفع المرن

  2. الحل
    - إضافة سياسة RLS جديدة تسمح للجميع (authenticated و anon) بقراءة إعدادات الدفع
    - هذه الإعدادات ليست حساسة ويجب أن تكون متاحة للجميع لاتخاذ قرار الحجز

  3. الإعدادات المسموح بقراءتها
    - جميع إعدادات فئة 'payment'
    - جميع إعدادات فئة 'contact'
    - جميع إعدادات فئة 'public'

  4. الأمان
    - القراءة فقط (SELECT)
    - لا يمكن التعديل أو الحذف إلا من المديرين
*/

-- حذف السياسة القديمة للمستخدمين المسجلين
DROP POLICY IF EXISTS "Users can read public settings" ON system_settings;

-- سياسة جديدة: السماح للجميع (مسجلين وزوار) بقراءة إعدادات الدفع والاتصال والعامة
CREATE POLICY "Everyone can read payment and contact settings"
  ON system_settings
  FOR SELECT
  USING (
    category IN ('payment', 'contact', 'public')
  );

-- ملاحظة: هذه السياسة تسمح بالقراءة فقط لكل من:
-- 1. authenticated users (المستخدمين المسجلين)
-- 2. anon users (الزوار غير المسجلين)
--
-- المديرون يمكنهم التعديل عبر السياسة "Admins can manage all settings"