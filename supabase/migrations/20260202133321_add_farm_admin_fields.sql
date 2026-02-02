/*
  # إضافة حقول إدارية للمزارع

  1. الحقول الجديدة
    - `internal_cost_per_tree` (numeric) - السعر الداخلي الفعلي للشجرة (للتكاليف والتحليل)
    - `coming_soon_label` (text) - نص "قريبًا" القابل للتعديل (يظهر في بطاقة المزرعة)
    - `card_description` (text) - الوصف المختصر للبطاقة (يظهر أسفل بطاقة المزرعة)

  2. الغرض
    - internal_cost_per_tree: لحساب الربح والخسارة داخليًا فقط
    - coming_soon_label: عنوان إضافي قابل للتخصيص
    - card_description: وصف مختصر للمزرعة في البطاقة

  3. الملاحظات
    - هذه الحقول لا تؤثر على التسعير للعملاء
    - التسعير يتم من خلال نظام الباقات فقط
*/

-- إضافة حقل التكلفة الداخلية
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'farms' AND column_name = 'internal_cost_per_tree'
  ) THEN
    ALTER TABLE farms ADD COLUMN internal_cost_per_tree numeric DEFAULT 0;
  END IF;
END $$;

-- إضافة حقل "قريبًا"
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'farms' AND column_name = 'coming_soon_label'
  ) THEN
    ALTER TABLE farms ADD COLUMN coming_soon_label text DEFAULT 'قريبًا';
  END IF;
END $$;

-- إضافة حقل وصف البطاقة
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'farms' AND column_name = 'card_description'
  ) THEN
    ALTER TABLE farms ADD COLUMN card_description text;
  END IF;
END $$;

-- تحديث البيانات الموجودة
UPDATE farms 
SET coming_soon_label = 'قريبًا'
WHERE coming_soon_label IS NULL;

COMMENT ON COLUMN farms.internal_cost_per_tree IS 'السعر الداخلي الفعلي للشجرة - للتحليل الإداري فقط، لا يظهر للمستخدمين';
COMMENT ON COLUMN farms.coming_soon_label IS 'عنوان إضافي يظهر في بطاقة المزرعة - قابل للتخصيص';
COMMENT ON COLUMN farms.card_description IS 'وصف مختصر يظهر أسفل بطاقة المزرعة في الواجهة الرئيسية';