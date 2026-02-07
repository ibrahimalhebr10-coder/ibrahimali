/*
  # حذف نظام الفيديو التعريفي بالكامل

  1. الحذف
    - حذف جدول `video_intro`
    - حذف storage bucket `intro-videos`
    - حذف جميع السياسات المرتبطة
    - حذف جميع الـ indexes والـ triggers

  2. الأمان
    - لا توجد مخاطر على البيانات الأخرى
    - الحذف آمن ومعزول
*/

-- حذف الجدول (سيحذف تلقائياً جميع السياسات والـ indexes والـ triggers)
DROP TABLE IF EXISTS video_intro CASCADE;

-- حذف storage bucket للفيديوهات التعريفية
DELETE FROM storage.buckets WHERE id = 'intro-videos';

-- حذف جميع الملفات من storage
DELETE FROM storage.objects WHERE bucket_id = 'intro-videos';
