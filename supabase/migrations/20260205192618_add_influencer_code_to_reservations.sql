/*
  # إضافة كود المؤثر إلى الحجوزات

  ## التغييرات

  1. الحقول الجديدة في `reservations`
    - `influencer_code` (text, nullable) - كود المؤثر المُدخل من العميل
    - يُحفظ عند إنشاء الحجز
    - غير قابل للتعديل بعد الحفظ
    - يُستخدم لربط الحجز بالمؤثر بعد الدفع

  ## ملاحظات

  - الحقل اختياري (nullable) لأن ليس كل الحجوزات تأتي من مؤثرين
  - يُحفظ كما هو من sessionStorage
  - سيُستخدم لاحقاً للبحث عن المؤثر وتحديث إحصائياته
*/

-- إضافة حقل influencer_code إلى جدول reservations
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS influencer_code text;

-- إنشاء index لتسريع البحث عن الحجوزات بكود مؤثر معين
CREATE INDEX IF NOT EXISTS idx_reservations_influencer_code
ON reservations(influencer_code)
WHERE influencer_code IS NOT NULL;

-- إضافة comment للتوضيح
COMMENT ON COLUMN reservations.influencer_code IS 'كود المؤثر المُدخل من العميل - يُحفظ عند إنشاء الحجز ويُستخدم لربط الحجز بالمؤثر بعد الدفع';