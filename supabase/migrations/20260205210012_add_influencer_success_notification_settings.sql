/*
  # إضافة إدارة إشعار نجاح كود المؤثر

  1. التغييرات
    - إضافة حقول جديدة في system_settings لإدارة محتوى إشعار النجاح
    - هذه الحقول ستظهر في واجهة إدارة الباقة المميزة
    - يتم قراءتها عند إدخال كود مؤثر صحيح
  
  2. الحقول الجديدة
    - influencer_success_title: عنوان الإشعار الرئيسي
    - influencer_success_subtitle: العنوان الفرعي
    - influencer_success_description: وصف المزايا
    - influencer_success_benefits: قائمة المزايا (JSON)
  
  3. القيم الافتراضية
    - تُستخدم القيم الحالية من الكود كقيم افتراضية
    - يمكن للمسؤول تعديلها من لوحة التحكم
  
  4. الفائدة
    - عند تعديل الباقة المميزة، يتم تعديل الإشعار أيضاً
    - تطابق كامل بين الإشعار والباقة المميزة
    - إدارة مركزية من مكان واحد
*/

-- إضافة حقول إدارة إشعار النجاح
DO $$
BEGIN
  -- عنوان الإشعار الرئيسي
  IF NOT EXISTS (
    SELECT 1 FROM system_settings WHERE key = 'influencer_success_title'
  ) THEN
    INSERT INTO system_settings (key, value, description)
    VALUES (
      'influencer_success_title',
      'مبروووك! 🎉',
      'عنوان إشعار النجاح عند إدخال كود مؤثر صحيح'
    );
  END IF;

  -- العنوان الفرعي
  IF NOT EXISTS (
    SELECT 1 FROM system_settings WHERE key = 'influencer_success_subtitle'
  ) THEN
    INSERT INTO system_settings (key, value, description)
    VALUES (
      'influencer_success_subtitle',
      'تم فتح باقة مميزة خصيصاً لك!',
      'العنوان الفرعي لإشعار النجاح'
    );
  END IF;

  -- الوصف الرئيسي
  IF NOT EXISTS (
    SELECT 1 FROM system_settings WHERE key = 'influencer_success_description'
  ) THEN
    INSERT INTO system_settings (key, value, description)
    VALUES (
      'influencer_success_description',
      'احصل على 6 أشهر إضافية مجاناً',
      'الوصف البارز للميزة الرئيسية'
    );
  END IF;

  -- قائمة المزايا (JSON)
  IF NOT EXISTS (
    SELECT 1 FROM system_settings WHERE key = 'influencer_success_benefits'
  ) THEN
    INSERT INTO system_settings (key, value, description)
    VALUES (
      'influencer_success_benefits',
      '["6 أشهر إضافية على مدة العقد", "نفس السعر بدون زيادة", "أولوية في الخدمات"]',
      'قائمة مزايا الباقة المميزة (JSON array)'
    );
  END IF;
END $$;
