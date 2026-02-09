/*
  # إضافة نظام الأكواد لشركاء النجاح

  ## التغييرات
  
  1. إضافة حقل partner_code
     - كود فريد لكل شريك
     - يستخدم بدلاً من الاسم للدقة
     - حروف كبيرة وأرقام فقط
  
  2. دالة توليد الكود التلقائي
     - توليد كود من الاسم + 4 أرقام عشوائية
     - مثال: NOWAL4521, AHMED7834
     - فحص التفرد تلقائياً
  
  3. Trigger للتوليد التلقائي
     - يعمل عند إدراج شريك جديد
     - ينشئ كود تلقائياً إذا لم يُدخل
  
  4. الأمان
     - قيد التفرد (UNIQUE)
     - فهرس للبحث السريع
     - RLS policies محدثة
*/

-- 1. إضافة حقل partner_code
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencer_partners' AND column_name = 'partner_code'
  ) THEN
    ALTER TABLE influencer_partners
    ADD COLUMN partner_code TEXT;
  END IF;
END $$;

-- 2. دالة توليد الكود التلقائي
CREATE OR REPLACE FUNCTION generate_partner_code(partner_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_code TEXT;
  random_suffix TEXT;
  final_code TEXT;
  attempt INT := 0;
  max_attempts INT := 100;
BEGIN
  -- تنظيف الاسم وأخذ أول 6 حروف
  base_code := UPPER(SUBSTRING(REPLACE(REPLACE(partner_name, ' ', ''), '_', ''), 1, 6));
  
  -- التأكد من وجود حروف
  IF base_code = '' THEN
    base_code := 'PARTNER';
  END IF;
  
  -- محاولة توليد كود فريد
  LOOP
    -- توليد 4 أرقام عشوائية
    random_suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    final_code := base_code || random_suffix;
    
    -- فحص التفرد
    IF NOT EXISTS (
      SELECT 1 FROM influencer_partners WHERE partner_code = final_code
    ) THEN
      RETURN final_code;
    END IF;
    
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'فشل توليد كود فريد بعد % محاولة', max_attempts;
    END IF;
  END LOOP;
END;
$$;

-- 3. توليد أكواد للشركاء الموجودين
UPDATE influencer_partners
SET partner_code = generate_partner_code(name)
WHERE partner_code IS NULL;

-- 4. إضافة قيد التفرد
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'influencer_partners_partner_code_unique'
  ) THEN
    ALTER TABLE influencer_partners
    ADD CONSTRAINT influencer_partners_partner_code_unique UNIQUE (partner_code);
  END IF;
END $$;

-- 5. جعل الحقل إلزامي
ALTER TABLE influencer_partners
ALTER COLUMN partner_code SET NOT NULL;

-- 6. إضافة فهرس للأداء
CREATE INDEX IF NOT EXISTS idx_influencer_partners_partner_code 
ON influencer_partners(partner_code);

-- 7. Trigger للتوليد التلقائي عند الإدراج
CREATE OR REPLACE FUNCTION auto_generate_partner_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- إذا لم يُدخل كود، توليده تلقائياً
  IF NEW.partner_code IS NULL OR NEW.partner_code = '' THEN
    NEW.partner_code := generate_partner_code(NEW.name);
  ELSE
    -- تحويل الكود المُدخل لحروف كبيرة
    NEW.partner_code := UPPER(NEW.partner_code);
  END IF;
  
  RETURN NEW;
END;
$$;

-- حذف trigger القديم إن وُجد
DROP TRIGGER IF EXISTS trigger_auto_generate_partner_code ON influencer_partners;

-- إنشاء trigger جديد
CREATE TRIGGER trigger_auto_generate_partner_code
  BEFORE INSERT ON influencer_partners
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_partner_code();

-- 8. تحديث RLS policies لدعم البحث بالكود
-- السماح للمستخدمين المجهولين بالبحث عن الشركاء بالكود
DROP POLICY IF EXISTS "Allow anonymous read active influencers by code" ON influencer_partners;
CREATE POLICY "Allow anonymous read active influencers by code"
  ON influencer_partners
  FOR SELECT
  TO anon
  USING (is_active = true AND status = 'active');

-- السماح للمستخدمين المصادقين بالبحث عن الشركاء بالكود
DROP POLICY IF EXISTS "Allow authenticated read active influencers by code" ON influencer_partners;
CREATE POLICY "Allow authenticated read active influencers by code"
  ON influencer_partners
  FOR SELECT
  TO authenticated
  USING (is_active = true AND status = 'active');
