/*
  # إصلاح سياسات RLS لجدول influencer_partners للتسجيل الموحد

  ## الهدف
  
  السماح للمستخدمين المصادق عليهم بإنشاء سجلاتهم الخاصة كشركاء نجاح
  مع status = 'active' مباشرة (تفعيل فوري).

  ## التغييرات
  
  1. حذف السياسة القديمة التي تسمح فقط بـ status = 'pending'
  2. إنشاء سياسات جديدة للمستخدمين المصادق عليهم:
     - SELECT: يمكن للشريك رؤية سجله الخاص
     - INSERT: يمكن إنشاء سجل خاص به مع status = 'active'
     - UPDATE: يمكن تحديث سجله الخاص

  ## الأمان
  
  - المستخدم يمكنه فقط إنشاء/رؤية/تحديث سجله الخاص (user_id = auth.uid())
  - المسؤولون يمكنهم رؤية/تعديل جميع السجلات (السياسات الموجودة)
*/

-- حذف السياسة القديمة
DROP POLICY IF EXISTS "Anyone can register as success partner" ON influencer_partners;

-- سياسة SELECT: الشريك يمكنه رؤية سجله الخاص
CREATE POLICY "Partners can view their own record"
  ON influencer_partners
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- سياسة INSERT: المستخدمون المصادق عليهم يمكنهم إنشاء سجلاتهم الخاصة
CREATE POLICY "Authenticated users can register as partner"
  ON influencer_partners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND phone IS NOT NULL
    AND name IS NOT NULL
    AND status IN ('pending', 'active')
  );

-- سياسة UPDATE: الشريك يمكنه تحديث سجله الخاص (محدود)
CREATE POLICY "Partners can update their own record"
  ON influencer_partners
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

COMMENT ON POLICY "Partners can view their own record" ON influencer_partners 
IS 'شركاء النجاح يمكنهم رؤية سجلاتهم الخاصة';

COMMENT ON POLICY "Authenticated users can register as partner" ON influencer_partners 
IS 'المستخدمون المصادق عليهم يمكنهم التسجيل كشركاء نجاح مع تفعيل فوري';

COMMENT ON POLICY "Partners can update their own record" ON influencer_partners 
IS 'شركاء النجاح يمكنهم تحديث سجلاتهم الخاصة';
