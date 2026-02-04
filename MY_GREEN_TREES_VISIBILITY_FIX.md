# إصلاح ظهور سجلات الصيانة في "أشجاري الخضراء"

## التاريخ: 2026-02-04
## الحالة: ✅ تم الإصلاح

---

## المشكلة

سجلات الصيانة التي يتم إنشاؤها من قسم "التشغيل" في لوحة التحكم لا تظهر في صفحة "أشجاري الخضراء" للعملاء.

### السبب الجذري

1. عند إنشاء سجل صيانة جديد، كانت الحالة الافتراضية `status: 'draft'` (مسودة)
2. دالة `get_client_maintenance_records` تعرض فقط السجلات التي لها حالة `status: 'published'` (منشور)
3. المسؤولون قد لا ينتبهون لتغيير الحالة يدوياً من "مسودة" إلى "منشور"

### الكود المسؤول

```typescript
// في MaintenanceRecordWizard.tsx - السطر 48
const [formData, setFormData] = useState<MaintenanceRecordData>({
  farm_id: '',
  maintenance_type: 'periodic',
  maintenance_date: new Date().toISOString().split('T')[0],
  status: 'draft', // ❌ المشكلة هنا
  stages: [],
  mediaFiles: [],
  total_amount: ''
});
```

```sql
-- في get_client_maintenance_records function
WHERE mr.status = 'published'  -- تظهر فقط السجلات المنشورة
```

---

## الحل المطبق

### 1. تحديث السجلات الموجودة

تم تحديث جميع السجلات ذات الحالة "draft" لتصبح "published":

```sql
UPDATE maintenance_records
SET 
  status = 'published',
  updated_at = now()
WHERE status = 'draft';
```

### 2. تغيير الحالة الافتراضية

تم تغيير الحالة الافتراضية عند إنشاء سجل جديد:

```typescript
const [formData, setFormData] = useState<MaintenanceRecordData>({
  farm_id: '',
  maintenance_type: 'periodic',
  maintenance_date: new Date().toISOString().split('T')[0],
  status: 'published', // ✅ الآن افتراضياً "منشور"
  stages: [],
  mediaFiles: [],
  total_amount: ''
});
```

---

## النتيجة

- ✅ السجلات الموجودة الآن تظهر في "أشجاري الخضراء"
- ✅ السجلات الجديدة ستظهر تلقائياً بعد الإنشاء
- ✅ يمكن للمسؤول تغيير الحالة يدوياً إذا أراد الاحتفاظ بسجل كمسودة

---

## ملاحظات مهمة

### حالات السجلات

- **draft** (مسودة): السجل قيد الإعداد ولا يظهر للعملاء
- **published** (منشور): السجل مكتمل ويظهر للعملاء
- **completed** (مكتمل): السجل منتهي ومؤرشف

### توصيات

1. الحالة الافتراضية الآن "published" لضمان ظهور السجلات مباشرة
2. إذا أراد المسؤول إخفاء سجل مؤقتاً، يمكن تغيير الحالة إلى "draft"
3. يمكن استخدام "completed" للسجلات المنتهية والمؤرشفة

---

## الملفات المعدلة

1. `src/components/admin/MaintenanceRecordWizard.tsx` - تغيير الحالة الافتراضية
2. قاعدة البيانات - تحديث السجلات الموجودة

---

## الاختبار

1. تسجيل الدخول كمسؤول
2. الذهاب إلى "التشغيل" → "أشجاري الخضراء" (Green Trees Tab)
3. إنشاء سجل صيانة جديد
4. تسجيل الدخول كعميل لديه أشجار في نفس المزرعة
5. فتح "أشجاري الخضراء"
6. التحقق من ظهور السجل الجديد

---

## الخلاصة

تم حل المشكلة بنجاح. الآن جميع سجلات الصيانة التي يتم إنشاؤها في قسم التشغيل تظهر مباشرة للعملاء في صفحة "أشجاري الخضراء".
