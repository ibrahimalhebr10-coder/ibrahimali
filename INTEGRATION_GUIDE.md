# دليل التكامل السريع - نظام الدفع

## كيفية استخدام النظام الجديد

### الطريقة 1: استبدال كامل (موصى بها)

في `AgriculturalFarmPage.tsx` أو `InvestmentFarmPage.tsx`:

```typescript
import PaymentFlow from './PaymentFlow';

// استبدل:
// - showPaymentSelector
// - PaymentMethodSelector
// - PaymentSuccessScreen

// بـ:
const [showPaymentFlow, setShowPaymentFlow] = useState(false);
const [reservationId, setReservationId] = useState('');

// عند تأكيد المراجعة:
const handleConfirmReview = async () => {
  // إنشاء الحجز
  const { data: reservation } = await supabase
    .from('reservations')
    .insert({ ... })
    .select()
    .single();

  setReservationId(reservation.id);
  setShowPaymentFlow(true);
};

// في الـ JSX:
{showPaymentFlow && (
  <PaymentFlow
    reservationId={reservationId}
    onComplete={() => {
      // الانتقال لصفحة محصولي أو الرئيسية
      setShowPaymentFlow(false);
      if (onGoToAccount) onGoToAccount();
    }}
    onCancel={() => {
      setShowPaymentFlow(false);
      setShowReviewScreen(true);
    }}
  />
)}
```

---

### الطريقة 2: استخدام UnifiedBookingFlow

```typescript
import UnifiedBookingFlow from './UnifiedBookingFlow';

const [showBookingFlow, setShowBookingFlow] = useState(false);

const handleBuyNow = () => {
  setShowBookingFlow(true);
};

// في الـ JSX:
{showBookingFlow && (
  <UnifiedBookingFlow
    farmId={farm.id}
    farmName={farm.name}
    pathType="agricultural" // أو "investment"
    packageName={selectedPackage.package_name}
    treeCount={treeCount}
    contractId={selectedContract.id}
    contractName={selectedContract.contract_name}
    durationYears={selectedContract.duration_years}
    bonusYears={selectedContract.bonus_years}
    totalPrice={calculateTotal()}
    treeVarieties={treeVarieties} // للاستثمار فقط
    influencerCode={influencerCode}
    onBack={() => setShowBookingFlow(false)}
    onComplete={() => {
      setShowBookingFlow(false);
      if (onGoToAccount) onGoToAccount();
    }}
  />
)}
```

---

### الفرق بين الطريقتين

#### PaymentFlow
- يبدأ مباشرة من صفحة الدفع
- يحتاج إنشاء الحجز مسبقاً
- مناسب إذا كان لديك شاشة مراجعة منفصلة

#### UnifiedBookingFlow
- يشمل شاشة المراجعة + الدفع
- ينشئ الحجز تلقائياً
- تجربة سلسة من البداية للنهاية

---

## تفعيل البوابات

### 1. افتح لوحة التحكم
```
لوحة التحكم → الإعدادات → البطاقات المالية
```

### 2. فعّل البوابات المطلوبة
- مدى
- فيزا/ماستركارد
- تمارا
- تابي
- Apple Pay (مفعّل افتراضياً)
- تحويل بنكي (مفعّل افتراضياً)

### 3. أدخل المفاتيح
- اضغط "إعدادات الربط"
- أدخل API Keys
- اختبر الاتصال
- فعّل البوابة

---

## اختبار النظام

### 1. اختبار المستخدم المسجل
```
1. سجّل دخول
2. اختر مزرعة
3. اختر باقة
4. اضغط "اشترِ الآن"
5. راجع التفاصيل
6. اختر وسيلة دفع
7. أكمل الدفع
8. تحقق من شاشة النجاح
9. اذهب لـ "محصولي"
```

### 2. اختبار مستخدم جديد
```
1. لا تسجّل دخول
2. اختر مزرعة
3. اختر باقة
4. اضغط "اشترِ الآن"
5. راجع التفاصيل
6. سجّل حساب سريع
7. اختر وسيلة دفع
8. أكمل الدفع
9. تحقق من الربط بالحساب
```

### 3. اختبار iPhone
```
1. افتح على iPhone/iPad
2. تأكد من ظهور Apple Pay تلقائياً
3. اختبر التصميم المتجاوب
4. تحقق من Safe Area
```

---

## ملاحظات مهمة

### 1. لا تنسَ حذف الكود القديم
بعد التأكد من عمل النظام الجديد:
- احذف `PaymentMethodSelector`
- احذف `PaymentSuccessScreen` القديم
- احذف الكود المتعلق بهم

### 2. RLS Policies
تأكد من أن البوابات:
```sql
-- يمكن للمستخدمين المصادقين رؤيتها
CREATE POLICY "Public can view enabled providers"
  ON payment_providers FOR SELECT
  TO public
  USING (is_enabled = true);
```

### 3. Environment Variables
تأكد من إعدادات Supabase:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## الأخطاء الشائعة

### ❌ الخطأ: "لا توجد وسائل دفع"
**الحل:** فعّل بوابة واحدة على الأقل من لوحة التحكم

### ❌ الخطأ: "الرجاء تسجيل الدخول"
**الحل:** نموذج التسجيل السريع يظهر تلقائياً

### ❌ الخطأ: "Reservation not found"
**الحل:** تأكد من إنشاء الحجز قبل فتح PaymentFlow

---

## دعم فني

### لو واجهت مشكلة:
1. تحقق من console.log
2. راجع Network tab
3. تحقق من Supabase logs
4. راجع PAYMENT_CHECKOUT_SYSTEM.md

---

تم التوثيق ✓
