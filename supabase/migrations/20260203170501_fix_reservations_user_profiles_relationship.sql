/*
  # إصلاح العلاقة بين جدول الحجوزات وملفات المستخدمين
  
  1. التغييرات
    - إضافة foreign key constraint بين reservations.user_id و user_profiles.id
    - هذا يسمح لـ Supabase باستخدام automatic joins
    
  2. الأمان
    - لا يؤثر على RLS policies الموجودة
    - يحسن من integrit constraint
    
  3. الأداء
    - يسهل القيام بـ joins بين الجداول
    - يحسن من أداء الاستعلامات
*/

-- إضافة foreign key constraint إذا لم يكن موجوداً
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reservations_user_id_fkey' 
    AND table_name = 'reservations'
  ) THEN
    ALTER TABLE reservations
    ADD CONSTRAINT reservations_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES user_profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- إنشاء index لتحسين أداء الـ joins
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
