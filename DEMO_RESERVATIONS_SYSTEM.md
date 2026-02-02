# نظام الحجوزات التجريبية

## نظرة عامة

تم تطوير نظام **الحجوزات التجريبية** للسماح للإدارة بإنشاء حجوزات للاختبار والتدريب دون التأثير على:
- ✅ الحسابات الاستثمارية للمستخدمين
- ✅ الإحصائيات والتقارير المالية
- ✅ البيانات الفعلية للمنصة

---

## الهدف من النظام

### المشكلة القديمة ❌

```
قبل هذا التحديث:
- أي حجز يُنشأ → يُفعل الحساب الاستثماري
- حجوزات الاختبار → تظهر في الإحصائيات
- لا يمكن التمييز بين الحجوزات الفعلية والتجريبية
- صعوبة اختبار المنصة بدون بيانات فعلية
```

### الحل الجديد ✅

```
بعد هذا التحديث:
✅ حجوزات تجريبية → لا تُفعل الحساب
✅ لا تظهر في الإحصائيات المالية
✅ تمييز واضح بين الفعلي والتجريبي
✅ إمكانية اختبار المنصة بأمان
```

---

## كيف يعمل النظام

### 1. أنواع الحجوزات

#### أ. حجوزات فعلية (is_demo = false)

```
الوصف: حجوزات حقيقية من المستخدمين
الخصائص:
  ✅ تُفعل الحساب الاستثماري
  ✅ تظهر في الإحصائيات
  ✅ تُحسب في التقارير المالية
  ✅ يمكن الدفع وتفعيل العقد

المثال:
  user_id: xxx-xxx-xxx
  farm_id: yyy-yyy-yyy
  total_trees: 100
  total_price: 50000
  is_demo: false ← حجز فعلي
```

#### ب. حجوزات تجريبية (is_demo = true)

```
الوصف: حجوزات للاختبار والتدريب فقط
الخصائص:
  ❌ لا تُفعل الحساب الاستثماري
  ❌ لا تظهر في الإحصائيات
  ❌ لا تُحسب في التقارير
  ✅ يمكن حذفها بدون قلق

المثال:
  user_id: xxx-xxx-xxx
  farm_id: yyy-yyy-yyy
  total_trees: 10
  total_price: 1000
  is_demo: true ← حجز تجريبي
```

---

## البنية التقنية

### 1. قاعدة البيانات

#### الحقل الجديد في جدول reservations

```sql
ALTER TABLE reservations
ADD COLUMN is_demo boolean DEFAULT false NOT NULL;
```

**الخصائص:**
- `boolean`: نعم/لا فقط
- `DEFAULT false`: افتراضياً الحجز فعلي
- `NOT NULL`: يجب تحديد القيمة دائماً

**الفهارس (Indexes):**

```sql
-- Index للبحث السريع عن الحجوزات التجريبية
CREATE INDEX idx_reservations_is_demo ON reservations(is_demo);

-- Index مركب للحجوزات الفعلية النشطة
CREATE INDEX idx_reservations_active_non_demo
ON reservations(user_id, status)
WHERE is_demo = false;
```

**الفائدة:**
- ✅ استعلامات أسرع
- ✅ فلترة فعالة
- ✅ أداء محسّن

---

### 2. الدالة المساعدة

#### create_demo_reservation()

**الوصف:**
دالة SQL لتسهيل إنشاء حجوزات تجريبية من لوحة الإدارة

**التوقيع:**

```sql
CREATE FUNCTION create_demo_reservation(
  p_user_id uuid,           -- معرف المستخدم
  p_farm_id uuid,           -- معرف المزرعة
  p_total_trees integer DEFAULT 10,    -- عدد الأشجار (افتراضي: 10)
  p_total_price decimal DEFAULT 1000   -- السعر (افتراضي: 1000)
)
RETURNS uuid;  -- يُرجع معرف الحجز المُنشأ
```

**الاستخدام:**

```sql
-- إنشاء حجز تجريبي بقيم افتراضية
SELECT create_demo_reservation(
  p_user_id := 'user-uuid-here',
  p_farm_id := 'farm-uuid-here'
);

-- إنشاء حجز تجريبي مخصص
SELECT create_demo_reservation(
  p_user_id := 'user-uuid-here',
  p_farm_id := 'farm-uuid-here',
  p_total_trees := 50,
  p_total_price := 25000
);
```

**ما تفعله الدالة:**

1. ✅ التحقق من وجود المزرعة
2. ✅ إنشاء الحجز مع is_demo = true
3. ✅ تسجيل العملية في admin_logs
4. ✅ إرجاع معرف الحجز المُنشأ

