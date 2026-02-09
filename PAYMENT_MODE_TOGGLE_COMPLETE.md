# نظام تبديل وضع الدفع - اكتمل

## الميزة الجديدة
تم إضافة أداة في غرفة المتابعة تسمح للمدير بتحويل الحجز بين وضعين:
1. **الدفع الآن** (Immediate Payment) - الدفع الفوري بدون مهلة
2. **الدفع لاحقاً** (Flexible Payment) - منح العميل مهلة للدفع

## المكونات المضافة

### 1. دوال قاعدة البيانات

#### `toggle_payment_mode()`
دالة رئيسية لتبديل وضع الدفع:
```sql
toggle_payment_mode(
  p_reservation_id uuid,
  p_enable_flexible boolean,
  p_payment_days integer DEFAULT 7,
  p_reason text DEFAULT NULL
)
```

**المعاملات:**
- `p_reservation_id`: معرف الحجز
- `p_enable_flexible`: true للتحويل للدفع المرن، false للدفع الفوري
- `p_payment_days`: عدد أيام المهلة (افتراضي 7)
- `p_reason`: سبب التحويل

**الوظيفة:**
- تحديث حقل `flexible_payment_enabled`
- حساب وتحديث `payment_deadline` حسب الوضع
- تسجيل النشاط في سجل المتابعة
- إرجاع نتيجة JSON تحتوي على تفاصيل التحويل

#### `convert_to_immediate_payment()`
دالة مختصرة للتحويل للدفع الفوري:
```sql
convert_to_immediate_payment(
  p_reservation_id uuid,
  p_reason text DEFAULT 'تحويل للدفع الفوري'
)
```

#### `convert_to_flexible_payment()`
دالة مختصرة للتحويل للدفع المرن:
```sql
convert_to_flexible_payment(
  p_reservation_id uuid,
  p_payment_days integer DEFAULT 7,
  p_reason text DEFAULT 'تحويل للدفع المرن'
)
```

### 2. واجهة البرمجة (followUpService.ts)

تم إضافة ثلاث دوال جديدة:

```typescript
// تبديل وضع الدفع
async togglePaymentMode(
  reservationId: string,
  enableFlexible: boolean,
  paymentDays: number = 7,
  reason: string = ''
): Promise<any>

// تحويل للدفع الفوري
async convertToImmediatePayment(
  reservationId: string,
  reason: string = 'تحويل للدفع الفوري'
): Promise<any>

// تحويل للدفع المرن
async convertToFlexiblePayment(
  reservationId: string,
  paymentDays: number = 7,
  reason: string = 'تحويل للدفع المرن'
): Promise<any>
```

### 3. واجهة المستخدم (FollowUpRoom.tsx)

#### عمود جديد في جدول الحجوزات
- يعرض وضع الدفع الحالي مع أيقونة مميزة:
  - ⚡ **الدفع الآن** (أزرق)
  - ⏱️ **الدفع لاحقاً** (برتقالي)

#### زر التبديل
- أيقونة ديناميكية تتغير حسب الوضع الحالي
- يفتح مودال تفاعلي للتأكيد

#### مودال التحويل (PaymentModeModal)
مودال ذكي يعرض:
- **معلومات الحجز**: اسم العميل، المبلغ، الوضع الحالي
- **خيارات التحويل**:
  - إذا كان "الدفع لاحقاً" حالياً: خيار التحويل للدفع الفوري
  - إذا كان "الدفع الآن" حالياً: خيار اختيار عدد أيام المهلة (3، 5، 7، 10، 14 يوم)
- **حقل السبب**: إلزامي لتوثيق سبب التحويل
- **تحذير واضح**: يوضح ماذا سيحدث بعد التحويل

## كيفية الاستخدام

### من غرفة المتابعة:

1. **افتح غرفة المتابعة** في لوحة المدير
2. **ابحث عن الحجز** الذي تريد تعديل وضع دفعه
3. **انقر على أيقونة التبديل** (⚡ أو ⏱️) في عمود الإجراءات
4. **في المودال المنبثق:**
   - إذا كنت تحول للدفع المرن: اختر عدد الأيام
   - اكتب سبب التحويل
   - انقر "تأكيد التحويل"

### النتيجة:

