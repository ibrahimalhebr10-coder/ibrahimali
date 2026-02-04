# إصلاح خطأ 400 في تبويب السداد (قسم التشغيل)

## التاريخ: 2026-02-04
## الحالة: ✅ تم الإصلاح

---

## الخطأ

```
Failed to load resource: the server responded with a status of 400
GET /rest/v1/maintenance_payments?select=...farms:farm_id(farm_name)...
```

### الوصف

عند الضغط على تبويب "السداد" في قسم التشغيل (Operations Section)، يظهر خطأ 400 Bad Request مع رسالة "خطأ في تحميل بيانات السداد".

---

## السبب الجذري

### المشكلة

في استعلام `getMaintenancePaymentsSummary()` في ملف `operationsService.ts`، كان الكود يحاول جلب حقل غير موجود:

```typescript
farms:farm_id (
  farm_name  // ❌ هذا الحقل غير موجود في جدول farms
)
```

### البنية الفعلية لجدول farms

جدول `farms` يحتوي على:
- ✅ `name_ar` - الاسم بالعربي
- ✅ `name_en` - الاسم بالإنجليزي
- ❌ `farm_name` - **غير موجود**

---

## الحل المطبق

### التغيير في operationsService.ts

تم تصحيح الاستعلام ليستخدم الحقل الصحيح:

**قبل:**
```typescript
farms:farm_id (
  farm_name  // ❌ خطأ
)
```

**بعد:**
```typescript
farms:farm_id (
  name_ar  // ✅ صحيح
)
```

### تحديث معالجة البيانات

تم تحديث السطر الذي يعالج النتيجة:

**قبل:**
```typescript
farm_name: payment.farms?.farm_name || 'غير معروف',  // ❌
```

**بعد:**
```typescript
farm_name: payment.farms?.name_ar || 'غير معروف',  // ✅
```

---

## التحقق

### الملفات التي تم التحقق منها

1. ✅ **operationsService.ts** - تم إصلاحه
2. ✅ **migration file** - الـview و الـfunction يستخدمان `name_ar` بشكل صحيح:
   ```sql
   -- في maintenance_payments_summary view
   f.name_ar as farm_name  ✅
   
   -- في get_client_maintenance_records function
   f.name_ar as farm_name  ✅
   ```

---

## الملفات المعدلة

- `src/services/operationsService.ts`
  - السطر 310: `farm_name` → `name_ar`
  - السطر 347: `payment.farms?.farm_name` → `payment.farms?.name_ar`

---

## الاختبار

### تبويب السداد (Maintenance Payments Tab)

الآن عند الضغط على تبويب السداد في قسم التشغيل:

1. ✅ يتم جلب البيانات بنجاح
2. ✅ يظهر اسم المزرعة بشكل صحيح
3. ✅ تظهر جميع المعلومات (اسم العميل، عدد الأشجار، المبلغ، الحالة)
4. ✅ إحصائيات السداد تعمل بشكل صحيح

---

## ملاحظات

### اتساق التسمية

- جدول `farms` يستخدم `name_ar` و `name_en` في جميع الاستعلامات
- عند إنشاء views أو functions، يتم إسناد alias `farm_name` للتوافق مع الكود
- هذا النمط متسق في جميع أنحاء قاعدة البيانات

### التوصيات

في المستقبل، عند كتابة استعلامات جديدة للمزارع:
- ✅ استخدم `name_ar` للاسم العربي
- ✅ استخدم `name_en` للاسم الإنجليزي
- ❌ لا تستخدم `farm_name` مباشرة (إلا كـalias)

---

## الخلاصة

تم إصلاح خطأ 400 في تبويب السداد بنجاح من خلال تصحيح اسم الحقل في استعلام قاعدة البيانات من `farm_name` إلى `name_ar`. الآن يعمل التبويب بشكل صحيح ويعرض جميع بيانات السدادات.
