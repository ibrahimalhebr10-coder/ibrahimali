/*
  # Smart Conversion Engine - Phase 1
  
  ## Overview
  محرك التحويل الذكي - يتتبع سلوك العملاء ويسجل نقاطهم تلقائياً
  
  ## New Tables
  
  ### 1. `lead_activities`
  تسجيل كل نشاط يقوم به العميل (زيارة، نقرة، حجز، إلخ)
  - `id` (uuid, primary key)
  - `user_id` (uuid, nullable) - المستخدم المسجل
  - `session_id` (text) - معرف الجلسة للزوار غير المسجلين
  - `activity_type` (text) - نوع النشاط
  - `activity_data` (jsonb) - بيانات إضافية
  - `points_awarded` (integer) - النقاط الممنوحة
  - `page_url` (text) - الصفحة المزارة
  - `created_at` (timestamptz)
  
  ### 2. `lead_scores`
  النقاط التراكمية والحالة الحالية لكل عميل
  - `id` (uuid, primary key)
  - `user_id` (uuid, nullable)
  - `session_id` (text)
  - `total_points` (integer) - مجموع النقاط
  - `temperature` (text) - حالة العميل: cold/warm/hot
  - `last_activity_at` (timestamptz)
  - `first_seen_at` (timestamptz)
  - `conversion_stage` (text) - مرحلة التحويل
  - `phone` (text, nullable)
  - `email` (text, nullable)
  - `updated_at` (timestamptz)
  
  ### 3. `automated_nudges`
  سجل الرسائل والتنبيهات التلقائية المرسلة
  - `id` (uuid, primary key)
  - `lead_score_id` (uuid, foreign key)
  - `nudge_type` (text) - نوع التنبيه
  - `channel` (text) - القناة (whatsapp, sms, email)
  - `message_content` (text)
  - `sent_at` (timestamptz)
  - `status` (text) - pending/sent/delivered/failed
  - `response_received` (boolean)
  - `response_data` (jsonb, nullable)
  
  ### 4. `conversion_rules`
  قواعد تسجيل النقاط والتصنيف
  - `id` (uuid, primary key)
  - `activity_type` (text, unique)
  - `points` (integer)
  - `description` (text)
  - `is_active` (boolean)
  
  ## Security
  - Enable RLS on all tables
  - Admins can view/manage all data
  - Users can only view their own data
*/

-- Create lead_activities table
CREATE TABLE IF NOT EXISTS lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  session_id text,
  activity_type text NOT NULL,
  activity_data jsonb DEFAULT '{}',
  points_awarded integer DEFAULT 0,
  page_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_user_id ON lead_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_session_id ON lead_activities(session_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at DESC);

-- Create lead_scores table
CREATE TABLE IF NOT EXISTS lead_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  session_id text,
  total_points integer DEFAULT 0,
  temperature text DEFAULT 'cold' CHECK (temperature IN ('cold', 'warm', 'hot', 'burning')),
  last_activity_at timestamptz DEFAULT now(),
  first_seen_at timestamptz DEFAULT now(),
  conversion_stage text DEFAULT 'visitor' CHECK (conversion_stage IN ('visitor', 'interested', 'engaged', 'cart_abandoned', 'payment_stuck', 'converted', 'lost')),
  phone text,
  email text,
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_scores_user_id ON lead_scores(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_scores_session_id ON lead_scores(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_scores_temperature ON lead_scores(temperature);
CREATE INDEX IF NOT EXISTS idx_lead_scores_total_points ON lead_scores(total_points DESC);

-- Create automated_nudges table
CREATE TABLE IF NOT EXISTS automated_nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_score_id uuid REFERENCES lead_scores(id) ON DELETE CASCADE,
  nudge_type text NOT NULL,
  channel text DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'sms', 'email', 'notification')),
  message_content text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'responded')),
  response_received boolean DEFAULT false,
  response_data jsonb
);

CREATE INDEX IF NOT EXISTS idx_automated_nudges_lead_score_id ON automated_nudges(lead_score_id);
CREATE INDEX IF NOT EXISTS idx_automated_nudges_sent_at ON automated_nudges(sent_at DESC);

-- Create conversion_rules table
CREATE TABLE IF NOT EXISTS conversion_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type text UNIQUE NOT NULL,
  points integer NOT NULL DEFAULT 0,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Seed default conversion rules
INSERT INTO conversion_rules (activity_type, points, description) VALUES
  ('page_visit', 1, 'زيارة أي صفحة'),
  ('farm_view', 5, 'مشاهدة صفحة مزرعة'),
  ('farm_view_repeat', 10, 'مشاهدة نفس المزرعة مرة أخرى'),
  ('pricing_view', 15, 'مشاهدة صفحة الأسعار أو الباقات'),
  ('package_details', 20, 'فتح تفاصيل باقة'),
  ('reservation_start', 25, 'بدء عملية الحجز'),
  ('registration_complete', 30, 'إكمال التسجيل'),
  ('payment_page', 35, 'الوصول لصفحة الدفع'),
  ('reservation_complete', 100, 'إكمال الحجز والدفع'),
  ('time_on_page_1min', 3, 'البقاء في صفحة لمدة دقيقة'),
  ('time_on_page_3min', 8, 'البقاء في صفحة لمدة 3 دقائق'),
  ('return_visitor', 5, 'عميل عائد'),
  ('whatsapp_click', 12, 'نقر على زر واتساب')
