# إصلاح خطأ Foreign Key في maintenance_payments (PGRST200)

## التاريخ: 2026-02-04
## الحالة: ✅ تم الإصلاح

---

## الخطأ

```
Error fetching payments summary: 
{code: 'PGRST200', details: "Searched for a foreign key relationship...", 
message: "Could not find a relationship between 'maintenance_payments' and 'user_id'"}

Error loading payments: 
{code: 'PGRST200', ...}
```

### الوصف

ظهر خطأ `PGRST200` من Supabase عند محاولة جلب بيانات سدادات الصيانة مع معلومات المستخدمين. الخطأ يحدث بسبب محاولة PostgREST عمل join تلقائي لكنه لا يستطيع إيجاد العلاقة المطلوبة.

---

## السبب الجذري

### المشكلة الأصلية

1. **تغيير Foreign Key**: في migration سابق (`20260204122957_fix_maintenance_payments_foreign_key_to_auth_users.sql`)، تم تغيير foreign key من:
   ```sql
   user_id → user_profiles(id)
   ```
   إلى:
   ```sql
   user_id → auth.users(id)
   ```

2. **استعلامات تحاول Join مع user_profiles**: لكن الكود كان لا يزال يحاول عمل join مع `user_profiles`:
   ```typescript
   .select(`
     *,
     user_profiles:user_id (full_name, phone, email)
   `)
   ```

3. **PostgREST لا يستطيع العثور على العلاقة**: لأن `user_id` الآن يشير إلى `auth.users` وليس `user_profiles`، فPostgREST لا يستطيع إيجاد علاقة foreign key للـjoin

4. **إضافة مشكلة**: حتى لو أردنا إرجاع foreign key إلى `user_profiles`، هناك سجلات في `maintenance_payments` لمستخدمين موجودين في `auth.users` لكن ليسوا في `user_profiles` (مستخدمون لم ينشئوا profile بعد)

---

## الحل المطبق

### الاستراتيجية

بدلاً من محاولة إصلاح foreign key (والذي سيفشل بسبب بيانات موجودة)، قمنا بتعديل الاستعلامات لجلب بيانات `user_profiles` بشكل منفصل.

### التغييرات

#### 1. operationsService.ts - دالة `getMaintenancePaymentsSummary()`

**قبل:**
```typescript
.select(`
  id,
  user_id,
  ...
  user_profiles:user_id (full_name),  // ❌ يفشل
  farms:farm_id (farm_name),
  ...
`)

const formatted = (data || []).map((payment: any) => ({
  full_name: payment.user_profiles?.full_name || 'غير معروف',
  ...
}));
```

**بعد:**
```typescript
.select(`
  id,
  user_id,
  ...
  // ✅ إزالة join مع user_profiles
  farms:farm_id (farm_name),
  ...
`)

// ✅ جلب بيانات user_profiles بشكل منفصل
const formatted = await Promise.all((data || []).map(async (payment: any) => {
  let full_name = 'غير معروف';

  try {
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', payment.user_id)
      .maybeSingle();

    if (profileData?.full_name) {
      full_name = profileData.full_name;
    }
  } catch (err) {
    console.warn('Could not fetch user profile:', err);
  }

  return {
    full_name,
    ...
  };
}));
```

#### 2. operationsService.ts - دالة `getMaintenancePaymentsByFee()`

**قبل:**
```typescript
.select(`
  *,
  user_profiles:user_id (full_name, phone, email)  // ❌ يفشل
`)

return data || [];
```

**بعد:**
```typescript
.select('*')  // ✅ بدون join

// ✅ إضافة بيانات user_profiles بشكل منفصل
const enriched = await Promise.all((data || []).map(async (payment: any) => {
  try {
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('full_name, phone, email')
      .eq('id', payment.user_id)
      .maybeSingle();

    return {
      ...payment,
      user_profiles: profileData || { full_name: 'غير معروف', phone: null, email: null }
    };
  } catch (err) {
    return {
      ...payment,
      user_profiles: { full_name: 'غير معروف', phone: null, email: null }
    };
  }
}));

return enriched;
```

#### 3. maintenancePaymentService.ts - إصلاح صياغة العلاقات

**قبل:**
```typescript
.select(`
  *,
  maintenance_fees (  // ❌ صياغة غير دقيقة
    id,
    cost_per_tree
  )
`)
```

**بعد:**
```typescript
.select(`
  *,
  maintenance_fees:maintenance_fee_id (  // ✅ تحديد صريح للعلاقة
    id,
    cost_per_tree
  )
`)
```

---

## الفوائد

### 1. حل مشكلة Foreign Key

- لا نحتاج لتغيير foreign key في قاعدة البيانات
- يعمل مع البيانات الموجودة حالياً
- لا يتطلب migration جديد

### 2. مرونة أكبر

- إذا لم يكن للمستخدم `user_profile`، نعرض "غير معروف" بدلاً من فشل الاستعلام
- معالجة الأخطاء بشكل أفضل
- لا يعتمد على PostgREST joins

### 3. دقة في التحكم

- نحن نتحكم بالضبط في كيفية جلب البيانات
- يمكننا إضافة معالجة خاصة لكل حالة
- تحسين رسائل الخطأ

---

## الأداء

### الملاحظات

- الحل الجديد يقوم بـquery منفصل لكل سجل دفع للحصول على بيانات المستخدم
- قد يكون أبطأ قليلاً من join تلقائي
- لكنه أكثر موثوقية ويعمل مع جميع الحالات

### التحسينات المستقبلية (اختياري)

1. **استخدام RPC function**:
   ```sql
   CREATE FUNCTION get_payments_with_user_info() 
   RETURNS TABLE (...) AS $$
   BEGIN
     RETURN QUERY
     SELECT 
       mp.*,
       up.full_name,
       up.phone,
       up.email
     FROM maintenance_payments mp
     LEFT JOIN user_profiles up ON up.id = mp.user_id;
   END;
   $$ LANGUAGE plpgsql;
   ```

2. **Cache user profiles**: حفظ بيانات المستخدمين في الذاكرة المؤقتة

3. **Batch queries**: جلب جميع user_profiles في استعلام واحد

---

## الملفات المعدلة

1. `src/services/operationsService.ts`
   - دالة `getMaintenancePaymentsSummary()`
   - دالة `getMaintenancePaymentsByFee()`

2. `src/services/maintenancePaymentService.ts`
   - دالة `getUserPayments()`
   - دالة `getPaymentById()`

---

## اختبار الحل

### الحالات المختبرة

1. ✅ جلب ملخص السدادات (getMaintenancePaymentsSummary)
2. ✅ جلب سدادات رسوم صيانة محددة (getMaintenancePaymentsByFee)
3. ✅ جلب سدادات مستخدم محدد (getUserPayments)
4. ✅ جلب سجل دفع محدد (getPaymentById)

### السيناريوهات المدعومة

- ✅ مستخدم لديه `user_profile` كامل
- ✅ مستخدم ليس لديه `user_profile` (يظهر "غير معروف")
- ✅ مستخدم تم حذف `user_profile` الخاص به
- ✅ أخطاء في الشبكة أو قاعدة البيانات

---

## الخلاصة

تم حل خطأ `PGRST200` بنجاح من خلال تعديل طريقة جلب بيانات المستخدمين في استعلامات سدادات الصيانة. الحل يعمل مع البيانات الموجودة حالياً ولا يتطلب تغييرات في قاعدة البيانات، مع توفير معالجة أفضل للأخطاء والحالات الاستثنائية.
