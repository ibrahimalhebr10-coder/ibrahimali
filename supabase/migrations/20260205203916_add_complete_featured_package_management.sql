/*
  # إدارة كاملة للباقة المميزة

  ## المشكلة
  - الإعدادات الحالية تحتوي فقط على مظهر الباقة (لون، نص)
  - لا توجد إدارة فعلية للباقة (سعر، مدة، مميزات)
  - نص "شحن مجاني" لا معنى له في سياق المشروع

  ## الحل
  إضافة حقول كاملة لإدارة الباقة المميزة:
  - السعر
  - مدة العقد (سنوات)
  - المدة المجانية (أشهر إضافية)
  - اسم الباقة
  - وصف مفصل
  - نوع المزية (مدة مجانية، خصم، إلخ)

  ## الحقول الجديدة
  1. `featured_package_name` - اسم الباقة المميزة
  2. `featured_package_price` - السعر للشجرة الواحدة
  3. `featured_package_contract_duration` - مدة العقد بالسنوات
  4. `featured_package_bonus_duration` - المدة المجانية بالأشهر
  5. `featured_package_description` - وصف مفصل للباقة
  6. `featured_package_highlight_text` - النص البارز (مثل: "+6 أشهر مجاناً")

  ## حذف الحقول القديمة
  - سيتم حذف حقل `featured_package_benefit_description` (كان: "الشحن مجاني")
  - سيتم حذف حقل `featured_package_benefit_type` (كان: "free_shipping")
*/

-- حذف الحقول القديمة التي لا معنى لها
ALTER TABLE influencer_settings
DROP COLUMN IF EXISTS featured_package_benefit_description,
DROP COLUMN IF EXISTS featured_package_benefit_type;

-- إضافة الحقول الجديدة لإدارة الباقة المميزة
ALTER TABLE influencer_settings
ADD COLUMN IF NOT EXISTS featured_package_name text DEFAULT 'الباقة الذهبية',
ADD COLUMN IF NOT EXISTS featured_package_price numeric(10,2) DEFAULT 150.00,
ADD COLUMN IF NOT EXISTS featured_package_contract_duration integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS featured_package_bonus_duration integer DEFAULT 6,
ADD COLUMN IF NOT EXISTS featured_package_description text DEFAULT 'باقة خاصة لعملاء شركاء المسيرة مع مميزات إضافية',
ADD COLUMN IF NOT EXISTS featured_package_highlight_text text DEFAULT '+6 أشهر إضافية مجاناً';

-- إضافة تعليقات
COMMENT ON COLUMN influencer_settings.featured_package_name IS 'اسم الباقة المميزة';
COMMENT ON COLUMN influencer_settings.featured_package_price IS 'السعر للشجرة الواحدة (ريال سعودي)';
COMMENT ON COLUMN influencer_settings.featured_package_contract_duration IS 'مدة العقد بالسنوات';
COMMENT ON COLUMN influencer_settings.featured_package_bonus_duration IS 'المدة المجانية الإضافية بالأشهر';
COMMENT ON COLUMN influencer_settings.featured_package_description IS 'وصف مفصل للباقة المميزة';
COMMENT ON COLUMN influencer_settings.featured_package_highlight_text IS 'النص البارز الذي يظهر على الباقة (مثل: +6 أشهر مجاناً)';

-- تحديث السجل الموجود بالقيم الافتراضية
UPDATE influencer_settings
SET 
  featured_package_name = COALESCE(featured_package_name, 'الباقة الذهبية'),
  featured_package_price = COALESCE(featured_package_price, 150.00),
  featured_package_contract_duration = COALESCE(featured_package_contract_duration, 10),
  featured_package_bonus_duration = COALESCE(featured_package_bonus_duration, 6),
  featured_package_description = COALESCE(featured_package_description, 'باقة خاصة لعملاء شركاء المسيرة مع مميزات إضافية'),
  featured_package_highlight_text = COALESCE(featured_package_highlight_text, '+6 أشهر إضافية مجاناً')
WHERE id IS NOT NULL;
