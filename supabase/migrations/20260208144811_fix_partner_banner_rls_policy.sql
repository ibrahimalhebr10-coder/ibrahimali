/*
  # إصلاح RLS للسماح بقراءة إعدادات شريط شركاء النجاح

  1. المشكلة
    - شريط "كن شريك نجاح" لا يظهر في الواجهة الرئيسية
    - السبب: RLS policy لا تسمح للمستخدمين غير المسجلين بقراءة إعدادات التسويق
    - `partner_share_message_enabled` له category = 'marketing'
    - Policy الحالية تسمح فقط بقراءة category = 'public'

  2. الحل
    - إضافة policy جديدة تسمح لجميع المستخدمين (بما فيهم anonymous) بقراءة إعدادات التسويق
    - هذا آمن لأن هذه الإعدادات عامة ومخصصة للعرض في الواجهة

  3. الأمان
    - القراءة فقط (SELECT)
    - فقط للإعدادات التي category = 'marketing' أو category = 'public'
    - لا يمكن التعديل أو الحذف
*/

-- إضافة policy للسماح لجميع المستخدمين بقراءة إعدادات التسويق والإعدادات العامة
CREATE POLICY "Anyone can read public and marketing settings"
  ON system_settings
  FOR SELECT
  TO public
  USING (category IN ('public', 'marketing'));

-- ملاحظة: policy الموجودة للمستخدمين المسجلين ("Users can read public settings") 
-- ستبقى كما هي، والـ policy الجديدة أوسع وتشمل المستخدمين غير المسجلين أيضاً
