# إصلاح خطأ Supabase 406 (PGRST116)

## التاريخ: 2026-02-04
## الحالة: ✅ تم الإصلاح

---

## الخطأ

```
GET https://fyxxrplokeqbgkrvscto.supabase.co/rest/v1/reservations?select=total_trees...&status=in.(confirmed,active) 406 (Not Acceptable)

{"code":"PGRST116","details":"The result contains … cannot coerce the result to a single JSON object"}
```

### الوصف

ظهر خطأ `PGRST116` من Supabase عند محاولة عرض تفاصيل سجل صيانة في صفحة "أشجاري الخضراء". الخطأ يحدث لأن الكود يتوقع صف واحد (single object) لكن الاستعلام يعيد صفوف متعددة.

---

## السبب الجذري

### الكود المشكل

في ملف `src/services/clientMaintenanceService.ts` - السطر 107-115:

```typescript
const reservationResult = await supabase
  .from('reservations')
  .select('total_trees')
  .eq('farm_id', recordResult.data.farm_id)
  .eq('user_id', user.id)
  .in('status', ['confirmed', 'active'])
  .single(); // ❌ المشكلة هنا!

const clientTreeCount = reservationResult.data?.total_trees || 0;
```

### التحليل

1. **السيناريو الإشكالي**: عندما يكون للمستخدم أكثر من حجز واحد في نفس المزرعة (كلاهما بحالة `confirmed` أو `active`)

2. **السلوك الخاطئ**: استخدام `.single()` يفترض أن الاستعلام سيعيد صف واحد فقط. إذا عاد أكثر من صف، يفشل الاستعلام بخطأ `PGRST116`

3. **الحالات التي تسبب المشكلة**:
   - المستخدم لديه حجز "confirmed" وحجز "active" في نفس المزرعة
   - المستخدم لديه عدة حجوزات "active" في نفس المزرعة
   - المستخدم قام بتجديد أو إضافة أشجار جديدة في نفس المزرعة

---

## الحل المطبق

### الكود الجديد

```typescript
const reservationResult = await supabase
  .from('reservations')
  .select('total_trees')
  .eq('farm_id', recordResult.data.farm_id)
  .eq('user_id', user.id)
  .in('status', ['confirmed', 'active']); // ✅ إزالة .single()

// ✅ جمع عدد الأشجار من جميع الحجوزات
const clientTreeCount = reservationResult.data?.reduce(
  (sum, res) => sum + (res.total_trees || 0), 
  0
) || 0;
```

### التغييرات

1. **إزالة `.single()`**: الآن الاستعلام يعيد جميع الحجوزات التي تطابق الشروط

2. **جمع عدد الأشجار**: استخدام `reduce()` لجمع `total_trees` من جميع الحجوزات

3. **معالجة القيم الفارغة**: التعامل مع الحالات التي قد لا يكون فيها `total_trees` محدد

---

## الفوائد

### 1. دقة أكثر في الحسابات

- الآن يتم احتساب **جميع** أشجار المستخدم في المزرعة، وليس فقط حجز واحد
- إذا كان للمستخدم 100 شجرة في حجز و50 في حجز آخر، سيظهر الإجمالي 150 شجرة

### 2. تجنب الأخطاء

- لا مزيد من خطأ `406 Not Acceptable`
- الكود يعمل مع أي عدد من الحجوزات

### 3. دعم السيناريوهات المتقدمة

- دعم المستخدمين الذين يقومون بتوسيع استثماراتهم
- دعم الحجوزات المتعددة في نفس المزرعة
- دعم ترقية الحجوزات من `confirmed` إلى `active`

---

## حالات الاختبار

### حالة 1: مستخدم لديه حجز واحد
```
Reservations:
- farm_id: A, user_id: U1, total_trees: 100, status: active

Result: 100 أشجار ✅
```

### حالة 2: مستخدم لديه حجزان (السيناريو المشكل سابقاً)
```
Reservations:
- farm_id: A, user_id: U1, total_trees: 100, status: confirmed
- farm_id: A, user_id: U1, total_trees: 50, status: active

Result: 150 أشجار ✅
Old Code: خطأ 406 ❌
```

### حالة 3: مستخدم لديه 3 حجوزات
```
Reservations:
- farm_id: A, user_id: U1, total_trees: 100, status: active
- farm_id: A, user_id: U1, total_trees: 50, status: active
- farm_id: A, user_id: U1, total_trees: 25, status: active

Result: 175 أشجار ✅
```

### حالة 4: مستخدم ليس لديه حجوزات
```
Reservations: []

Result: 0 أشجار ✅
```

---

## التأثير على رسوم الصيانة

الآن حساب رسوم الصيانة سيكون أكثر دقة:

```typescript
// إذا كانت تكلفة الشجرة = 12.50 ر.س
// والمستخدم لديه 150 شجرة (من حجزين)

cost_per_tree: 12.50
client_tree_count: 150
client_due_amount: 12.50 × 150 = 1,875 ر.س ✅
```

---

## الملفات المعدلة

1. `src/services/clientMaintenanceService.ts` - دالة `getMaintenanceDetails()`

---

## توصيات

### للمستقبل

1. استخدام دالة RPC لحساب عدد الأشجار الإجمالي
2. إضافة فهرس (index) على `(farm_id, user_id, status)` لتحسين الأداء
3. إضافة cache للحجوزات لتقليل الاستعلامات

### أفضل الممارسات

- **تجنب `.single()` مع `.in()`**: عند استخدام `.in()` للفلترة، من المحتمل أن يكون هناك أكثر من نتيجة
- **استخدام `.maybeSingle()`**: إذا كنت تتوقع 0 أو 1 نتيجة فقط
- **استخدام `.first()` أو جمع النتائج**: إذا كنت تتوقع عدة نتائج

---

## الخلاصة

تم حل خطأ `PGRST116` بنجاح. الآن صفحة "أشجاري الخضراء" تعمل بشكل صحيح حتى عندما يكون للمستخدم عدة حجوزات في نفس المزرعة، وحساب رسوم الصيانة أصبح أكثر دقة.
