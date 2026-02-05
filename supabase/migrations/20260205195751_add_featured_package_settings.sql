/*
  # إعدادات الباقة المميزة (Featured Package)

  ## الهدف
  
  إضافة إعدادات التحكم بالباقة المميزة التي تظهر للمستخدمين عند إدخال كود المؤثر
  
  ## القواعد الحاكمة
  
  1. الباقة المميزة عنصر تسويقي مؤقت (Temporary Overlay)
  2. ليست باقة دائمة ولا تُخزن مع الباقات
  3. تظهر فقط عند إدخال كود المؤثر في صفحة المزرعة
  4. تختفي عند: إعادة تحميل، رجوع، تغيير مزرعة، مسح الحقل
  
  ## الحقول المضافة
  
  1. `featured_package_border_style` - نمط الإطار (solid, dashed, double, gradient)
  2. `featured_package_congratulation_text` - نص التهنئة (مثل: "مبرووووك!")
  3. `featured_package_benefit_description` - وصف المزية (مثل: "الشحن مجاني")
  4. `featured_package_benefit_type` - نوع المزية (free_shipping, discount, bonus_trees, etc.)
  
  ## ملاحظات
  
  - تُدار من: لوحة التحكم → إدارة التسويق → شركاء المسيرة
  - لا تؤثر على الباقات الأخرى
  - لا تُحفظ في نموذج المزرعة
*/

-- إضافة حقول الباقة المميزة
ALTER TABLE influencer_settings
ADD COLUMN IF NOT EXISTS featured_package_border_style text DEFAULT 'solid' CHECK (featured_package_border_style IN ('solid', 'dashed', 'double', 'gradient')),
ADD COLUMN IF NOT EXISTS featured_package_congratulation_text text DEFAULT 'مبرووووك! 🎉',
ADD COLUMN IF NOT EXISTS featured_package_benefit_description text DEFAULT 'الشحن مجاني على هذه الباقة',
ADD COLUMN IF NOT EXISTS featured_package_benefit_type text DEFAULT 'free_shipping' CHECK (featured_package_benefit_type IN ('free_shipping', 'discount', 'bonus_trees', 'priority_support', 'custom'));

-- إضافة تعليقات
COMMENT ON COLUMN influencer_settings.featured_package_border_style IS 'نمط إطار الباقة المميزة (solid, dashed, double, gradient)';
COMMENT ON COLUMN influencer_settings.featured_package_congratulation_text IS 'نص التهنئة الذي يظهر على الباقة المميزة';
COMMENT ON COLUMN influencer_settings.featured_package_benefit_description IS 'وصف المزية التي يحصل عليها المستخدم';
COMMENT ON COLUMN influencer_settings.featured_package_benefit_type IS 'نوع المزية (شحن مجاني، خصم، أشجار إضافية، إلخ)';

-- تحديث السجل الموجود بالقيم الافتراضية
UPDATE influencer_settings
SET 
  featured_package_border_style = COALESCE(featured_package_border_style, 'solid'),
  featured_package_congratulation_text = COALESCE(featured_package_congratulation_text, 'مبرووووك! 🎉'),
  featured_package_benefit_description = COALESCE(featured_package_benefit_description, 'الشحن مجاني على هذه الباقة'),
  featured_package_benefit_type = COALESCE(featured_package_benefit_type, 'free_shipping')
WHERE id IS NOT NULL;