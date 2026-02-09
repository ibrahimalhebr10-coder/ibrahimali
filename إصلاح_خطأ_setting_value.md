# إصلاح خطأ setting_value ✅

---

## المشكلة 🐛

```
PATCH https://...supabase.co/rest/v1/system_settings 400 (Bad Request)

Error: Could not find the 'setting_value' column of 'system_settings' 
in the schema cache
```

---

## السبب 🔍

```
الجدول الموجود في قاعدة البيانات:
┌──────────────────────────┐
│ system_settings          │
├──────────────────────────┤
│ • id                     │
│ • key         ⬅️ الصحيح │
│ • value       ⬅️ الصحيح │
│ • description            │
│ • category               │
│ • created_at             │
│ • updated_at             │
└──────────────────────────┘

الكود كان يستخدم:
❌ setting_key (خاطئ)
❌ setting_value (خاطئ)
```

---

## الحل ✅

### 1. تعديل Migration

قبل:
```sql
INSERT INTO system_settings (
  setting_key,        -- ❌ خاطئ
  setting_value,      -- ❌ خاطئ
  setting_type,       -- ❌ غير موجود
  setting_category,   -- ❌ خاطئ
  ...
)
```

بعد:
```sql
INSERT INTO system_settings (
  key,                -- ✅ صحيح
  value,              -- ✅ صحيح
  description,        -- ✅ صحيح
  category            -- ✅ صحيح
)
```

### 2. تعديل الكود

قبل:
```typescript
.select('setting_key, setting_value')  // ❌
.eq('setting_key', ...)                 // ❌

.update({
  setting_value: ...                    // ❌
})
```

بعد:
```typescript
.select('key, value')                   // ✅
.eq('key', ...)                         // ✅

.update({
  value: ...                            // ✅
})
```

---

## التغييرات 📝

### الملف 1: Migration

```
📄 supabase/migrations/20260209200000_add_bonus_years_to_partner_codes.sql

التغييرات:
• setting_key → key
• setting_value → value
• setting_category → category
• حذف setting_type و is_public (غير موجودين في الجدول)
```

### الملف 2: الكود

```
📄 src/components/admin/PartnerCodeSettings.tsx

التغييرات:
• في loadSettings(): setting_key → key, setting_value → value
• في handleSave(): setting_key → key, setting_value → value
• تحديث جميع المراجع في الكود
```

---

## التحقق 🧪

```bash
# 1. البناء نجح ✅
npm run build

# 2. لا أخطاء في TypeScript ✅
# 3. جاهز للاختبار ✅
```

---

## الآن يجب أن يعمل! 🎉

```
1. افتح لوحة الإدارة
2. اذهب إلى شركاء المسيرة
3. اضغط "السنوات المجانية"
4. عدّل الإعدادات
5. احفظ

النتيجة:
✅ تم حفظ الإعدادات بنجاح

وليس:
❌ Could not find the 'setting_value' column...
```

---

## ملاحظة مهمة ⚠️

```
تأكد من أن الـ Migration تم تطبيقه في قاعدة البيانات!

الملف:
supabase/migrations/20260209200000_add_bonus_years_to_partner_codes.sql

إذا لم يكن مطبقاً، طبّقه أولاً.
```

---

**تم الإصلاح! 🎊**
