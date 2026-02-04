/*
  # إتاحة الوصول للسجلات المنشورة للمستخدمين

  ## الهدف
  ربط منطق النشر (published status) بالاستهلاك الفعلي
  - السجلات بحالة "published" تصبح مرئية للمستخدمين العاديين
  - السجلات بحالة "draft" أو "completed" تبقى للإدارة فقط

  ## التغييرات
  1. إضافة سياسات RLS للقراءة للمستخدمين العاديين
     - السجلات المنشورة فقط
     - المراحل المرتبطة بسجلات منشورة
     - الملفات المرتبطة بسجلات منشورة
  2. عرض الرسوم المنشورة للمستخدمين

  ## الأمان
  - المستخدمون العاديون: قراءة فقط للمنشور
  - الإدارة: كامل الصلاحيات على كل الحالات
*/

-- =====================================================
-- 1. السماح للمستخدمين بقراءة السجلات المنشورة
-- =====================================================
CREATE POLICY "Users can view published maintenance records"
  ON maintenance_records
  FOR SELECT
  TO authenticated
  USING (status = 'published');

-- =====================================================
-- 2. السماح للمستخدمين بقراءة مراحل السجلات المنشورة
-- =====================================================
CREATE POLICY "Users can view stages of published records"
  ON maintenance_stages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_records
      WHERE maintenance_records.id = maintenance_stages.maintenance_id
      AND maintenance_records.status = 'published'
    )
  );

-- =====================================================
-- 3. السماح للمستخدمين بقراءة ملفات السجلات المنشورة
-- =====================================================
CREATE POLICY "Users can view media of published records"
  ON maintenance_media
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_records
      WHERE maintenance_records.id = maintenance_media.maintenance_id
      AND maintenance_records.status = 'published'
    )
  );

-- =====================================================
-- 4. السماح للمستخدمين بقراءة رسوم السجلات المنشورة
-- =====================================================
CREATE POLICY "Users can view fees of published records"
  ON maintenance_fees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_records
      WHERE maintenance_records.id = maintenance_fees.maintenance_id
      AND maintenance_records.status = 'published'
    )
  );

-- =====================================================
-- 5. السماح للمستخدمين بقراءة التجميعات المالية المنشورة
-- =====================================================
CREATE POLICY "Users can view published grouped fees"
  ON maintenance_fees_grouped
  FOR SELECT
  TO authenticated
  USING (status = 'published');

-- =====================================================
-- 6. السماح للمستخدمين بقراءة ربط السجلات بالتجميعات
-- =====================================================
CREATE POLICY "Users can view fee records links"
  ON maintenance_fee_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_fees_grouped
      WHERE maintenance_fees_grouped.id = maintenance_fee_records.fee_id
      AND maintenance_fees_grouped.status = 'published'
    )
  );

-- =====================================================
-- 7. السماح للمستخدمين بقراءة ملفات الصيانة من Storage
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can view published maintenance media files'
  ) THEN
    CREATE POLICY "Users can view published maintenance media files"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'maintenance-media'
      );
  END IF;
END $$;

COMMENT ON POLICY "Users can view published maintenance records" ON maintenance_records IS
'المستخدمون العاديون يمكنهم رؤية السجلات المنشورة فقط - النشر يعني جاهز للاستهلاك';

COMMENT ON POLICY "Users can view published grouped fees" ON maintenance_fees_grouped IS
'المستخدمون يمكنهم رؤية التجميعات المالية المنشورة فقط';
