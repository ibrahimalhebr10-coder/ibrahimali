/*
  # تصحيح الحذف المتسلسل للمزارع

  ## المشكلة
  - عند محاولة حذف مزرعة لها حجوزات، يظهر خطأ foreign key constraint
  - الـ CASCADE قد لا يكون مطبق بشكل صحيح على جميع العلاقات

  ## الحل
  1. إعادة إنشاء foreign key constraints مع ON DELETE CASCADE
  2. التأكد من أن جميع الجداول المرتبطة تستخدم CASCADE

  ## الجداول المتأثرة
  - reservations
  - reservation_items
  - farm_tasks
  - farm_contracts
  - investor_messages
  - messages (related_farm_id)

  ## الأمان
  - جميع الصلاحيات الموجودة تبقى كما هي
  - فقط تحديث الـ constraints
*/

-- =========================================
-- 1. RESERVATIONS TABLE
-- =========================================

-- حذف الـ constraint القديم إن وجد
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reservations_farm_id_fkey' 
    AND table_name = 'reservations'
  ) THEN
    ALTER TABLE reservations DROP CONSTRAINT reservations_farm_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_reservations_farm_id' 
    AND table_name = 'reservations'
  ) THEN
    ALTER TABLE reservations DROP CONSTRAINT fk_reservations_farm_id;
  END IF;
END $$;

-- إضافة constraint جديد مع CASCADE
ALTER TABLE reservations
  ADD CONSTRAINT reservations_farm_id_fkey
  FOREIGN KEY (farm_id) 
  REFERENCES farms(id) 
  ON DELETE CASCADE;

-- =========================================
-- 2. RESERVATION_ITEMS TABLE
-- =========================================

-- التأكد من أن reservation_items تستخدم CASCADE
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reservation_items_reservation_id_fkey' 
    AND table_name = 'reservation_items'
  ) THEN
    ALTER TABLE reservation_items DROP CONSTRAINT reservation_items_reservation_id_fkey;
  END IF;
END $$;

ALTER TABLE reservation_items
  ADD CONSTRAINT reservation_items_reservation_id_fkey
  FOREIGN KEY (reservation_id) 
  REFERENCES reservations(id) 
  ON DELETE CASCADE;

-- =========================================
-- 3. FARM_TASKS TABLE
-- =========================================

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'farm_tasks_farm_id_fkey' 
    AND table_name = 'farm_tasks'
  ) THEN
    ALTER TABLE farm_tasks DROP CONSTRAINT farm_tasks_farm_id_fkey;
  END IF;
END $$;

ALTER TABLE farm_tasks
  ADD CONSTRAINT farm_tasks_farm_id_fkey
  FOREIGN KEY (farm_id) 
  REFERENCES farms(id) 
  ON DELETE CASCADE;

-- =========================================
-- 4. FARM_CONTRACTS TABLE
-- =========================================

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'farm_contracts_farm_id_fkey' 
    AND table_name = 'farm_contracts'
  ) THEN
    ALTER TABLE farm_contracts DROP CONSTRAINT farm_contracts_farm_id_fkey;
  END IF;
END $$;

ALTER TABLE farm_contracts
  ADD CONSTRAINT farm_contracts_farm_id_fkey
  FOREIGN KEY (farm_id) 
  REFERENCES farms(id) 
  ON DELETE CASCADE;

-- =========================================
-- 5. INVESTOR_MESSAGES TABLE
-- =========================================

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'investor_messages_farm_id_fkey' 
    AND table_name = 'investor_messages'
  ) THEN
    ALTER TABLE investor_messages DROP CONSTRAINT investor_messages_farm_id_fkey;
  END IF;
END $$;

ALTER TABLE investor_messages
  ADD CONSTRAINT investor_messages_farm_id_fkey
  FOREIGN KEY (farm_id) 
  REFERENCES farms(id) 
  ON DELETE CASCADE;

-- =========================================
-- 6. MESSAGES TABLE (related_farm_id)
-- =========================================

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_related_farm_id_fkey' 
    AND table_name = 'messages'
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT messages_related_farm_id_fkey;
  END IF;
END $$;

-- SET NULL بدلاً من CASCADE لأن الرسائل قد تكون عامة
ALTER TABLE messages
  ADD CONSTRAINT messages_related_farm_id_fkey
  FOREIGN KEY (related_farm_id) 
  REFERENCES farms(id) 
  ON DELETE SET NULL;

-- =========================================
-- التحقق النهائي
-- =========================================

-- إضافة تعليقات توضيحية
COMMENT ON CONSTRAINT reservations_farm_id_fkey ON reservations IS 
  'CASCADE: حذف المزرعة يحذف جميع الحجوزات المرتبطة';

COMMENT ON CONSTRAINT farm_tasks_farm_id_fkey ON farm_tasks IS 
  'CASCADE: حذف المزرعة يحذف جميع المهام المرتبطة';

COMMENT ON CONSTRAINT farm_contracts_farm_id_fkey ON farm_contracts IS 
  'CASCADE: حذف المزرعة يحذف جميع العقود المرتبطة';

COMMENT ON CONSTRAINT investor_messages_farm_id_fkey ON investor_messages IS 
  'CASCADE: حذف المزرعة يحذف جميع الرسائل المرتبطة';

COMMENT ON CONSTRAINT messages_related_farm_id_fkey ON messages IS 
  'SET NULL: حذف المزرعة يجعل related_farm_id = NULL في الرسائل العامة';
