/*
  # إنشاء مخزن الميديا للصيانة

  ## الهدف
  إنشاء bucket لتخزين صور وفيديوهات الصيانة
  - يمكن الرفع من أي جهاز (موبايل/كمبيوتر)
  - الوصول محصور بالإدارة فقط
*/

-- إنشاء bucket للميديا
INSERT INTO storage.buckets (id, name, public)
VALUES ('maintenance-media', 'maintenance-media', false)
ON CONFLICT (id) DO NOTHING;

-- سياسة الرفع: الإدارة فقط
CREATE POLICY "Admins can upload maintenance media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'maintenance-media' AND
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
  )
);

-- سياسة القراءة: الإدارة فقط
CREATE POLICY "Admins can view maintenance media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'maintenance-media' AND
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
  )
);

-- سياسة الحذف: الإدارة فقط
CREATE POLICY "Admins can delete maintenance media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'maintenance-media' AND
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
  )
);
