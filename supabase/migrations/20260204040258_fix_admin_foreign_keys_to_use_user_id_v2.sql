/*
  # إصلاح المفاتيح الأجنبية للأدمن لاستخدام user_id بدلاً من id

  1. المشكلة:
    - جميع الجداول تشير إلى admins.id (UUID عشوائي)
    - لكن الكود يستخدم auth.uid() الذي هو admins.user_id
    - هذا يسبب خطأ Foreign Key Constraint
  
  2. الحل:
    - تغيير جميع القيود المرجعية من admins.id إلى admins.user_id
    - هذا أكثر منطقية معمارياً
  
  3. الجداول المتأثرة (14 قيد):
    - agricultural_operations (performed_by)
    - agricultural_documentation (uploaded_by)
    - agricultural_experience_content (updated_by)
    - investment_experience_content (updated_by)
    - admin_farm_assignments (admin_id, assigned_by)
    - admin_logs (admin_id)
    - farm_tasks (assigned_to, assigned_by)
    - investor_messages (sender_id)
    - messaging_providers (created_by, updated_by)
    - payment_transactions (approved_by)
    - reservations (approved_by)
*/

-- 1. agricultural_operations
ALTER TABLE agricultural_operations
  DROP CONSTRAINT IF EXISTS agricultural_operations_performed_by_fkey;

ALTER TABLE agricultural_operations
  ADD CONSTRAINT agricultural_operations_performed_by_fkey
  FOREIGN KEY (performed_by)
  REFERENCES admins(user_id)
  ON DELETE SET NULL;

-- 2. agricultural_documentation
ALTER TABLE agricultural_documentation
  DROP CONSTRAINT IF EXISTS agricultural_documentation_uploaded_by_fkey;

ALTER TABLE agricultural_documentation
  ADD CONSTRAINT agricultural_documentation_uploaded_by_fkey
  FOREIGN KEY (uploaded_by)
  REFERENCES admins(user_id)
  ON DELETE SET NULL;

-- 3. agricultural_experience_content
ALTER TABLE agricultural_experience_content
  DROP CONSTRAINT IF EXISTS agricultural_experience_content_updated_by_fkey;

ALTER TABLE agricultural_experience_content
  ADD CONSTRAINT agricultural_experience_content_updated_by_fkey
  FOREIGN KEY (updated_by)
  REFERENCES admins(user_id)
  ON DELETE SET NULL;

-- 4. investment_experience_content
ALTER TABLE investment_experience_content
  DROP CONSTRAINT IF EXISTS investment_experience_content_updated_by_fkey;

ALTER TABLE investment_experience_content
  ADD CONSTRAINT investment_experience_content_updated_by_fkey
  FOREIGN KEY (updated_by)
  REFERENCES admins(user_id)
  ON DELETE SET NULL;

-- 5. admin_farm_assignments (admin_id)
ALTER TABLE admin_farm_assignments
  DROP CONSTRAINT IF EXISTS admin_farm_assignments_admin_id_fkey;

ALTER TABLE admin_farm_assignments
  ADD CONSTRAINT admin_farm_assignments_admin_id_fkey
  FOREIGN KEY (admin_id)
  REFERENCES admins(user_id)
  ON DELETE CASCADE;

-- 6. admin_farm_assignments (assigned_by)
ALTER TABLE admin_farm_assignments
  DROP CONSTRAINT IF EXISTS admin_farm_assignments_assigned_by_fkey;

ALTER TABLE admin_farm_assignments
  ADD CONSTRAINT admin_farm_assignments_assigned_by_fkey
  FOREIGN KEY (assigned_by)
  REFERENCES admins(user_id)
  ON DELETE SET NULL;

-- 7. admin_logs
ALTER TABLE admin_logs
  DROP CONSTRAINT IF EXISTS admin_logs_admin_id_fkey;

ALTER TABLE admin_logs
  ADD CONSTRAINT admin_logs_admin_id_fkey
  FOREIGN KEY (admin_id)
  REFERENCES admins(user_id)
  ON DELETE CASCADE;

-- 8. farm_tasks (assigned_to)
ALTER TABLE farm_tasks
  DROP CONSTRAINT IF EXISTS farm_tasks_assigned_to_fkey;

ALTER TABLE farm_tasks
  ADD CONSTRAINT farm_tasks_assigned_to_fkey
  FOREIGN KEY (assigned_to)
  REFERENCES admins(user_id)
  ON DELETE SET NULL;

-- 9. farm_tasks (assigned_by)
ALTER TABLE farm_tasks
  DROP CONSTRAINT IF EXISTS farm_tasks_assigned_by_fkey;

ALTER TABLE farm_tasks
  ADD CONSTRAINT farm_tasks_assigned_by_fkey
  FOREIGN KEY (assigned_by)
  REFERENCES admins(user_id)
  ON DELETE SET NULL;

-- 10. investor_messages
ALTER TABLE investor_messages
  DROP CONSTRAINT IF EXISTS investor_messages_sender_id_fkey;

ALTER TABLE investor_messages
  ADD CONSTRAINT investor_messages_sender_id_fkey
  FOREIGN KEY (sender_id)
  REFERENCES admins(user_id)
  ON DELETE SET NULL;

-- 11. messaging_providers (created_by)
ALTER TABLE messaging_providers
  DROP CONSTRAINT IF EXISTS messaging_providers_created_by_fkey;

ALTER TABLE messaging_providers
  ADD CONSTRAINT messaging_providers_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES admins(user_id)
  ON DELETE SET NULL;

-- 12. messaging_providers (updated_by)
ALTER TABLE messaging_providers
  DROP CONSTRAINT IF EXISTS messaging_providers_updated_by_fkey;

ALTER TABLE messaging_providers
  ADD CONSTRAINT messaging_providers_updated_by_fkey
  FOREIGN KEY (updated_by)
  REFERENCES admins(user_id)
  ON DELETE SET NULL;

-- 13. payment_transactions
ALTER TABLE payment_transactions
  DROP CONSTRAINT IF EXISTS payment_transactions_approved_by_fkey;

ALTER TABLE payment_transactions
  ADD CONSTRAINT payment_transactions_approved_by_fkey
  FOREIGN KEY (approved_by)
  REFERENCES admins(user_id)
  ON DELETE SET NULL;

-- 14. reservations
ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_approved_by_fkey;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_approved_by_fkey
  FOREIGN KEY (approved_by)
  REFERENCES admins(user_id)
  ON DELETE SET NULL;
