/*
  # تحديث function لإنشاء الأصول الاستثمارية
  
  ## المشكلة
  الـ function كانت تفحص status = 'active'
  ولكن القيم المقبولة هي: confirmed, paid, completed
  
  ## الحل
  تحديث الفحص داخل الـ function ليتوافق مع القيم المقبولة
  
  ## التغييرات
  تحديث شرط IF ليتحقق من الحالات الصحيحة
*/

CREATE OR REPLACE FUNCTION create_investment_assets_from_reservation()
RETURNS TRIGGER AS $$
BEGIN
  -- فقط للحجوزات الاستثمارية المؤكدة/المدفوعة/المكتملة
  IF NEW.path_type = 'investment' 
     AND NEW.status IN ('confirmed', 'paid', 'completed') THEN
    
    -- التحقق من عدم وجود أصل مسبق لهذا الحجز
    IF NOT EXISTS (
      SELECT 1 FROM investment_agricultural_assets 
      WHERE contract_id = NEW.id
    ) THEN
      
      -- إنشاء أصل استثماري من الحجز
      INSERT INTO investment_agricultural_assets (
        user_id,
        farm_id,
        contract_id,
        tree_type,
        quantity,
        acquisition_date,
        notes
      )
      SELECT 
        NEW.user_id,
        NEW.farm_id,
        NEW.id,
        'متنوع',
        NEW.total_trees,
        NEW.created_at::date,
        'تم الإنشاء تلقائياً من الحجز'
      ;
      
      -- إنشاء حالة استثمار افتراضية
      INSERT INTO investment_status_tracking (
        user_id,
        contract_id,
        current_status,
        status_start_date,
        notes
      )
      VALUES (
        NEW.user_id,
        NEW.id,
        'نشط',
        NEW.created_at::date,
        'تم الإنشاء تلقائياً عند تفعيل الحجز'
      )
      ON CONFLICT DO NOTHING;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_investment_assets_from_reservation() IS
'دالة تلقائية تُنشئ أصولاً استثمارية من الحجوزات الاستثمارية.
تعمل مع الحالات: confirmed (مؤكد), paid (مدفوع), completed (مكتمل).
المزرعة = خزان، الحجز = السحب، الأصول = العرض المُعزز.';
