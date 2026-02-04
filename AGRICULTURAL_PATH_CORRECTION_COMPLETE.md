# إصلاح المسار الزراعي - زر أشجاري الخضراء

التاريخ: 4 فبراير 2026
الحالة: تم الإصلاح بالكامل ✅

---

## المشكلة التي كانت موجودة

### الخطأ الكبير
كان التنفيذ السابق يعمل فقط للمسار الاستثماري (أشجاري الذهبية) وليس للمسار الزراعي (أشجاري الخضراء)!

### التفصيل
- الـ RPC function القديمة: `get_client_maintenance_records`
- كانت تجلب فقط من `investment_assets`
- المسار الزراعي يستخدم `reservations` مع `path_type = 'agricultural'`
- لذا العملاء الزراعيون لم يروا أي بيانات!

---

## الإصلاح الكامل

### 1. إنشاء RPC Function للمسار الزراعي ✅

**الملف:** `create_agricultural_maintenance_records_function.sql`

```sql
CREATE OR REPLACE FUNCTION get_agricultural_client_maintenance_records(client_user_id uuid)
RETURNS TABLE (
  maintenance_id uuid,
  farm_id uuid,
  farm_name text,
  maintenance_type text,
  maintenance_date date,
  status text,
  total_amount numeric,
  cost_per_tree numeric,
  client_tree_count bigint,
  client_due_amount numeric,
  payment_status text,
  payment_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mr.id as maintenance_id,
    mr.farm_id,
    f.name_ar as farm_name,
    mr.maintenance_type,
    mr.maintenance_date,
    mr.status,
    mf.total_amount,
    mf.cost_per_tree,
    r.tree_count::bigint as client_tree_count,
    (r.tree_count * COALESCE(mf.cost_per_tree, 0)) as client_due_amount,
    COALESCE(mp.payment_status, 'pending') as payment_status,
    mp.id as payment_id
  FROM maintenance_records mr
  JOIN farms f ON f.id = mr.farm_id
  JOIN reservations r ON r.farm_id = mr.farm_id
    AND r.user_id = client_user_id
    AND r.status IN ('active', 'confirmed')
    AND r.path_type = 'agricultural'
  LEFT JOIN maintenance_fees mf ON mf.maintenance_id = mr.id
  LEFT JOIN maintenance_payments mp ON mp.maintenance_fee_id = mf.id AND mp.user_id = client_user_id
  WHERE mr.status = 'published'
  ORDER BY mr.maintenance_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**الفرق الرئيسي:**
- المسار الزراعي: `JOIN reservations` مع `path_type = 'agricultural'`
- المسار الاستثماري: `JOIN investment_assets`
- عدد الأشجار: من `reservations.tree_count` للمسار الزراعي

---

### 2. تعديل clientMaintenanceService ✅

**التعديل:** إضافة parameter `pathType`

```typescript
async getClientMaintenanceRecords(pathType: 'agricultural' | 'investment' = 'agricultural'): Promise<ClientMaintenanceRecord[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const rpcFunction = pathType === 'agricultural'
    ? 'get_agricultural_client_maintenance_records'
    : 'get_client_maintenance_records';

  const { data, error } = await supabase
    .rpc(rpcFunction, { client_user_id: user.id });

  if (error) throw error;
  return data || [];
}
```

**الآن:**
- يدعم كلا المسارين
- يستخدم الـ RPC function المناسبة حسب المسار
- Default هو `agricultural` (المسار الزراعي)

---

### 3. تعديل MyGreenTrees Component ✅

**التعديلات الرئيسية:**

#### أ. استيراد useAuth
```typescript
import { useAuth } from '../contexts/AuthContext';
```

#### ب. استخدام identity
```typescript
const { identity } = useAuth();
```

#### ج. تحميل البيانات حسب المسار
```typescript
const loadMaintenanceRecords = async () => {
  try {
    setLoading(true);
    const pathType = identity === 'agricultural' ? 'agricultural' : 'investment';
    const data = await clientMaintenanceService.getClientMaintenanceRecords(pathType);
    setRecords(data);
  } catch (error) {
    console.error('Error loading maintenance records:', error);
    alert('خطأ في تحميل بيانات الصيانة');
  } finally {
    setLoading(false);
  }
};
```

#### د. تعديل العنوان والألوان
```typescript
const isAgricultural = identity === 'agricultural';

