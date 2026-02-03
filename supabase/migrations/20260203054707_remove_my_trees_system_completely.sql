/*
  # حذف نظام متابعة أشجاري بالكامل

  1. Changes
    - حذف جدول `tree_operations` والبيانات المرتبطة به
    - حذف جدول `tree_operation_media`
    - حذف جدول `harvest_preferences`
    - حذف الـ triggers والـ functions المرتبطة
    - حذف الـ indexes
    - حذف الـ RLS policies
    - حذف storage bucket للوسائط

  2. Security
    - لا توجد تأثيرات أمنية - يتم حذف النظام بالكامل
*/

-- Drop RLS policies first (tree_operations)
DROP POLICY IF EXISTS "Admins can manage all tree operations" ON tree_operations;
DROP POLICY IF EXISTS "Investors can view their tree operations" ON tree_operations;

-- Drop RLS policies (tree_operation_media)
DROP POLICY IF EXISTS "Admins can manage all operation media" ON tree_operation_media;
DROP POLICY IF EXISTS "Investors can view their operation media" ON tree_operation_media;

-- Drop RLS policies (harvest_preferences)
DROP POLICY IF EXISTS "Admins can manage all harvest preferences" ON harvest_preferences;
DROP POLICY IF EXISTS "Investors can view their harvest preferences" ON harvest_preferences;
DROP POLICY IF EXISTS "Investors can create their harvest preferences" ON harvest_preferences;
DROP POLICY IF EXISTS "Investors can update their pending harvest preferences" ON harvest_preferences;

-- Drop storage policies
DROP POLICY IF EXISTS "Admins can upload tree operation media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view tree operation media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete tree operation media" ON storage.objects;

-- Drop triggers
DROP TRIGGER IF EXISTS update_tree_operations_updated_at ON tree_operations;
DROP TRIGGER IF EXISTS update_harvest_preferences_updated_at ON harvest_preferences;

-- Drop tables (CASCADE will drop related indexes and constraints)
DROP TABLE IF EXISTS tree_operation_media CASCADE;
DROP TABLE IF EXISTS harvest_preferences CASCADE;
DROP TABLE IF EXISTS tree_operations CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_tree_tracking_updated_at();

-- Delete storage bucket
DELETE FROM storage.buckets WHERE id = 'tree-operation-media';
