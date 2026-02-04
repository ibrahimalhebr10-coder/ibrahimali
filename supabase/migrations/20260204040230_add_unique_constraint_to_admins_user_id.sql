/*
  # إضافة قيد UNIQUE على user_id في جدول admins

  1. السبب:
    - نحتاج لجعل user_id فريداً حتى يمكن للمفاتيح الأجنبية الإشارة إليه
    - user_id هو المعرف الحقيقي من auth.users
  
  2. التغييرات:
    - إضافة UNIQUE constraint على admins.user_id
    - هذا سيسمح للجداول الأخرى بالإشارة إليه كمفتاح أجنبي
*/

-- إضافة قيد UNIQUE على user_id
ALTER TABLE admins
  ADD CONSTRAINT admins_user_id_unique UNIQUE (user_id);
