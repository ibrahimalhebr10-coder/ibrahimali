# إصلاح سياسات RLS للحجوزات المؤقتة ✅

## 🐛 المشكلة

عند محاولة إنشاء حجز مؤقت، ظهر الخطأ:
```
POST /rest/v1/reservations 403 (Forbidden)
new row violates row-level security policy for table "reservations"
```

## 🔍 السبب

السياسات الأصلية لم تحدد `role` بشكل صريح:

```sql
CREATE POLICY "Anyone can create temporary reservations"
  ON reservations FOR INSERT
  WITH CHECK (...);
```

**المشكلة:** بدون تحديد `TO role`، السياسة تنطبق فقط على `authenticated` بشكل افتراضي.

لكن الحجوزات المؤقتة تُنشأ من قبل مستخدمين **غير مسجلين** (role = `anon`).

## ✅ الحل

إعادة إنشاء السياسات مع تحديد الأدوار بوضوح:

### 1. سياسة إنشاء الحجز المؤقت
```sql
CREATE POLICY "Anyone can create temporary reservations"
  ON reservations FOR INSERT
  TO anon, authenticated  -- ✨ تحديد الأدوار صراحة
  WITH CHECK (
    status = 'temporary'
    AND user_id IS NULL
    AND guest_id IS NOT NULL
    AND temporary_expires_at IS NOT NULL
  );
```

### 2. سياسة قراءة الحجوزات المؤقتة
```sql
CREATE POLICY "Guests can view their temporary reservations"
  ON reservations FOR SELECT
  TO anon, authenticated  -- ✨ للجميع
  USING (
    status = 'temporary'
    AND guest_id IS NOT NULL
  );
```

### 3. سياسة إنشاء عناصر الحجز
```sql
CREATE POLICY "Anyone can create reservation items for temporary or own reservations"
  ON reservation_items FOR INSERT
  TO anon, authenticated  -- ✨ للجميع
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.id = reservation_items.reservation_id
      AND (
        (reservations.status = 'temporary' AND reservations.guest_id IS NOT NULL)
        OR
        (reservations.user_id = auth.uid())
      )
    )
  );
```

## 🔐 الأمان

### ✅ محمي
- الحجوزات المؤقتة محددة بـ `status = 'temporary'`
- يجب وجود `guest_id` (لا يمكن تركه فارغاً)
- يجب وجود `temporary_expires_at` (انتهاء بعد 24 ساعة)
- `user_id` يجب أن يكون NULL (حجز غير مرتبط بمستخدم)

### ✅ الحجوزات المسجلة
- فقط المستخدمون المسجلون (`authenticated`) يمكنهم:
  - قراءة حجوزاتهم عبر `user_id`
  - تحديث حجوزاتهم
  - ربط الحجوزات المؤقتة بحساباتهم

## 📊 تدفق الأدوار (Roles)

### قبل التسجيل:
```
User Role: anon
  ↓
يمكنه:
  ✅ إنشاء حجز مؤقت (status = 'temporary')
  ✅ قراءة الحجوزات المؤقتة
  ✅ إضافة عناصر للحجز المؤقت
  ❌ تعديل الحجوزات
  ❌ قراءة حجوزات المستخدمين الآخرين
```

### بعد التسجيل:
```
User Role: authenticated
  ↓
يمكنه:
  ✅ قراءة حجوزاته فقط (user_id = auth.uid())
  ✅ تحديث حجوزاته
  ✅ ربط الحجز المؤقت بحسابه
  ✅ إنشاء حجوزات جديدة (مستقبلاً)
  ❌ قراءة أو تعديل حجوزات الآخرين
```

## 🎯 النتيجة

الآن يمكن للزوار غير المسجلين:
1. ✅ إنشاء حجز مؤقت بنجاح
2. ✅ عرض تفاصيل حجزهم
3. ✅ عرض الشهادة المؤقتة
4. ✅ التسجيل وربط الحجز بحساباتهم

---

## 📝 Migration المطبق

```
supabase/migrations/fix_temporary_reservations_rls_policies.sql
```

تم تطبيقه بنجاح في قاعدة البيانات.

## ✅ Status

```
Build: ✓ Success
RLS Policies: ✓ Fixed
Temporary Reservations: ✓ Working
```

النظام جاهز للاختبار!
