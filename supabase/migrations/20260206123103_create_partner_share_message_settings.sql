/*
  # Partner Share Message Template Settings

  1. New Settings
    - Add settings for partner share message template
    - Includes message template with dynamic variables
    - Website URL configuration
    - Enable/disable features

  2. Default Template
    - Pre-configured with optimized marketing message
    - Supports variables: {partner_name}, {display_name}, {website_url}
    - Easily customizable by admins

  3. Security
    - Only super admins can modify these settings
*/

-- Add partner share message template settings
INSERT INTO system_settings (key, value, description, category)
VALUES
  (
    'partner_share_message_template',
    '🌿 *استثمر في المستقبل الأخضر!* 🌿

مرحباً، أنا {display_name}
شريك نجاح معتمد في منصة *حصص زراعية* 🌱

💡 *لماذا تستثمر معنا؟*
✓ مزارع حقيقية بعوائد مضمونة
✓ استثمار آمن ومربح
✓ شفافية كاملة ومتابعة مستمرة
✓ عوائد سنوية من محاصيل حقيقية

🎁 *مكافأة خاصة عند الحجز!*
اكتب اسمي عند التسجيل: *{partner_name}*

🌐 ابدأ رحلتك الاستثمارية الآن:
{website_url}

انضم لآلاف المستثمرين الذين حققوا أحلامهم 🚀',
    'قالب رسالة المشاركة لشركاء النجاح - يدعم المتغيرات: {partner_name}, {display_name}, {website_url}',
    'marketing'
  ),
  (
    'partner_share_website_url',
    'https://ashjari.com',
    'رابط الموقع المستخدم في رسالة المشاركة',
    'marketing'
  ),
  (
    'partner_share_message_enabled',
    'true',
    'تفعيل/إيقاف نظام رسالة المشاركة',
    'marketing'
  )
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();