ON CONFLICT (activity_type) DO NOTHING;

-- Enable RLS
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_activities
CREATE POLICY "Admins can view all activities"
  ON lead_activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own activities"
  ON lead_activities FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can insert activities"
  ON lead_activities FOR INSERT
  WITH CHECK (true);

-- RLS Policies for lead_scores
CREATE POLICY "Admins can view all scores"
  ON lead_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own scores"
  ON lead_scores FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can insert/update scores"
  ON lead_scores FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update scores"
  ON lead_scores FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for automated_nudges
CREATE POLICY "Admins can manage all nudges"
  ON automated_nudges FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

-- RLS Policies for conversion_rules
CREATE POLICY "Everyone can view conversion rules"
  ON conversion_rules FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage conversion rules"
  ON conversion_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

-- Function to calculate temperature based on points
CREATE OR REPLACE FUNCTION calculate_lead_temperature(points integer)
RETURNS text AS $$
BEGIN
  IF points >= 50 THEN
    RETURN 'burning';
  ELSIF points >= 30 THEN
    RETURN 'hot';
  ELSIF points >= 15 THEN
    RETURN 'warm';
  ELSE
    RETURN 'cold';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update lead score
CREATE OR REPLACE FUNCTION update_lead_score()
RETURNS trigger AS $$
DECLARE
  v_lead_score_id uuid;
  v_total_points integer;
  v_new_temperature text;
BEGIN
  -- Find or create lead_score record
  IF NEW.user_id IS NOT NULL THEN
    SELECT id, total_points INTO v_lead_score_id, v_total_points
    FROM lead_scores
    WHERE user_id = NEW.user_id;
    
    IF NOT FOUND THEN
      INSERT INTO lead_scores (user_id, session_id, total_points, last_activity_at)
      VALUES (NEW.user_id, NEW.session_id, NEW.points_awarded, NEW.created_at)
      RETURNING id, total_points INTO v_lead_score_id, v_total_points;
    ELSE
      v_total_points := v_total_points + NEW.points_awarded;
      UPDATE lead_scores
      SET total_points = v_total_points,
          last_activity_at = NEW.created_at,
          temperature = calculate_lead_temperature(v_total_points),
          updated_at = now()
      WHERE id = v_lead_score_id;
    END IF;
  ELSE
    SELECT id, total_points INTO v_lead_score_id, v_total_points
    FROM lead_scores
    WHERE session_id = NEW.session_id;
    
    IF NOT FOUND THEN
      INSERT INTO lead_scores (session_id, total_points, last_activity_at)
      VALUES (NEW.session_id, NEW.points_awarded, NEW.created_at)
      RETURNING id, total_points INTO v_lead_score_id, v_total_points;
    ELSE
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

-- Trigger to auto-update scores
DROP TRIGGER IF EXISTS trigger_update_lead_score ON lead_activities;
CREATE TRIGGER trigger_update_lead_score
  AFTER INSERT ON lead_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_score();

-- Function to get hot leads for admin dashboard
CREATE OR REPLACE FUNCTION get_hot_leads(limit_count integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  session_id text,
  total_points integer,
  temperature text,
  conversion_stage text,
  last_activity_at timestamptz,
  first_seen_at timestamptz,
  phone text,
  email text,
  full_name text,
  activities_count bigint,
  last_activity_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ls.id,
    ls.user_id,
    ls.session_id,
    ls.total_points,
    ls.temperature,
    ls.conversion_stage,
    ls.last_activity_at,
    ls.first_seen_at,
    COALESCE(ls.phone, up.phone) as phone,
    COALESCE(ls.email, up.email) as email,
    up.full_name,
    COUNT(la.id) as activities_count,
    (
      SELECT la2.activity_type 
      FROM lead_activities la2 
      WHERE (la2.user_id = ls.user_id OR la2.session_id = ls.session_id)
      ORDER BY la2.created_at DESC 
      LIMIT 1
    ) as last_activity_type
  FROM lead_scores ls
  LEFT JOIN user_profiles up ON ls.user_id = up.id
  LEFT JOIN lead_activities la ON (la.user_id = ls.user_id OR la.session_id = ls.session_id)
  WHERE ls.temperature IN ('hot', 'burning')
    AND ls.conversion_stage != 'converted'
    AND ls.last_activity_at > now() - interval '7 days'
  GROUP BY ls.id, ls.user_id, ls.session_id, ls.total_points, ls.temperature, 
           ls.conversion_stage, ls.last_activity_at, ls.first_seen_at, 
           ls.phone, ls.email, up.phone, up.email, up.full_name
  ORDER BY ls.total_points DESC, ls.last_activity_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;