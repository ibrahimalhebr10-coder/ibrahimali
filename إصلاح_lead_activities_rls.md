# ✅ إصلاح أخطاء 401 في تتبع النشاط

## المشكلة
```
❌ 401 Unauthorized
❌ new row violates row-level security policy for table "lead_activities"
```

## السبب
السياسة الأمنية كانت تمنع الزوار غير المسجلين من إضافة سجلات.

## الحل
```sql
-- سياسة جديدة تسمح للجميع بالإضافة
CREATE POLICY "Allow all users to insert lead activities"
  ON lead_activities
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
```

## النتيجة
- ✅ لا مزيد من أخطاء 401
- ✅ تتبع النشاط يعمل للجميع
- ✅ Hot Leads Dashboard يجمع البيانات بشكل صحيح

---

**ملاحظة:** هذا آمن لأن جدول `lead_activities` يحتوي فقط على بيانات تتبع (tracking) وليس بيانات حساسة.
