# تدفق الحجز الكامل - أشجاري الذهبية (المسار الاستثماري)

## التحديث المكتمل ✅

تم تحديث صفحة **أشجاري الذهبية** لاستخدام التدفق الموحد الجديد الذي يتضمن خطوة التسجيل.

---

## 🔄 التدفق الجديد

### المراحل بالترتيب:

```
┌─────────────────────────────────────────────────────────┐
│  1. صفحة المزرعة الاستثمارية (InvestmentFarmPage)     │
│     - عرض تفاصيل المزرعة                               │
│     - اختيار الباقة الاستثمارية                        │
│     - تحديد عدد الأشجار                                │
│     - زر "استثمر الآن"                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. UnifiedBookingFlow يبدأ (التدفق الموحد)            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. شاشة المراجعة (InvestmentReviewScreen)             │
│     - عرض ملخص الاستثمار                               │
│     - المزرعة + العقد + عدد الأشجار + المبلغ            │
│     - زر "إكمال الدفع"                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  4. إنشاء الحجز في قاعدة البيانات                      │
│     - حفظ الحجز بحالة 'pending'                        │
│     - path_type: 'investment'                          │
│     - حفظ كود المؤثر (إن وجد)                          │
└─────────────────────────────────────────────────────────┘
                          ↓
              ┌──────────────────────┐
              │  هل المستخدم مسجل؟   │
              └──────────────────────┘
                     ↙         ↘
                   لا           نعم
                   ↓             ↓
    ┌───────────────────────┐   │
    │ 5. صفحة التسجيل       │   │
    │ (Registration)        │   │
    │ - تسجيل حساب جديد     │   │
    │ - أو تسجيل دخول       │   │
    │ - ربط الحجز بالمستخدم │   │
    └───────────────────────┘   │
                   ↓             ↓
                   └──────┬──────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  6. صفحة الدفع (PaymentPage)                            │
│     - عرض خيارات الدفع                                 │
│     - البطاقة الائتمانية                               │
│     - Apple Pay (إن وجد)                              │
│     - إتمام المعاملة                                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  7. تحديث حالة الحجز                                   │
│     - status: 'confirmed'                              │
│     - الانتقال للحساب الشخصي                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 التغييرات التقنية

### 1. InvestmentFarmPage.tsx

#### الإضافات:
```typescript
import UnifiedBookingFlow from './UnifiedBookingFlow';

const [showBookingFlow, setShowBookingFlow] = useState(false);
```

#### الحذف:
```typescript
// ✗ إزالة هذه
const [showReviewScreen, setShowReviewScreen] = useState(false);
const [showPaymentPage, setShowPaymentPage] = useState(false);
const [reservationId, setReservationId] = useState<string>('');
const [isCreatingReservation, setIsCreatingReservation] = useState(false);
```

#### التعديلات:
```typescript
// قبل:
const handleInvestNow = () => {
  // validations...
  setShowReviewScreen(true);
};

// بعد:
const handleInvestNow = () => {
  // validations...
  setShowBookingFlow(true);
};
```

#### JSX الجديد:
```typescript
{showBookingFlow && selectedContract && selectedPackage && (
  <UnifiedBookingFlow
    farmId={farm.id}
    farmName={farm.name}
    pathType="investment"
    packageName={selectedPackage.package_name}
    treeCount={treeCount}
    contractId={selectedContract.id}
    contractName={selectedPackage.package_name || selectedContract.contract_name}
    durationYears={selectedPackage.base_duration_years || selectedContract.duration_years}
    bonusYears={selectedPackage.bonus_free_years || selectedContract.bonus_years}
    totalPrice={calculateTotal()}
    influencerCode={influencerCode}
    onBack={handleBookingBack}
    onComplete={handleBookingComplete}
  />
)}
```

### 2. UnifiedBookingFlow.tsx

#### التدفق:
```typescript
type FlowStep = 'review' | 'registration' | 'payment' | 'success';

const handleReviewConfirm = async () => {
  // إنشاء الحجز
  const reservation = await createReservation();

  // التوجيه حسب حالة المستخدم
  if (!user) {
    setCurrentStep('registration'); // ← الخطوة الجديدة
  } else {
    setCurrentStep('payment');
  }
};