<h1>
  {isAgricultural ? 'أشجاري الخضراء' : 'أشجاري الذهبية'}
</h1>

<div className={`w-20 h-20 rounded-3xl ${
  isAgricultural
    ? 'bg-gradient-to-br from-green-600 to-emerald-600'
    : 'bg-gradient-to-br from-amber-600 to-yellow-600'
}`}>
```

---

## البنية الصحيحة الآن

### المسار الزراعي (أشجاري الخضراء)

```
العميل (user_id)
  ↓
الحجز الزراعي (reservations WHERE path_type = 'agricultural')
  ↓
المزرعة (farms)
  ↓
الصيانات المنشورة (maintenance_records WHERE status = 'published')
  ↓
الرسوم (maintenance_fees)
  ↓
الحساب: reservations.tree_count × cost_per_tree
```

### المسار الاستثماري (أشجاري الذهبية)

```
العميل (user_id)
  ↓
الأصول الاستثمارية (investment_assets)
  ↓
المزرعة (farms)
  ↓
الصيانات المنشورة (maintenance_records WHERE status = 'published')
  ↓
الرسوم (maintenance_fees)
  ↓
الحساب: COUNT(investment_assets) × cost_per_tree
```

---

## الاختلافات الرئيسية

| الجانب | المسار الزراعي | المسار الاستثماري |
|--------|-----------------|-------------------|
| الاسم | أشجاري الخضراء | أشجاري الذهبية |
| اللون | أخضر (Green) | ذهبي (Amber/Yellow) |
| الجدول | reservations | investment_assets |
| عدد الأشجار | tree_count | COUNT(assets) |
| RPC Function | get_agricultural_client_maintenance_records | get_client_maintenance_records |

---

## التأكيد النهائي

### ✅ الآن النظام يعمل بشكل صحيح:

1. **المسار الزراعي:**
   - العميل يرى "أشجاري الخضراء"
   - خلفية خضراء
   - البيانات من `get_agricultural_client_maintenance_records`
   - يجلب من `reservations` مع `path_type = 'agricultural'`

2. **المسار الاستثماري:**
   - العميل يرى "أشجاري الذهبية"
   - خلفية ذهبية
   - البيانات من `get_client_maintenance_records`
   - يجلب من `investment_assets`

3. **كلا المسارين:**
   - يستهلكان من قسم التشغيل مباشرة
   - الواجهة طبقة عرض فقط
   - الحسابات في قاعدة البيانات
   - فقط الصيانات المنشورة
   - التزامن فوري

---

## الملفات المعدلة

1. **قاعدة البيانات:**
   - `create_agricultural_maintenance_records_function.sql`
   - `fix_agricultural_maintenance_records_function.sql`

2. **Services:**
   - `src/services/clientMaintenanceService.ts`

3. **Components:**
   - `src/components/MyGreenTrees.tsx`

---

## التوصية

### النظام الآن جاهز للاستخدام للمسارين:

✅ **المسار الزراعي (أشجاري الخضراء):**
- يعمل بشكل صحيح
- يجلب من reservations
- يحسب الرسوم بناءً على tree_count

✅ **المسار الاستثماري (أشجاري الذهبية):**
- يعمل بشكل صحيح
- يجلب من investment_assets
- يحسب الرسوم بناءً على عدد الأصول

✅ **كلا المسارين:**
- يستهلكان من قسم التشغيل مباشرة
- لا يوجد أي منطق مخالف
- الواجهة طبقة عرض فقط

---

## اختبار النظام

### سيناريو للمسار الزراعي:

1. العميل يسجل دخول بـ identity = 'agricultural'
2. يضغط على زر "أشجاري الخضراء" في الفوتر
3. يرى قائمة الصيانات لمزرعته الزراعية
4. يرى عدد أشجاره من الحجز
5. يرى الرسوم المستحقة
6. يمكنه السداد

### سيناريو للمسار الاستثماري:

1. العميل يسجل دخول بـ identity = 'investment'
2. يضغط على زر "أشجاري الذهبية" في الفوتر
3. يرى قائمة الصيانات لأصوله الاستثمارية
4. يرى عدد أشجاره من investment_assets
5. يرى الرسوم المستحقة
6. يمكنه السداد

---

**الحالة:** مصلح بالكامل ✅
**التاريخ:** 4 فبراير 2026
**البناء:** نجح بدون أخطاء ✅
