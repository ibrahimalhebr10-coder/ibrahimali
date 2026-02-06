/*
  # إضافة Apple Pay كبوابة دفع

  1. إضافة
    - Apple Pay كخيار دفع للأجهزة التي تدعمه
*/

-- إضافة Apple Pay إذا لم يكن موجوداً
INSERT INTO payment_providers (
  provider_code,
  provider_name_ar,
  provider_name_en,
  provider_type,
  is_enabled,
  environment,
  connection_status,
  display_order,
  description_ar,
  description_en,
  min_amount,
  max_amount,
  supported_currencies,
  configuration
) VALUES (
  'apple_pay',
  'Apple Pay',
  'Apple Pay',
  'digital_wallet',
  true,
  'production',
  'connected',
  0,
  'ادفع بسهولة وأمان باستخدام Apple Pay',
  'Pay easily and securely with Apple Pay',
  10,
  500000,
  ARRAY['SAR', 'USD', 'EUR'],
  jsonb_build_object(
    'description', 'محفظة آبل الرقمية - دفع سريع وآمن',
    'supported_currencies', ARRAY['SAR', 'USD', 'EUR'],
    'payment_flow', 'instant',
    'requires_device', 'Apple devices only',
    'settlement_time', 'immediate'
  )
)
ON CONFLICT (provider_code) DO UPDATE SET
  is_enabled = true,
  display_order = 0,
  description_ar = 'ادفع بسهولة وأمان باستخدام Apple Pay',
  description_en = 'Pay easily and securely with Apple Pay';