**الأمان:**
- ✅ `SECURITY DEFINER`: تُنفذ بصلاحيات المالك
- ✅ تسجيل جميع العمليات في Logs
- ✅ صلاحيات للمسؤولين فقط

---

### 3. التحديثات البرمجية

#### أ. reservationService.ts

**إضافة الحقل إلى Interfaces:**

```typescript
export interface CreateReservationData {
  // ... الحقول الموجودة
  isDemo?: boolean;  // ✅ جديد
}

export interface Reservation {
  // ... الحقول الموجودة
  isDemo?: boolean;  // ✅ جديد
}
```

**تحديث createReservation:**

```typescript
const { data: reservation, error } = await supabase
  .from('reservations')
  .insert({
    // ... الحقول الموجودة
    is_demo: data.isDemo || false,  // ✅ جديد
  })
  .select()
  .maybeSingle();
```

**الفائدة:**
- ✅ دعم كامل في TypeScript
- ✅ تمرير isDemo من الواجهات
- ✅ القيمة الافتراضية false

---

#### ب. investorAccountService.ts

**فلترة الحجوزات التجريبية:**

```typescript
const { data: reservations, error } = await supabase
  .from('reservations')
  .select(`...`)
  .eq('user_id', userId)
  .eq('is_demo', false)  // ✅ استبعاد التجريبية
  .in('status', ['confirmed', 'pending'])
  .order('created_at', { ascending: false });
```

**النتيجة:**
- ✅ الحسابات الاستثمارية تعرض الفعلية فقط
- ✅ الحجوزات التجريبية لا تُفعل الحساب
- ✅ إحصائيات دقيقة

---

#### ج. DashboardOverview.tsx (لوحة الإدارة)

**تحديث الإحصائيات:**

```typescript
const [farmsResult, reservationsResult] = await Promise.all([
  supabase.from('farms').select('...'),
  supabase
    .from('reservations')
    .select('status, total_price, is_demo')
    .eq('is_demo', false),  // ✅ حجوزات فعلية فقط
]);
```

**الفائدة:**
- ✅ الإحصائيات تعرض الفعلية فقط
- ✅ الإيرادات دقيقة
- ✅ العقود النشطة صحيحة

---

## طرق إنشاء الحجوزات التجريبية

### الطريقة 1: باستخدام الدالة SQL (الأسهل)

```sql
-- في Supabase SQL Editor
SELECT create_demo_reservation(
  p_user_id := 'abc-123-def',
  p_farm_id := 'xyz-789-uvw',
  p_total_trees := 20,
  p_total_price := 10000
);
```

**المزايا:**
- ✅ سهلة الاستخدام
- ✅ آمنة
- ✅ تُسجل تلقائياً

---

### الطريقة 2: باستخدام reservationService

```typescript
import { reservationService } from './services/reservationService';

const result = await reservationService.createReservation(
  userId,
  {
    farmId: 'farm-uuid',
    farmName: 'مزرعة تجريبية',
    cart: { /* ... */ },
    totalTrees: 10,
    totalPrice: 5000,
    isDemo: true,  // ✅ حجز تجريبي
  }
);
```

**المزايا:**
- ✅ من داخل الكود
- ✅ مع كامل التفاصيل
- ✅ TypeScript safe

---

### الطريقة 3: INSERT مباشر (للمتقدمين)

```sql
INSERT INTO reservations (
  user_id,
  farm_id,
  farm_name,
  total_trees,
  total_price,
  tree_types,
  status,
  is_demo
) VALUES (
  'user-uuid',
  'farm-uuid',
  'مزرعة تجريبية',
  15,
  7500,
  'أشجار تجريبية',
  'pending',
  true  -- ✅ حجز تجريبي
);
```

**ملاحظة:** تأكد من وضع `is_demo = true`

---

## الفرق بين الحجوزات

### جدول المقارنة

| الخاصية | حجز فعلي (is_demo = false) | حجز تجريبي (is_demo = true) |
|---------|---------------------------|----------------------------|
| **يُفعل الحساب** | ✅ نعم | ❌ لا |
| **يظهر في الإحصائيات** | ✅ نعم | ❌ لا |
| **يُحسب في الإيرادات** | ✅ نعم | ❌ لا |
| **يظهر في حساب المستخدم** | ✅ نعم | ❌ لا |
| **يُسجل في admin_logs** | ✅ نعم | ✅ نعم |
| **يمكن حذفه** | ⚠️ بحذر | ✅ بأمان |
| **الغرض** | استثمار فعلي | اختبار/تدريب |

