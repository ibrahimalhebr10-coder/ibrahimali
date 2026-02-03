/*
  # توضيح: الأصول الاستثمارية تُبنى من الحجوزات
  
  ## المعمارية الصحيحة
  
  ### التدفق:
  1. المستخدم يحجز أشجاراً من المزرعة (خزان)
  2. عند الحجز، يختار المسار: agricultural أو investment
  3. يتم إنشاء سجل reservation مع path_type
  4. الأشجار تُسحب من خزان المزرعة
  5. الأصول الاستثمارية تُبنى تلقائياً من الحجوزات الاستثمارية
  
  ### جدول investment_agricultural_assets
  - هو "عرض مُعزز" للحجوزات الاستثمارية
  - يُبنى تلقائياً من reservations حيث path_type = 'investment'
  - يسمح بإضافة معلومات إضافية (ملاحظات، تصنيفات)
  - ولكن المصدر دائماً هو الحجز
  
  ### قسم "مزرعتي" في الأدمن
  - لا يسحب أشجاراً من الخزان
  - لا ينشئ حجوزات
  - يدير فقط: طريقة عرض التجربة (Experience Builder)
  
  ## التغييرات
  
  1. إضافة دالة تلقائية لإنشاء أصول استثمارية من الحجوزات
  2. إضافة trigger لتشغيلها عند إنشاء حجز استثماري
  3. توضيح العلاقات في التعليقات
*/

-- دالة لإنشاء أصول استثمارية تلقائياً من الحجوزات
CREATE OR REPLACE FUNCTION create_investment_assets_from_reservation()
RETURNS TRIGGER AS $$
BEGIN
  -- فقط للحجوزات الاستثمارية النشطة
  IF NEW.path_type = 'investment' AND NEW.status = 'active' THEN
    
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
        'متنوع', -- سيتم تحديثه حسب reservation_items
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

-- Trigger لإنشاء الأصول تلقائياً
DROP TRIGGER IF EXISTS auto_create_investment_assets ON reservations;
CREATE TRIGGER auto_create_investment_assets
  AFTER INSERT OR UPDATE OF status ON reservations
  FOR EACH ROW
  WHEN (NEW.path_type = 'investment' AND NEW.status = 'active')
  EXECUTE FUNCTION create_investment_assets_from_reservation();

-- تحديث التعليقات للتوضيح
COMMENT ON FUNCTION create_investment_assets_from_reservation() IS
'دالة تلقائية تُنشئ أصولاً استثمارية من الحجوزات الاستثمارية النشطة.
تُنفذ تلقائياً عند تفعيل حجز استثماري.
المزرعة = خزان، الحجز = السحب، الأصول = العرض المُعزز.';

COMMENT ON COLUMN investment_agricultural_assets.contract_id IS
'معرف الحجز (reservation_id) الذي سُحبت منه الأشجار.
المصدر الأساسي للأصل. يجب أن يشير دائماً إلى حجز استثماري.';

COMMENT ON COLUMN investment_agricultural_assets.farm_id IS
'معرف المزرعة (الخزان) الذي سُحبت منه الأشجار.
يأتي من الحجز. المزرعة = خزان محايد فقط.';

-- إنشاء view لتسهيل قراءة الأصول مع معلومات الحجز
CREATE OR REPLACE VIEW investment_assets_with_reservation AS
SELECT 
  ia.*,
  r.status as reservation_status,
  r.path_type,
  r.total_price as contract_total_price,
  r.created_at as contract_date,
  f.name_ar as farm_name,
  f.location as farm_location
FROM investment_agricultural_assets ia
LEFT JOIN reservations r ON ia.contract_id = r.id
LEFT JOIN farms f ON ia.farm_id = f.id;

COMMENT ON VIEW investment_assets_with_reservation IS
'عرض شامل للأصول الاستثمارية مع معلومات الحجز والمزرعة.
يوضح العلاقة: خزان → حجز → أصل → تجربة.';
