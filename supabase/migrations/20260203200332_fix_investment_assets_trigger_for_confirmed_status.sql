/*
  # تحديث Trigger لإنشاء الأصول الاستثمارية
  
  ## المشكلة
  الـ Trigger السابق كان مضبوطاً على status = 'active'
  ولكن جدول reservations لا يقبل 'active' في القيود
  القيم المقبولة: 'temporary', 'pending', 'waiting_for_payment', 
  'payment_submitted', 'paid', 'confirmed', 'completed', 
  'transferred_to_harvest', 'cancelled'
  
  ## الحل
  تحديث الـ Trigger ليعمل مع:
  - status = 'confirmed' (مؤكد)
  - status = 'paid' (مدفوع)
  - status = 'completed' (مكتمل)
  
  ## التغييرات
  إعادة إنشاء الـ Trigger بشروط صحيحة
*/

-- حذف الـ Trigger القديم
DROP TRIGGER IF EXISTS auto_create_investment_assets ON reservations;

-- إنشاء Trigger جديد بشروط صحيحة
CREATE TRIGGER auto_create_investment_assets
  AFTER INSERT OR UPDATE OF status ON reservations
  FOR EACH ROW
  WHEN (
    NEW.path_type = 'investment' 
    AND NEW.status IN ('confirmed', 'paid', 'completed')
  )
  EXECUTE FUNCTION create_investment_assets_from_reservation();

COMMENT ON TRIGGER auto_create_investment_assets ON reservations IS
'ينشئ أصولاً استثمارية تلقائياً عند تأكيد أو دفع حجز استثماري.
يعمل مع الحالات: confirmed, paid, completed';
