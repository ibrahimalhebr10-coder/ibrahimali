/*
  # Dynamic Reward Calculation for Influencer Dashboard

  ## Purpose
  Updates get_my_influencer_dashboard() to use dynamic trees_required_for_reward
  from influencer_settings instead of hardcoded value.

  ## Changes
  - Fetches trees_required_for_reward from influencer_settings
  - Calculates progress based on dynamic value
  - Returns the requirement value in response
  - Progress: (trees_earned / required) * 100
  - Remaining: required - (trees_earned % required)

  ## Impact Calculation After Payment Only
  Only counts reservations with status = 'confirmed'
*/

CREATE OR REPLACE FUNCTION get_my_influencer_dashboard()
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  partner_record influencer_partners%ROWTYPE;
  trees_count integer;
  bookings_count integer;
  progress_percentage integer;
  trees_required integer;
  trees_in_current_batch integer;
  trees_until_next_reward integer;
BEGIN
  -- Get partner data
  SELECT * INTO partner_record
  FROM influencer_partners
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- If user is not a success partner
  IF partner_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_partner',
      'message', 'المستخدم ليس شريك نجاح'
    );
  END IF;

  -- Get dynamic trees_required from settings
  SELECT trees_required_for_reward INTO trees_required
  FROM influencer_settings
  LIMIT 1;

  -- Default to 20 if not found
  IF trees_required IS NULL THEN
    trees_required := 20;
  END IF;

  -- Calculate trees from CONFIRMED reservations only (after payment)
  SELECT COALESCE(SUM(tree_count), 0) INTO trees_count
  FROM reservations
  WHERE influencer_code = partner_record.name
    AND status = 'confirmed';

  -- Calculate bookings count
  SELECT COUNT(*) INTO bookings_count
  FROM reservations
  WHERE influencer_code = partner_record.name
    AND status = 'confirmed';

  -- Calculate progress in current batch
  trees_in_current_batch := trees_count % trees_required;
  
  -- Calculate trees until next reward
  IF trees_in_current_batch = 0 AND trees_count > 0 THEN
    trees_until_next_reward := 0;
  ELSE
    trees_until_next_reward := trees_required - trees_in_current_batch;
  END IF;

  -- Calculate progress percentage
  IF trees_in_current_batch = 0 AND trees_count = 0 THEN
    progress_percentage := 0;
  ELSIF trees_until_next_reward = 0 THEN
    progress_percentage := 100;
  ELSE
    progress_percentage := LEAST(100, (trees_in_current_batch * 100) / trees_required);
  END IF;

  -- Return data
  RETURN jsonb_build_object(
    'success', true,
    'partner', jsonb_build_object(
      'id', partner_record.id,
      'name', partner_record.name,
      'display_name', partner_record.display_name,
      'phone', partner_record.phone,
      'status', partner_record.status,
      'is_active', partner_record.is_active,
      'trees_earned', trees_count,
      'total_bookings', bookings_count,
      'progress_percentage', progress_percentage,
      'trees_required_for_reward', trees_required,
      'trees_in_current_batch', trees_in_current_batch,
      'trees_until_next_reward', trees_until_next_reward,
      'created_at', partner_record.created_at
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unknown',
      'message', 'حدث خطأ أثناء الحصول على البيانات'
    );
END;
$$;

COMMENT ON FUNCTION get_my_influencer_dashboard IS 'Returns influencer dashboard with DYNAMIC reward calculation based on settings';
