/*
  # إضافة بوابات الدفع السعودية

  البوابات:
  1. مدى (Mada)
  2. فيزا/ماستركارد (Visa/Mastercard)
  3. تمارا (Tamara)
  4. تابي (Tabby)
  5. تحويل بنكي (Bank Transfer)
*/

-- حذف البوابات القديمة إذا كانت موجودة
DELETE FROM payment_providers 
WHERE provider_code IN ('mada', 'visa_mastercard', 'tamara', 'tabby', 'bank_transfer');

-- إضافة البوابات الجديدة
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
) VALUES
  (
    'mada',
    'مدى',
    'Mada',
    'card',
    false,
    'sandbox',
    'disconnected',
    1,
    'بطاقات مدى السعودية - نظام الدفع الوطني',
    'Mada Cards - Saudi National Payment System',
    10,
    100000,
    ARRAY['SAR'],
    jsonb_build_object(
      'payment_flow', 'redirect',
      'requires_3ds', true,
      'settlement_time', '24-48 hours',
      'documentation_url', 'https://mada.com.sa/developers',
      'test_cards', jsonb_build_array(
        jsonb_build_object('number', '4111111111111111', 'cvv', '123', 'expiry', '12/25')
      )
    )
  ),
  (
    'visa_mastercard',
    'فيزا / ماستركارد',
    'Visa / Mastercard',
    'card',
    false,
    'sandbox',
    'disconnected',
    2,
    'بطاقات فيزا وماستركارد الدولية',
    'International Visa and Mastercard',
    10,
    500000,
    ARRAY['SAR', 'USD', 'EUR'],
    jsonb_build_object(
      'payment_flow', 'embedded',
      'requires_3ds', true,
      'settlement_time', '48-72 hours',
      'processing_fee', '2.9% + 1 SAR',
      'supported_cards', ARRAY['Visa', 'Mastercard', 'American Express']
    )
  ),
  (
    'tamara',
    'تمارا',
    'Tamara',
    'bnpl',
    false,
    'sandbox',
    'disconnected',
    3,
    'الدفع بالتقسيط عبر تمارا - اشترِ الآن وادفع لاحقاً',
    'Buy Now Pay Later with Tamara',
    100,
    20000,
    ARRAY['SAR'],
    jsonb_build_object(
      'payment_flow', 'redirect',
      'installment_plans', jsonb_build_array(
        jsonb_build_object('name', 'ادفع خلال 30 يوم', 'duration', 1, 'interest_free', true),
        jsonb_build_object('name', '3 دفعات', 'duration', 3, 'interest_free', true),
        jsonb_build_object('name', '6 أشهر', 'duration', 6, 'interest_free', false),
        jsonb_build_object('name', '12 شهر', 'duration', 12, 'interest_free', false)
      ),
      'settlement_time', 'immediate',
      'documentation_url', 'https://docs.tamara.co',
      'webhook_events', ARRAY['order.approved', 'order.declined', 'order.canceled']
    )
  ),
  (
    'tabby',
    'تابي',
    'Tabby',
    'bnpl',
    false,
    'sandbox',
    'disconnected',
    4,
    'الدفع بالتقسيط عبر تابي - قسّم مشترياتك',
    'Split your purchases with Tabby',
    100,
    5000,
    ARRAY['SAR', 'AED'],
    jsonb_build_object(
      'payment_flow', 'redirect',
      'installment_plans', jsonb_build_array(
        jsonb_build_object('name', '4 دفعات', 'duration', 4, 'interest_free', true),
        jsonb_build_object('name', 'ادفع لاحقاً', 'duration', 1, 'interest_free', true)
      ),
      'settlement_time', 'immediate',
      'documentation_url', 'https://docs.tabby.ai',
      'webhook_events', ARRAY['payment.approved', 'payment.rejected', 'payment.refunded']
    )
  ),
  (
    'bank_transfer',
    'تحويل بنكي',
    'Bank Transfer',
    'bank_transfer',
    true,
    'production',
    'connected',
    5,
    'تحويل بنكي مباشر إلى حساب المنصة',
    'Direct bank transfer to platform account',
    1,
    9999999,
    ARRAY['SAR'],
    jsonb_build_object(
      'payment_flow', 'manual',
      'requires_verification', true,
      'settlement_time', 'manual verification required',
      'bank_accounts', jsonb_build_array(
        jsonb_build_object(
          'bank_name', 'البنك الأهلي السعودي',
          'account_number', 'سيتم تعبئته من الإعدادات',
          'iban', 'SA00 0000 0000 0000 0000 0000',
          'account_holder', 'منصة أشجاري'
        )
      )
    )
  );