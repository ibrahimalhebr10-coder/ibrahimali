# مواقع التطوير لإصلاح نظام العقود

## 1. قاعدة البيانات - Migration File

**المسار:**
```
/supabase/migrations/20260203165243_fix_contracts_display_system.sql
```

**ما تم إضافته:**
- عمود `contract_type` في جدول `reservations`
- عمود `contract_end_date` في جدول `reservations`
- دالة `calculate_contract_end_date()` لحساب تاريخ نهاية العقد تلقائياً
- Trigger `set_contract_end_date` ينفذ تلقائياً عند إنشاء أو تحديث حجز
- View `contracts_with_details` لعرض العقود مع التفاصيل
- Indexes لتحسين الأداء:
  - `idx_reservations_contract_dates`
  - `idx_reservations_contract_type`
- تحديث البيانات الموجودة مسبقاً

---

## 2. الكود - Services

**المسار:**
```
/src/services/contractsService.ts
```

### التغييرات التفصيلية:

#### أ) دالة `getContractStats()` - السطور 41-95

**قبل:**
```typescript
.in('status', ['active', 'completed']);
```

**بعد:**
```typescript
.in('status', ['active', 'confirmed', 'completed']);
```

**قبل:**
```typescript
} else if (reservation.status === 'active') {
```

**بعد:**
```typescript
} else if (reservation.status === 'active' || reservation.status === 'confirmed') {
```

---

#### ب) دالة `getFarmsWithContracts()` - السطور 97-186

**1. اسم المزرعة - السطر 101:**

**قبل:**
```typescript
.select('id, name, location');
```

**بعد:**
```typescript
.select('id, name_ar, location');
```

**2. اسم العمود - السطر 115:**

**قبل:**
```typescript
number_of_trees,
```

**بعد:**
```typescript
total_trees,
```

**3. حالات الحجز - السطر 124:**

**قبل:**
```typescript
.in('status', ['active', 'completed']);
```

**بعد:**
```typescript
.in('status', ['active', 'confirmed', 'completed']);
```

**4. منطق الحالات - السطور 137-151:**

**قبل:**
```typescript
let status: 'active' | 'completed' | 'needs_attention' = reservation.status;

if (reservation.status === 'active') {
  const endDate = new Date(reservation.contract_end_date);
  if (endDate < sixMonthsFromNow) {
    status = 'needs_attention';
    needsAttentionCount++;
  } else {
    activeCount++;
  }
} else if (reservation.status === 'completed') {
  completedCount++;
}
```

**بعد:**
```typescript
let status: 'active' | 'completed' | 'needs_attention' = reservation.status === 'completed' ? 'completed' : 'active';

if (reservation.status === 'active' || reservation.status === 'confirmed') {
  const endDate = new Date(reservation.contract_end_date);
  if (endDate < sixMonthsFromNow) {
    status = 'needs_attention';
    needsAttentionCount++;
  } else {
    status = 'active';
    activeCount++;
  }
} else if (reservation.status === 'completed') {
  completedCount++;
}
```

**5. معالجة tree_types - السطور 153-157:**

**تم إضافة:**
```typescript
const treeTypes = typeof reservation.tree_types === 'string'
  ? [reservation.tree_types]
  : Array.isArray(reservation.tree_types)
    ? reservation.tree_types
    : [];
```

**6. استخدام total_trees - السطر 164:**

**قبل:**
```typescript
tree_count: reservation.number_of_trees || 0,
```

**بعد:**
```typescript
tree_count: reservation.total_trees || 0,
```

**7. استخدام treeTypes - السطر 165:**

**قبل:**
```typescript
tree_types: reservation.tree_types || [],
```

**بعد:**
```typescript
tree_types: treeTypes,
```

**8. اسم المزرعة - السطور 169, 177:**

**قبل:**
```typescript
farm_name: farm.name,
...
farm_name: farm.name,
```

**بعد:**
```typescript
farm_name: farm.name_ar,
...
farm_name: farm.name_ar,
```

---

## 3. الملفات التوثيقية

تم إنشاء ملفين توثيقيين:

1. **CONTRACTS_DISPLAY_FIX_COMPLETE.md** - شرح شامل للإصلاح
2. **CONTRACTS_FIX_LOCATIONS.md** - هذا الملف (تفاصيل الكود)

---

## ملخص الأماكن

| الرقم | الموقع | نوع التطوير |
|------|--------|-------------|
| 1 | `/supabase/migrations/20260203165243_fix_contracts_display_system.sql` | قاعدة البيانات |
| 2 | `/src/services/contractsService.ts` - السطور 41-95 | تحديث دالة getContractStats |
| 3 | `/src/services/contractsService.ts` - السطور 97-186 | تحديث دالة getFarmsWithContracts |

---

## كيفية الوصول للملفات

### 1. ملف Migration:
```bash
# الموقع الكامل:
/tmp/cc-agent/62912478/project/supabase/migrations/20260203165243_fix_contracts_display_system.sql
```

### 2. ملف Service:
```bash
# الموقع الكامل:
/tmp/cc-agent/62912478/project/src/services/contractsService.ts
```

---

## التحقق من التطوير

للتحقق من أن التطوير يعمل:

1. **في قاعدة البيانات:**
```sql
-- فحص الأعمدة الجديدة
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'reservations'
AND column_name IN ('contract_type', 'contract_end_date');

-- فحص البيانات
SELECT id, contract_type, contract_end_date
FROM reservations
LIMIT 5;
```

2. **في لوحة الإدارة:**
- سجل دخول كمدير
- افتح قسم "العقود"
- يجب أن تظهر جميع المزارع مع العقود النشطة

---

## الأثر على النظام

### ✅ ما يعمل الآن:
- عرض جميع العقود في لوحة الإدارة
- تصنيف العقود حسب الحالة
- العداد التنازلي للعقود
- الإحصائيات الدقيقة
- دعم أنواع العقود المختلفة

### 🔄 التحديث التلقائي:
- عند إنشاء حجز جديد، يتم حساب تاريخ النهاية تلقائياً
- جميع التواريخ تنقص بشكل صحيح
- البيانات محمية بـ RLS

### 📊 التحسينات:
- أداء أفضل مع Indexes
- استعلامات أسهل مع View
- كود أكثر وضوحاً وصيانة
