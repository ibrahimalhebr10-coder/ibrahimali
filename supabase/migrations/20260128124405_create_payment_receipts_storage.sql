/*
  # Storage Bucket لإيصالات الدفع

  ## النظرة العامة
  إنشاء bucket لحفظ ملفات إيصالات التحويلات البنكية

  ## الإعدادات
  - الاسم: payment-receipts
  - عام: لا (private)
  - أنواع الملفات المسموحة: images, PDF
  - الحد الأقصى للملف: 5MB

  ## الصلاحيات
  - المستثمر: يمكنه رفع ورؤية ملفاته فقط
  - الإدارة المالية: يمكنها رؤية جميع الملفات
*/

-- إنشاء bucket لإيصالات الدفع
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  false,
  5242880,
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: المستثمر يمكنه رفع ملفاته
CREATE POLICY "Users can upload their own receipts"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: المستثمر يمكنه رؤية ملفاته
CREATE POLICY "Users can view their own receipts"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: المستثمر يمكنه حذف ملفاته (قبل المراجعة)
CREATE POLICY "Users can delete their own receipts"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'payment-receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: الإدارة المالية يمكنها رؤية جميع الملفات
CREATE POLICY "Financial managers can view all receipts"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-receipts' AND
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role IN ('super_admin', 'financial_manager')
      AND admins.is_active = true
    )
  );
