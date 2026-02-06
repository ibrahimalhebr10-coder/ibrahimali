/*
  # إصلاح trigger لـ lead_scores بطريقة صحيحة

  ## المشكلة السابقة
  - ON CONFLICT لا يعمل مع partial unique indexes
  - الـ trigger يجب أن يبحث عن السجل الموجود بشكل أدق

  ## الحل
  - إزالة ON CONFLICT
  - تحسين البحث عن السجل الموجود قبل الإدخال
  - التعامل الصحيح مع session_id عند التحول من زائر إلى مستخدم

  ## الأمان
  - آمن تماماً
  - يمنع التعارضات قبل حدوثها
*/

CREATE OR REPLACE FUNCTION update_lead_score()
RETURNS trigger AS $$
DECLARE
  v_lead_score_id uuid;
  v_total_points integer;
  v_new_temperature text;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    -- البحث أولاً عن سجل بنفس user_id
    SELECT id, total_points INTO v_lead_score_id, v_total_points
    FROM lead_scores
    WHERE user_id = NEW.user_id;
    
    IF FOUND THEN
      -- تحديث السجل الموجود
      v_total_points := v_total_points + NEW.points_awarded;
      UPDATE lead_scores
      SET total_points = v_total_points,
          session_id = NEW.session_id,
          last_activity_at = NEW.created_at,
          temperature = calculate_lead_temperature(v_total_points),
          updated_at = now()
      WHERE id = v_lead_score_id;
    ELSE
      -- البحث عن سجل بنفس session_id (من جلسة زائر سابقة)
      SELECT id, total_points INTO v_lead_score_id, v_total_points
      FROM lead_scores
      WHERE session_id = NEW.session_id;
      
      IF FOUND THEN
        -- تحديث السجل وربطه بـ user_id
        v_total_points := v_total_points + NEW.points_awarded;
        UPDATE lead_scores
        SET user_id = NEW.user_id,
            total_points = v_total_points,
            last_activity_at = NEW.created_at,
            temperature = calculate_lead_temperature(v_total_points),
            updated_at = now()
        WHERE id = v_lead_score_id;
      ELSE
        -- إنشاء سجل جديد
        INSERT INTO lead_scores (user_id, session_id, total_points, last_activity_at)
        VALUES (NEW.user_id, NEW.session_id, NEW.points_awarded, NEW.created_at);
      END IF;
    END IF;
  ELSE
    -- للزوار المجهولين
    SELECT id, total_points INTO v_lead_score_id, v_total_points
    FROM lead_scores
    WHERE session_id = NEW.session_id;
    
    IF FOUND THEN
      -- تحديث السجل الموجود
      v_total_points := v_total_points + NEW.points_awarded;
      UPDATE lead_scores
      SET total_points = v_total_points,
          last_activity_at = NEW.created_at,
          temperature = calculate_lead_temperature(v_total_points),
          updated_at = now()
      WHERE id = v_lead_score_id;
    ELSE
      -- إنشاء سجل جديد
      INSERT INTO lead_scores (session_id, total_points, last_activity_at)
      VALUES (NEW.session_id, NEW.points_awarded, NEW.created_at);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;