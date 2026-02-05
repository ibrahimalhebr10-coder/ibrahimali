/*
  # Create Momentum Center System

  1. Overview
    - Marketing section transformed into Momentum Center
    - Reads platform activity and suggests timing for actions
    - No campaigns, no mass messaging, just smart reading and suggestions

  2. New Tables
    - `momentum_decisions`: Stores admin decisions about momentum actions
      - `id` (uuid, primary key)
      - `decision_type` (text): 'push' or 'silence'
      - `action_taken` (text): what action was chosen (notification, partners, opportunity, silence)
      - `reason` (text): why this decision was made
      - `created_by` (uuid): admin who made the decision
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on momentum_decisions table
    - Only admins can insert and view decisions
*/

-- Create momentum decisions table
CREATE TABLE IF NOT EXISTS momentum_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_type text NOT NULL CHECK (decision_type IN ('push', 'silence')),
  action_taken text NOT NULL,
  reason text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE momentum_decisions ENABLE ROW LEVEL SECURITY;

-- Policies: Only admins can insert and view
CREATE POLICY "Admins can insert momentum decisions"
  ON momentum_decisions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view momentum decisions"
  ON momentum_decisions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    )
  );

-- Create function to read momentum indicators
CREATE OR REPLACE FUNCTION get_momentum_indicators()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result jsonb;
  v_recent_registrations int;
  v_recent_maintenance int;
  v_total_reservations int;
  v_farms_near_full int;
BEGIN
  -- Count recent registrations (last 7 days)
  SELECT COUNT(*) INTO v_recent_registrations
  FROM auth.users
  WHERE created_at > now() - interval '7 days';

  -- Count recent maintenance records (last 7 days)
  SELECT COUNT(*) INTO v_recent_maintenance
  FROM maintenance_records
  WHERE created_at > now() - interval '7 days';

  -- Count total active reservations
  SELECT COUNT(*) INTO v_total_reservations
  FROM reservations
  WHERE status IN ('active', 'confirmed');

  -- Count farms near full (80%+ capacity)
  SELECT COUNT(*) INTO v_farms_near_full
  FROM farms f
  WHERE (
    SELECT COUNT(*) 
    FROM reservations r 
    WHERE r.farm_id = f.id AND r.status IN ('active', 'confirmed', 'waiting_for_payment', 'pending')
  ) >= (f.total_trees * 0.8);

  -- Build result
  v_result := jsonb_build_object(
    'registrations', jsonb_build_object(
      'count', v_recent_registrations,
      'status', CASE 
        WHEN v_recent_registrations >= 20 THEN 'high'
        WHEN v_recent_registrations >= 10 THEN 'medium'
        ELSE 'quiet'
      END
    ),
    'operations', jsonb_build_object(
      'count', v_recent_maintenance,
      'status', CASE 
        WHEN v_recent_maintenance >= 10 THEN 'active'
        WHEN v_recent_maintenance >= 5 THEN 'moderate'
        ELSE 'quiet'
      END
    ),
    'engagement', jsonb_build_object(
      'total_reservations', v_total_reservations,
      'status', CASE 
        WHEN v_total_reservations >= 50 THEN 'high'
        WHEN v_total_reservations >= 20 THEN 'medium'
        ELSE 'low'
      END
    ),
    'capacity', jsonb_build_object(
      'farms_near_full', v_farms_near_full,
      'status', CASE 
        WHEN v_farms_near_full >= 2 THEN 'urgent'
        WHEN v_farms_near_full >= 1 THEN 'attention'
        ELSE 'healthy'
      END
    ),
    'suggestion', CASE
      WHEN v_farms_near_full >= 1 AND v_recent_registrations >= 10 THEN 'يفضل فتح مزرعة جديدة'
      WHEN v_recent_registrations < 5 AND v_recent_maintenance < 3 THEN 'يفضل الصمت الآن'
      WHEN v_recent_registrations >= 10 AND v_total_reservations >= 30 THEN 'المنصة جاهزة لدفعة خفيفة'
      WHEN v_recent_maintenance >= 8 THEN 'فعّل شركاء الرحلة'
      ELSE 'الوضع مستقر'
    END
  );

  RETURN v_result;
END;
$$;

-- Create function to record momentum decision
CREATE OR REPLACE FUNCTION record_momentum_decision(
  p_decision_type text,
  p_action_taken text,
  p_reason text DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_decision_id uuid;
BEGIN
  INSERT INTO momentum_decisions (decision_type, action_taken, reason, created_by)
  VALUES (p_decision_type, p_action_taken, p_reason, auth.uid())
  RETURNING id INTO v_decision_id;

  RETURN v_decision_id;
END;
$$;

-- Create function to get recent decisions log
CREATE OR REPLACE FUNCTION get_momentum_decisions_log(
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  decision_type text,
  action_taken text,
  reason text,
  admin_name text,
  created_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    md.id,
    md.decision_type,
    md.action_taken,
    md.reason,
    COALESCE(up.full_name, u.email::text) as admin_name,
    md.created_at
  FROM momentum_decisions md
  JOIN auth.users u ON u.id = md.created_by
  LEFT JOIN user_profiles up ON up.id = u.id
  ORDER BY md.created_at DESC
  LIMIT p_limit;
END;
$$;