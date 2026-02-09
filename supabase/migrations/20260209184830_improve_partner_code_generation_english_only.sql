/*
  # تحسين توليد الأكواد - حروف إنجليزية فقط

  ## التغييرات
  
  1. تحديث دالة التوليد
     - تحويل الحروف العربية إلى إنجليزية
     - استخدام transliteration بسيط
     - توليد أكواد احترافية
  
  2. إعادة توليد الأكواد الموجودة
     - تحديث جميع الأكواد لتكون بالإنجليزية
     - الحفاظ على التفرد
*/

-- تحديث دالة التوليد لدعم الحروف الإنجليزية فقط
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
  clean_name TEXT;
BEGIN
  -- تنظيف الاسم: إزالة المسافات والأحرف الخاصة
  clean_name := REPLACE(REPLACE(REPLACE(partner_name, ' ', ''), '_', ''), '-', '');
  
  -- تحويل الحروف العربية الشائعة إلى إنجليزية (transliteration بسيط)
  clean_name := TRANSLATE(clean_name,
    'ابتثجحخدذرزسشصضطظعغفقكلمنهويئءآأإة',
    'ABTTHGKHDTHRZSSSDTTHGHFQKLMNHWYAAAAAA'
  );
  
  -- إزالة أي حروف غير إنجليزية متبقية
  clean_name := REGEXP_REPLACE(clean_name, '[^A-Za-z0-9]', '', 'g');
  
  -- أخذ أول 6 حروف إنجليزية
  base_code := UPPER(SUBSTRING(clean_name, 1, 6));
  
  -- إذا كان الاسم قصير جداً أو لا يحتوي على حروف إنجليزية
  IF LENGTH(base_code) < 3 THEN
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
      -- في حالة الفشل، استخدم timestamp
      final_code := base_code || LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 4, '0');
      RETURN final_code;
    END IF;
  END LOOP;
END;
$$;

-- إعادة توليد الأكواد للشركاء الموجودين بحروف إنجليزية
DO $$
DECLARE
  partner_record RECORD;
  new_code TEXT;
BEGIN
  FOR partner_record IN 
    SELECT id, name, partner_code 
    FROM influencer_partners
  LOOP
    -- توليد كود جديد
    new_code := generate_partner_code(partner_record.name);
    
    -- تحديث الكود
    UPDATE influencer_partners
    SET partner_code = new_code
    WHERE id = partner_record.id;
    
    RAISE NOTICE 'Updated partner % from % to %', 
      partner_record.name, partner_record.partner_code, new_code;
  END LOOP;
END $$;