const handleRegistrationSuccess = async () => {
  // ربط الحجز بالمستخدم
  await updateReservationWithUser();
  setCurrentStep('payment');
};
```

### 3. InvestmentReviewScreen.tsx

تحديث المعاملات لدعم UnifiedBookingFlow:
```typescript
interface InvestmentReviewScreenProps {
  farmName: string;
  farmLocation?: string;
  packageName?: string; // ← جديد (اختياري)
  contractName: string;
  durationYears: number;
  bonusYears: number;
  treeCount: number;
  totalPrice: number;
  pricePerTree?: number; // ← جديد (اختياري)
  treeVarieties?: any[]; // ← جديد (اختياري)
  onConfirm: () => void;
  onBack: () => void;
  isLoading?: boolean;
}
```

---

## 🎯 المزايا

### 1. تجربة مستخدم أفضل
- تدفق خطوة بخطوة واضح
- لا حاجة للرجوع لتسجيل الدخول
- الحجز محفوظ طوال الرحلة

### 2. كود أنظف
- إزالة التكرار
- استخدام مكون موحد (UnifiedBookingFlow)
- سهولة الصيانة

### 3. أمان أفضل
- التحقق من المستخدم قبل الدفع
- ربط الحجوزات بالمستخدمين
- تتبع كامل للعمليات

---

## 🧪 كيفية الاختبار

### سيناريو 1: مستخدم غير مسجل دخول
1. افتح صفحة أشجاري الذهبية
2. اختر باقة استثمارية
3. حدد عدد الأشجار
4. اضغط "استثمر الآن"
5. ✅ تظهر شاشة المراجعة
6. اضغط "إكمال الدفع"
7. ✅ يظهر نموذج التسجيل/تسجيل الدخول ← **الخطوة الجديدة**
8. سجل حساب جديد أو سجل دخول
9. ✅ تنتقل مباشرة لصفحة الدفع
10. أكمل الدفع

### سيناريو 2: مستخدم مسجل دخول
1. افتح صفحة أشجاري الذهبية
2. اختر باقة استثمارية
3. حدد عدد الأشجار
4. اضغط "استثمر الآن"
5. ✅ تظهر شاشة المراجعة
6. اضغط "إكمال الدفع"
7. ✅ تنتقل مباشرة لصفحة الدفع (تخطي التسجيل)
8. أكمل الدفع

### سيناريو 3: مع كود مؤثر
1. أدخل كود مؤثر
2. اختر الباقة المميزة
3. أكمل الحجز
4. ✅ كود المؤثر محفوظ في الحجز
5. ✅ نفس التدفق (مراجعة → تسجيل → دفع)

---

## 📊 البيانات المحفوظة

### في جدول reservations:
```sql
{
  user_id: uuid | null,           -- null قبل التسجيل
  farm_id: uuid,
  farm_name: text,
  contract_id: uuid,
  contract_name: text,
  duration_years: int,
  bonus_years: int,
  total_trees: int,
  total_price: decimal,
  path_type: 'investment',        -- ← مهم للتمييز
  status: 'pending' | 'confirmed',
  influencer_code: text | null,
  tree_varieties: jsonb | null,
  created_at: timestamp
}
```

---

## ✅ الحالة

- ✅ InvestmentFarmPage محدّثة
- ✅ UnifiedBookingFlow مطبّقة
- ✅ InvestmentReviewScreen محدّثة
- ✅ PaymentPage جاهزة
- ✅ البناء ناجح (npm run build)
- ⏳ جاهز للاختبار اليدوي

---

## 🎯 الخطوة التالية

بعد اختبار **أشجاري الذهبية** والتأكد من عمل التدفق بشكل صحيح، سننتقل لتطبيق نفس التدفق على:

**أشجاري الخضراء** (Agricultural Path)
- تحديث AgriculturalFarmPage
- استخدام نفس UnifiedBookingFlow
- التدفق: مراجعة → تسجيل → دفع

---

## 📅 التاريخ
**تاريخ الإنشاء:** 6 فبراير 2026
**الحالة:** مكتمل ✅
**المسار:** investment (أشجاري الذهبية)
