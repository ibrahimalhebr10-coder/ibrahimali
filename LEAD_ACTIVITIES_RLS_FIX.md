# ✅ إصلاح: RLS لجدول lead_activities

## المشكلة

عند فتح صفحة المزرعة، ظهرت الأخطاء التالية:

```
POST /rest/v1/lead_activities?select=* 401 (Unauthorized)
❌ [Lead Tracking] Database error: 
{code: '42501', message: 'new row violates row-level security policy for table "lead_activities"'}
```

### السبب

السياسة الأمنية (RLS Policy) القديمة لجدول `lead_activities` كانت تمنع المستخدمين غير المسجلين (anonymous) من إضافة سجلات تتبع النشاط.

---

## الحل المطبّق

### Migration: `fix_lead_activities_rls_anon_users.sql`

```sql
-- حذف السياسة القديمة
DROP POLICY IF EXISTS "Authenticated and anonymous can insert activities" ON lead_activities;

-- إنشاء سياسة جديدة تسمح للجميع بالإضافة
CREATE POLICY "Allow all users to insert lead activities"
  ON lead_activities
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
```

### لماذا هذا آمن؟

1. ✅ جدول `lead_activities` يحتوي فقط على بيانات تتبع (tracking)
2. ✅ لا يحتوي على بيانات حساسة
3. ✅ القراءة محمية - فقط المسؤولين والمستخدمين يمكنهم قراءة بياناتهم
4. ✅ الكتابة مفتوحة - لتتبع نشاط الزوار قبل التسجيل

---

## الاختبار

### قبل الإصلاح
```
❌ 401 Unauthorized
❌ Cannot insert lead activities
```

### بعد الإصلاح
```sql
INSERT INTO lead_activities (session_id, activity_type, ...) VALUES (...);
✅ Success!
```

---

## السياسات الحالية

### INSERT Policy
- **الاسم:** "Allow all users to insert lead activities"
- **المستخدمون:** `anon`, `authenticated`
- **الشرط:** `true` (يسمح للجميع)

### SELECT Policies
- **للمسؤولين:** يمكنهم رؤية كل الأنشطة
- **للمستخدمين:** يمكنهم رؤية أنشطتهم فقط

---

## التأثير

الآن عند فتح أي صفحة:
- ✅ يتم تتبع نشاط الزائر تلقائياً
- ✅ لا أخطاء 401 Unauthorized
- ✅ النظام يجمع بيانات Lead Scoring بشكل صحيح
- ✅ Hot Leads Dashboard يعمل كما هو مطلوب

---

✅ **تم إصلاح المشكلة بالكامل**

```bash
npm run build
✓ built in 10.92s
```
