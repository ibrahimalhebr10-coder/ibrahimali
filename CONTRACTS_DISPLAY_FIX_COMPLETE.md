# إصلاح نظام عرض العقود - مكتمل

## المشكلة الأصلية
العقود لم تكن تظهر في قسم العقود في لوحة الإدارة بسبب:
1. عدم تطابق أسماء الأعمدة بين الـ service وقاعدة البيانات
2. عدم وجود `contract_type` في جدول reservations
3. عدم وجود `contract_end_date` في جدول reservations
4. `contract_start_date` كان null لجميع الحجوزات
5. الـ service كان يبحث عن `number_of_trees` بدلاً من `total_trees`

## الحل الجذري

### 1. التحديثات في قاعدة البيانات

#### أعمدة جديدة تم إضافتها:
- `contract_type`: نوع العقد (agricultural/investment) - قيمة افتراضية: agricultural
- `contract_end_date`: تاريخ نهاية العقد (محسوب تلقائياً)

#### دوال وتريغرات:
```sql
-- دالة لحساب تاريخ نهاية العقد تلقائياً
CREATE OR REPLACE FUNCTION calculate_contract_end_date()
-- تريغر يعمل عند إدخال أو تحديث التواريخ
CREATE TRIGGER set_contract_end_date
```

#### View جديد:
```sql
CREATE VIEW contracts_with_details
-- يجمع بيانات العقود مع معلومات المستخدم والمزرعة
```

#### Indexes للأداء:
- `idx_reservations_contract_dates`: فهرس على تواريخ العقد
- `idx_reservations_contract_type`: فهرس على نوع العقد

### 2. التحديثات في الكود

#### contractsService.ts:
- تغيير `farms.name` إلى `farms.name_ar`
- تغيير `number_of_trees` إلى `total_trees`
- إضافة دعم لحالة `confirmed` بالإضافة لـ `active`
- معالجة `tree_types` سواء كان string أو array
- حساب صحيح لحالة العقود (active, needs_attention, completed)

### 3. تحديث البيانات الموجودة

تم تحديث جميع الحجوزات النشطة:
- تعيين `contract_start_date` من `created_at` للحجوزات التي لم يكن لها تاريخ بداية
- حساب `contract_end_date` بناءً على: start_date + duration_years + bonus_years
- تعيين `contract_type` كـ agricultural (قيمة افتراضية)

## النتيجة

الآن قسم العقود في لوحة الإدارة يعرض:
- جميع العقود النشطة والمكتملة
- تفاصيل كاملة لكل عقد (المستخدم، المزرعة، التواريخ، عدد الأشجار)
- حالات العقود بشكل صحيح:
  - **نشط**: عقود نشطة وتنتهي بعد أكثر من 6 أشهر
  - **يحتاج انتباه**: عقود تنتهي خلال 6 أشهر أو أقل
  - **مكتمل**: عقود منتهية
- إحصائيات دقيقة حسب النوع (زراعي/استثماري)

## التحديثات التلقائية

عند إنشاء أو تحديث حجز جديد:
- سيتم حساب `contract_end_date` تلقائياً
- يمكن تحديد `contract_type` حسب نوع الحجز
- جميع البيانات متوافقة مع نظام العرض

## الملفات المعدلة

1. **قاعدة البيانات**:
   - `supabase/migrations/[timestamp]_fix_contracts_display_system.sql`

2. **الكود**:
   - `src/services/contractsService.ts`

## اختبار النظام

للتحقق من أن العقود تظهر:
1. سجل دخول كمدير
2. انتقل إلى قسم "العقود"
3. يجب أن تظهر جميع المزارع التي لديها عقود نشطة
4. انقر على أي مزرعة لرؤية تفاصيل العقود

## ملاحظات مهمة

- العداد التنازلي الآن يعمل بشكل صحيح (من نهاية العقد)
- جميع التواريخ والأوقات تنقص بشكل تلقائي
- البيانات محمية بـ RLS policies الموجودة مسبقاً
- View الجديد يسهل الاستعلامات المستقبلية