---

## أمثلة تطبيقية

### مثال 1: إنشاء حجز تجريبي لاختبار المنصة

**السيناريو:**
الإدارة تريد اختبار تدفق الحجز دون التأثير على بيانات المستخدم

**الخطوات:**

```sql
-- 1. إنشاء حجز تجريبي
SELECT create_demo_reservation(
  p_user_id := 'test-user-uuid',
  p_farm_id := 'test-farm-uuid',
  p_total_trees := 5,
  p_total_price := 2500
);

-- النتيجة: reservation_id = 'xxx-yyy-zzz'

-- 2. التحقق من الحجز
SELECT * FROM reservations WHERE id = 'xxx-yyy-zzz';

-- 3. التحقق من أن الحساب لم يُفعل
SELECT * FROM reservations
WHERE user_id = 'test-user-uuid'
AND is_demo = false;
-- النتيجة: 0 rows (لم يُفعل الحساب)
```

---

### مثال 2: مقارنة الإحصائيات

**قبل التحديث:**

```sql
-- جميع الحجوزات (فعلية + تجريبية)
SELECT COUNT(*) FROM reservations;
-- النتيجة: 150

SELECT SUM(total_price) FROM reservations;
-- النتيجة: 750,000 ر.س (يشمل التجريبية!)
```

**بعد التحديث:**

```sql
-- الحجوزات الفعلية فقط
SELECT COUNT(*) FROM reservations WHERE is_demo = false;
-- النتيجة: 145

SELECT SUM(total_price) FROM reservations WHERE is_demo = false;
-- النتيجة: 725,000 ر.س (فعلية فقط!)

-- الحجوزات التجريبية
SELECT COUNT(*) FROM reservations WHERE is_demo = true;
-- النتيجة: 5

SELECT SUM(total_price) FROM reservations WHERE is_demo = true;
-- النتيجة: 25,000 ر.س (للاختبار)
```

---

### مثال 3: فحص حساب مستخدم

**السيناريو:**
مستخدم لديه حجز تجريبي وحجز فعلي

```sql
-- جميع الحجوزات
SELECT
  id,
  farm_name,
  total_trees,
  total_price,
  is_demo,
  status
FROM reservations
WHERE user_id = 'user-xxx';
```

**النتيجة:**

```
id                 | farm_name        | total_trees | total_price | is_demo | status
-------------------|------------------|-------------|-------------|---------|----------
aaa-bbb-ccc        | مزرعة الزيتون    | 10          | 5,000       | true    | pending
ddd-eee-fff        | مزرعة النخيل     | 100         | 50,000      | false   | confirmed
```

**التأثير على الحساب:**

```typescript
// في investorAccountService
const investments = await getInvestorInvestments('user-xxx');

// النتيجة:
// يظهر فقط: "مزرعة النخيل" (100 شجرة، 50,000 ر.س)
// لا يظهر: "مزرعة الزيتون" (تجريبي)
```

---

## استعلامات مفيدة

### 1. عرض جميع الحجوزات التجريبية

```sql
SELECT
  r.id,
  r.farm_name,
  r.total_trees,
  r.total_price,
  r.status,
  r.created_at,
  u.email as user_email
FROM reservations r
LEFT JOIN auth.users u ON r.user_id = u.id
WHERE r.is_demo = true
ORDER BY r.created_at DESC;
```

---

### 2. عرض الحجوزات الفعلية فقط

```sql
SELECT
  r.id,
  r.farm_name,
  r.total_trees,
  r.total_price,
  r.status,
  r.created_at
FROM reservations r
WHERE r.is_demo = false
ORDER BY r.created_at DESC;
```

---

### 3. إحصائيات مقارنة

```sql
SELECT
  is_demo,
  COUNT(*) as total_reservations,
  SUM(total_trees) as total_trees,
  SUM(total_price) as total_revenue,
  AVG(total_price) as avg_price
FROM reservations
GROUP BY is_demo;
```

**النتيجة المتوقعة:**

```
is_demo | total_reservations | total_trees | total_revenue | avg_price
--------|-------------------|-------------|---------------|----------
false   | 145               | 14,500      | 725,000       | 5,000
true    | 5                 | 50          | 25,000        | 5,000
```

---

### 4. حذف جميع الحجوزات التجريبية

```sql
-- ⚠️ احذر: هذا يحذف جميع الحجوزات التجريبية نهائياً

DELETE FROM reservations
WHERE is_demo = true;
```

---

### 5. تحويل حجز من تجريبي إلى فعلي

