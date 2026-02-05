/*
  # ربط المؤثرين بحسابات المستخدمين

  ## الهدف
  
  السماح للمؤثرين بالوصول إلى لوحتهم الشخصية من حساباتهم
  
  ## التغييرات
  
  1. إضافة حقل user_id إلى جدول influencer_partners
  2. السماح للحقل بأن يكون NULL (حتى لا يؤثر على المؤثرين الحاليين)
  3. إضافة constraint UNIQUE (user_id) - مستخدم واحد = مؤثر واحد فقط
  4. إضافة index للأداء
  
  ## الاستخدام
  
  - المؤثرون الحاليون: user_id = NULL
  - المؤثرون الجدد: يمكن ربطهم بحسابات مستخدمين
  - عند الربط: المستخدم يرى لوحة المؤثر في حسابه
*/

-- إضافة حقل user_id
ALTER TABLE influencer_partners
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- إضافة constraint UNIQUE (مستخدم واحد = مؤثر واحد)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'influencer_partners_user_id_unique'
  ) THEN
    ALTER TABLE influencer_partners
    ADD CONSTRAINT influencer_partners_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Index للأداء
CREATE INDEX IF NOT EXISTS idx_influencer_partners_user_id 
ON influencer_partners(user_id) 
WHERE user_id IS NOT NULL;

-- Comment
COMMENT ON COLUMN influencer_partners.user_id IS 'ربط المؤثر بحساب مستخدم (اختياري) - للوصول إلى لوحة المؤثر من الحساب';

-- تحديث RLS: السماح للمؤثر برؤية بياناته الخاصة
DROP POLICY IF EXISTS "Influencers can view own data" ON influencer_partners;

CREATE POLICY "Influencers can view own data"
ON influencer_partners
FOR SELECT
TO authenticated
USING (user_id = auth.uid());