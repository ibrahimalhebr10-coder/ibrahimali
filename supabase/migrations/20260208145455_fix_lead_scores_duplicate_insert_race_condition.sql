/*
  # إصلاح مشكلة تكرار session_id في lead_scores

  ## المشكلة
  عند إدخال نشاط جديد (lead_activity)، الـ trigger يحاول إنشاء lead_score جديد
  لكن إذا كان الـ session_id موجود بالفعل، يرفع خطأ unique constraint

  ## السبب
  الـ trigger الحالي يستخدم `IF NOT FOUND THEN INSERT`
  لكن في حالة race condition أو إعادة محاولة، قد يحاول إنشاء السجل مرتين

  ## الحل
  استخدام `INSERT ... ON CONFLICT DO UPDATE` بدلاً من `IF NOT FOUND`
  هذا يضمن أن الإدخال سيتم أو سيتم التحديث إذا كان السجل موجوداً

  ## الأمان
  - نفس السلوك السابق
  - يحل مشكلة race condition
  - يزيل رسائل الخطأ من console
*/

-- حذف الـ trigger القديم
DROP TRIGGER IF EXISTS trigger_update_lead_score ON lead_activities;

-- حذف الـ function القديمة
DROP FUNCTION IF EXISTS update_lead_score();

-- إنشاء function محسّنة باستخدام ON CONFLICT
CREATE OR REPLACE FUNCTION update_lead_score()
RETURNS trigger AS $$
DECLARE
  v_total_points integer;
  v_new_temperature text;
BEGIN
  -- Update or insert lead_score using ON CONFLICT
  IF NEW.user_id IS NOT NULL THEN
    -- Case 1: User is authenticated (has user_id)
    INSERT INTO lead_scores (
      user_id, 
      session_id, 
      total_points, 
      last_activity_at,
      first_seen_at
    )
    VALUES (
      NEW.user_id, 
      NEW.session_id, 
      NEW.points_awarded, 
      NEW.created_at,
      NEW.created_at
    )
    ON CONFLICT (user_id) WHERE user_id IS NOT NULL
    DO UPDATE SET
      total_points = lead_scores.total_points + NEW.points_awarded,
      last_activity_at = NEW.created_at,
      temperature = calculate_lead_temperature(lead_scores.total_points + NEW.points_awarded),
      updated_at = now();
    
  ELSE
    -- Case 2: Anonymous user (session_id only)
    INSERT INTO lead_scores (
      session_id, 
      total_points, 
      last_activity_at,
      first_seen_at
    )
    VALUES (
      NEW.session_id, 
      NEW.points_awarded, 
      NEW.created_at,
      NEW.created_at
    )
    ON CONFLICT (session_id) WHERE session_id IS NOT NULL
    DO UPDATE SET
      total_points = lead_scores.total_points + NEW.points_awarded,
      last_activity_at = NEW.created_at,
      temperature = calculate_lead_temperature(lead_scores.total_points + NEW.points_awarded),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إعادة إنشاء الـ trigger
CREATE TRIGGER trigger_update_lead_score
  AFTER INSERT ON lead_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_score();

-- Comment
COMMENT ON FUNCTION update_lead_score() IS 'تحديث نقاط العميل تلقائياً عند إضافة نشاط جديد - مع حماية من race condition';