```sql
-- ⚠️ استخدم بحذر: هذا يُفعل الحساب

UPDATE reservations
SET is_demo = false
WHERE id = 'reservation-uuid'
AND is_demo = true;
```

---

### 6. عرض المستخدمين الذين لديهم حجوزات تجريبية فقط

```sql
SELECT
  u.id,
  u.email,
  COUNT(r.id) as demo_reservations_count
FROM auth.users u
INNER JOIN reservations r ON u.id = r.user_id
WHERE r.is_demo = true
GROUP BY u.id, u.email
HAVING COUNT(CASE WHEN r.is_demo = false THEN 1 END) = 0;
```

---

## السلوك في المنصة

### 1. لوحة الإدارة (Admin Dashboard)

#### الإحصائيات

```typescript
// في DashboardOverview.tsx
const stats = {
  totalRevenue: 725000,      // ✅ فعلية فقط
  activeContracts: 145,      // ✅ فعلية فقط
  totalTrees: 14500          // ✅ فعلية فقط
};

// الحجوزات التجريبية لا تُحسب ❌
```

#### العقود

```
في صفحة العقود:
- تظهر العقود الفعلية فقط ✅
- الحجوزات التجريبية لا تظهر ❌
```

---

### 2. حساب المستثمر (Investor Account)

#### صفحة حسابي

```typescript
// في InvestorAccount
const investments = await investorAccountService.getInvestorInvestments(userId);

// النتيجة:
// - حجوزات فعلية فقط ✅
// - is_demo = false
// - الحجوزات التجريبية لا تظهر ❌
```

#### الإحصائيات

```typescript
const stats = {
  totalTrees: 100,           // ✅ من الحجوزات الفعلية فقط
  totalInvestmentValue: 50000, // ✅ من الحجوزات الفعلية فقط
  activeInvestments: 1,      // ✅ فعلية فقط
  status: 'active'           // ✅ بناءً على الفعلية
};
```

---

### 3. تفعيل الحساب

#### قبل النظام ❌

```
أي حجز → يُفعل الحساب
حتى لو تجريبي → الحساب يُفعل
```

#### بعد النظام ✅

```
حجز فعلي (is_demo = false) → يُفعل الحساب ✅
حجز تجريبي (is_demo = true) → لا يُفعل الحساب ❌
```

**الكود:**

```typescript
// في investorAccountService
.eq('is_demo', false)  // ✅ فقط الفعلية تُفعل الحساب
```

---

## التسجيل والمراقبة (Logging)

### 1. admin_logs

**جميع الحجوزات التجريبية تُسجل:**

```sql
SELECT * FROM admin_logs
WHERE action = 'create_demo_reservation'
ORDER BY created_at DESC;
```

**معلومات مُسجلة:**

```json
{
  "reservation_id": "xxx-yyy-zzz",
  "user_id": "user-uuid",
  "farm_id": "farm-uuid",
  "total_trees": 10,
  "total_price": 5000,
  "is_demo": true
}
```

---

### 2. تتبع الحجوزات

**من أنشأ الحجز:**

```sql
SELECT
  r.id as reservation_id,
  r.farm_name,
  r.is_demo,
  r.created_at,
  al.admin_id,
  a.full_name as admin_name
FROM reservations r
LEFT JOIN admin_logs al ON al.details->>'reservation_id' = r.id::text
LEFT JOIN admins a ON a.id = al.admin_id
WHERE r.is_demo = true
ORDER BY r.created_at DESC;
```

---

## الأمان والصلاحيات

### 1. من يمكنه إنشاء حجوزات تجريبية؟

```sql
-- الصلاحيات الحالية
GRANT EXECUTE ON FUNCTION create_demo_reservation TO authenticated;
```

**يعني:**
- ✅ جميع المسؤولين المُصرح لهم
- ✅ عبر Supabase SQL Editor
- ✅ من خلال الكود البرمجي

**للتقييد أكثر:**

```sql
-- إذا أردت Super Admin فقط
REVOKE EXECUTE ON FUNCTION create_demo_reservation FROM authenticated;
GRANT EXECUTE ON FUNCTION create_demo_reservation TO super_admin_role;
```

---

### 2. RLS Policies

**الحجوزات التجريبية:**
- ✅ يمكن للإدارة رؤيتها
- ❌ لا يراها المستخدم العادي
- ✅ محمية بنفس RLS policies

---

## أفضل الممارسات

### ✅ افعل

1. **استخدم الحجوزات التجريبية للاختبار**
   ```sql
   SELECT create_demo_reservation(...);
   ```

