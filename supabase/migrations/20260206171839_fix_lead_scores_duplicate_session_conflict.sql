/*
  # إصلاح تعارض session_id في lead_scores

  ## المشكلة
  - عندما يسجل المستخدم بعد زيارة المنصة كزائر، يتم ربط session_id بـ user_id
  - لكن عند إضافة نشاط جديد، الـ trigger يحاول إنشاء سجل lead_scores جديد بنفس session_id
  - هذا ينتهك القيد الفريد idx_lead_scores_session_id

  ## الحل
  - استخدام ON CONFLICT DO UPDATE للتعامل مع الحالات المكررة
  - تحديث السجل الموجود بدلاً من محاولة إدخال واحد جديد

  ## الأمان
  - لا يؤثر على البيانات الموجودة
  - يحسن موثوقية النظام
*/

-- تحديث دالة update_lead_score لاستخدام ON CONFLICT
CREATE OR REPLACE FUNCTION update_lead_score()
RETURNS trigger AS $$
DECLARE
  v_lead_score_id uuid;
  v_total_points integer;
  v_new_temperature text;
BEGIN
  -- Find or create lead_score record
  IF NEW.user_id IS NOT NULL THEN
    -- البحث عن سجل موجود بنفس user_id
    SELECT id, total_points INTO v_lead_score_id, v_total_points
    FROM lead_scores
    WHERE user_id = NEW.user_id;
    
    IF NOT FOUND THEN
      -- إنشاء سجل جديد مع معالجة التعارض
      INSERT INTO lead_scores (user_id, session_id, total_points, last_activity_at)
      VALUES (NEW.user_id, NEW.session_id, NEW.points_awarded, NEW.created_at)
      ON CONFLICT (user_id) DO UPDATE
      SET
        total_points = lead_scores.total_points + EXCLUDED.total_points,
        last_activity_at = EXCLUDED.last_activity_at,
        temperature = calculate_lead_temperature(lead_scores.total_points + EXCLUDED.total_points),
        updated_at = now()
      RETURNING id, total_points INTO v_lead_score_id, v_total_points;
    ELSE
      -- تحديث السجل الموجود
      v_total_points := v_total_points + NEW.points_awarded;
      UPDATE lead_scores
      SET total_points = v_total_points,
          last_activity_at = NEW.created_at,
          temperature = calculate_lead_temperature(v_total_points),
          updated_at = now()
      WHERE id = v_lead_score_id;
    END IF;
  ELSE
    -- للزوار المجهولين (بدون user_id)
    SELECT id, total_points INTO v_lead_score_id, v_total_points
    FROM lead_scores
    WHERE session_id = NEW.session_id AND user_id IS NULL;
    
    IF NOT FOUND THEN
      -- إنشاء سجل جديد مع معالجة التعارض
      INSERT INTO lead_scores (session_id, total_points, last_activity_at)
      VALUES (NEW.session_id, NEW.points_awarded, NEW.created_at)
      ON CONFLICT (session_id) WHERE session_id IS NOT NULL DO UPDATE
      SET
        total_points = lead_scores.total_points + EXCLUDED.total_points,
        last_activity_at = EXCLUDED.last_activity_at,
        temperature = calculate_lead_temperature(lead_scores.total_points + EXCLUDED.total_points),
        updated_at = now()
      RETURNING id, total_points INTO v_lead_score_id, v_total_points;
    ELSE
      -- تحديث السجل الموجود
      v_total_points := v_total_points + NEW.points_awarded;
      UPDATE lead_scores
      SET total_points = v_total_points,
          last_activity_at = NEW.created_at,
          temperature = calculate_lead_temperature(v_total_points),
          updated_at = now()
      WHERE id = v_lead_score_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;