#### عند التحويل للدفع الفوري:
- يتم إلغاء `payment_deadline`
- يتم تعيين `flexible_payment_enabled = false`
- تسجيل نشاط في سجل المتابعة
- العميل يحتاج للدفع فوراً

#### عند التحويل للدفع المرن:
- يتم حساب `payment_deadline` (الآن + عدد الأيام المحددة)
- يتم تعيين `flexible_payment_enabled = true`
- تسجيل نشاط في سجل المتابعة
- العميل لديه مهلة للدفع

## حالات الاستخدام

### 1. عميل يطلب مهلة إضافية
**السيناريو**: عميل حجز بـ "الدفع الآن" لكنه طلب مهلة.

**الإجراء**:
1. انقر على أيقونة ⏱️
2. اختر عدد الأيام (مثلاً 7 أيام)
3. اكتب السبب: "طلب العميل مهلة بسبب ظروف مالية"
4. تأكيد التحويل

**النتيجة**: يصبح الحجز "الدفع لاحقاً" مع موعد نهائي بعد 7 أيام

### 2. عميل جاهز للدفع مباشرة
**السيناريو**: عميل في وضع "الدفع لاحقاً" لكنه الآن جاهز للدفع.

**الإجراء**:
1. انقر على أيقونة ⚡
2. اكتب السبب: "العميل جاهز للدفع الآن"
3. تأكيد التحويل

**النتيجة**: يصبح الحجز "الدفع الآن" ويتم إلغاء الموعد النهائي

### 3. تحويل تلقائي بناء على نتيجة المتابعة
**السيناريو**: بعد مكالمة مع العميل، تقرر منحه مهلة.

**الإجراء**:
1. سجل نشاط المكالمة أولاً
2. ثم حول وضع الدفع للمرن
3. اكتب السبب: "بناء على المكالمة، وعد العميل بالدفع خلال 5 أيام"

## التحديثات على قاعدة البيانات

### تحديث دالة `get_pending_payments`
تم إضافة حقل `flexible_payment_enabled` للإخراج:
```sql
RETURNS TABLE (
  ...
  flexible_payment_enabled boolean
)
```

### تسجيل الأنشطة
جميع عمليات التبديل يتم تسجيلها تلقائياً في جدول `follow_up_activities` مع:
- نوع النشاط: `payment_mode_changed`
- التفاصيل الكاملة عن التحويل
- من قام بالتحويل (admin_id)
- التاريخ والوقت

## الأمان

- ✅ جميع الدوال محمية بـ `SECURITY DEFINER`
- ✅ فحص صلاحيات المدير قبل أي تعديل
- ✅ تسجيل كامل لجميع العمليات
- ✅ حقل السبب إلزامي لتوثيق القرارات

## الملفات المعدلة

1. `supabase/migrations/*_add_payment_mode_toggle_function.sql` - الدوال البرمجية
2. `supabase/migrations/*_add_flexible_payment_enabled_to_get_pending_payments.sql` - تحديث دالة الاستعلام
3. `src/services/followUpService.ts` - خدمات البرمجة
4. `src/components/admin/FollowUpRoom.tsx` - واجهة المستخدم

## الاختبار

### اختبار يدوي:
```sql
-- عرض حجز تجريبي
SELECT id, farm_name, flexible_payment_enabled, payment_deadline
FROM reservations WHERE is_demo = true LIMIT 1;

-- اختبار التحويل للدفع المرن
SELECT * FROM convert_to_flexible_payment(
  '4836c638-c8ef-4dee-b02d-fae4cf3cad1c',
  10,
  'اختبار النظام'
);

-- التحقق من التحديث
SELECT id, farm_name, flexible_payment_enabled, payment_deadline
FROM reservations WHERE is_demo = true LIMIT 1;

-- اختبار التحويل للدفع الفوري
SELECT * FROM convert_to_immediate_payment(
  '4836c638-c8ef-4dee-b02d-fae4cf3cad1c',
  'إعادة للوضع الأصلي'
);
```

## الإحصائيات

- **عدد الدوال المضافة**: 3
- **عدد الدوال المحدثة**: 1
- **عدد المكونات المحدثة**: 2
- **عدد الحقول المضافة**: 1
- **حالة البناء**: ✅ ناجح

## تاريخ الإصلاح
2026-02-09