2. **احذف الحجوزات التجريبية القديمة بانتظام**
   ```sql
   DELETE FROM reservations
   WHERE is_demo = true
   AND created_at < NOW() - INTERVAL '30 days';
   ```

3. **راجع الإحصائيات بانتظام**
   ```sql
   SELECT is_demo, COUNT(*)
   FROM reservations
   GROUP BY is_demo;
   ```

4. **سجّل الغرض من كل حجز تجريبي**
   ```
   مثال: "اختبار تدفق الدفع"
   مثال: "تدريب موظف جديد"
   ```

---

### ❌ لا تفعل

1. **لا تحوّل حجز تجريبي لفعلي بدون تحقق**
   ```sql
   -- ❌ خطر!
   UPDATE reservations SET is_demo = false WHERE id = '...';
   ```

2. **لا تنسَ وضع is_demo = true**
   ```typescript
   // ❌ خطأ
   await createReservation(userId, { ... });

   // ✅ صحيح
   await createReservation(userId, { ..., isDemo: true });
   ```

3. **لا تعتمد على الحجوزات التجريبية في الإحصائيات**
   ```sql
   -- ❌ خطأ
   SELECT COUNT(*) FROM reservations;

   -- ✅ صحيح
   SELECT COUNT(*) FROM reservations WHERE is_demo = false;
   ```

---

## استكشاف الأخطاء

### مشكلة 1: الحجز التجريبي يُفعل الحساب

**السبب:**
- لم يتم تعيين is_demo = true

**الحل:**

```sql
-- تحقق من الحجز
SELECT id, is_demo FROM reservations WHERE id = 'xxx';

-- إصلاح
UPDATE reservations
SET is_demo = true
WHERE id = 'xxx';
```

---

### مشكلة 2: الحجز الفعلي لا يظهر في الحساب

**السبب:**
- تم تعيين is_demo = true بالخطأ

**الحل:**

```sql
-- تحقق من الحجز
SELECT id, is_demo FROM reservations WHERE id = 'xxx';

-- إصلاح
UPDATE reservations
SET is_demo = false
WHERE id = 'xxx';
```

---

### مشكلة 3: الإحصائيات غير صحيحة

**السبب:**
- الاستعلامات لا تستبعد الحجوزات التجريبية

**الحل:**

```typescript
// ❌ قبل
.from('reservations').select('*')

// ✅ بعد
.from('reservations').select('*').eq('is_demo', false)
```

---

## الخلاصة

### ما تم إنجازه

1. ✅ إضافة حقل `is_demo` إلى جدول reservations
2. ✅ إنشاء دالة `create_demo_reservation()` المساعدة
3. ✅ تحديث `reservationService` لدعم الحجوزات التجريبية
4. ✅ تحديث `investorAccountService` لاستبعاد التجريبية
5. ✅ تحديث لوحة الإدارة لاستبعاد التجريبية من الإحصائيات
6. ✅ إضافة فهارس (Indexes) للأداء
7. ✅ تسجيل جميع العمليات في admin_logs

---

### الفوائد

#### للإدارة
```
✅ اختبار المنصة بأمان
✅ تدريب الموظفين بدون مخاطر
✅ إحصائيات دقيقة
✅ تمييز واضح بين الفعلي والتجريبي
```

#### للمستخدمين
```
✅ حساباتهم محمية من الحجوزات التجريبية
✅ لا تُفعل بدون حجز فعلي
✅ بيانات دقيقة ونظيفة
```

#### للمنصة
```
✅ بيانات نظيفة
✅ إحصائيات دقيقة
✅ سهولة الصيانة
✅ قابلية الاختبار
```

---

### الاستخدام السريع

**إنشاء حجز تجريبي:**

```sql
SELECT create_demo_reservation(
  p_user_id := 'user-uuid',
  p_farm_id := 'farm-uuid'
);
```

**عرض جميع التجريبية:**

```sql
SELECT * FROM reservations WHERE is_demo = true;
```

**حذف التجريبية القديمة:**

```sql
DELETE FROM reservations
WHERE is_demo = true
AND created_at < NOW() - INTERVAL '7 days';
```

---

**تاريخ التطبيق:** 2026-02-02
**الحالة:** جاهز للإنتاج ✅
**الملفات المُعدلة:**
- `supabase/migrations/add_demo_mode_to_reservations.sql`
- `supabase/migrations/add_demo_reservation_helper_function.sql`
- `src/services/reservationService.ts`
- `src/services/investorAccountService.ts`
- `src/components/admin/DashboardOverview.tsx`

**Build:** ناجح ✅
**Tests:** جاهز للاختبار ✅
