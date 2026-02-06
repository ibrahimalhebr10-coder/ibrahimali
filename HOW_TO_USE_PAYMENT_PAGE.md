# كيف تستخدم PaymentPage؟

**دليل سريع للمطورين** 🚀

---

## الاستخدام في 3 أسطر

```typescript
import PaymentPage from './components/PaymentPage';

<PaymentPage
  amount={5000}
  onSuccess={() => navigate('/success')}
/>
```

ذلك فقط!

---

## 📖 الأمثلة

### 1. دفع بسيط (بدون حجز)

```typescript
import { useState } from 'react';
import PaymentPage from './components/PaymentPage';

function MyComponent() {
  const [showPayment, setShowPayment] = useState(false);

  if (showPayment) {
    return (
      <PaymentPage
        amount={3000}
        onSuccess={() => {
          alert('تم الدفع بنجاح!');
          setShowPayment(false);
        }}
        onBack={() => setShowPayment(false)}
      />
    );
  }

  return (
    <button onClick={() => setShowPayment(true)}>
      ادفع الآن
    </button>
  );
}
```

### 2. دفع مع حجز

```typescript
import PaymentPage from './components/PaymentPage';
import { useNavigate } from 'react-router-dom';

function CheckoutPage() {
  const navigate = useNavigate();
  const reservation = useReservation(); // جلب الحجز

  return (
    <PaymentPage
      reservationId={reservation.id}
      amount={reservation.total_amount}
      onSuccess={() => {
        // الحجز سيتحدث تلقائياً إلى "confirmed"
        navigate('/my-reservations');
      }}
      onBack={() => navigate(-1)}
    />
  );
}
```

### 3. دفع في Modal

```typescript
import { Dialog } from '@headlessui/react';
import PaymentPage from './components/PaymentPage';

function PaymentModal({ amount, onClose }) {
  return (
    <Dialog open={true} onClose={onClose}>
      <Dialog.Panel>
        <PaymentPage
          amount={amount}
          onSuccess={() => {
            alert('تم الدفع!');
            onClose();
          }}
          onBack={onClose}
        />
      </Dialog.Panel>
    </Dialog>
  );
}
```

---

## 🔧 Props

```typescript
interface PaymentPageProps {
  // المبلغ بالريال (إجباري)
  amount: number;

  // عند نجاح الدفع (إجباري)
  onSuccess: () => void;

  // ID الحجز - اختياري
  // إذا تم تقديمه، سيتم تحديث الحجز تلقائياً
  reservationId?: string;

  // زر الرجوع - اختياري
  onBack?: () => void;
}
```

---

## 🎯 السيناريوهات الشائعة

### السيناريو 1: صفحة Checkout

```typescript
// في صفحة Checkout
function CheckoutPage() {
  const { cart, total } = useCart();
  const navigate = useNavigate();

  const handleCreateOrder = async () => {
    // 1. إنشاء الطلب
    const order = await createOrder(cart);

    // 2. الانتقال للدفع
    navigate('/payment', {
      state: {
        orderId: order.id,
        amount: total
      }
    });
  };

  return (
    <button onClick={handleCreateOrder}>
      إتمام الطلب
    </button>
  );
}

// في صفحة /payment
function PaymentRoute() {
  const { state } = useLocation();
  const navigate = useNavigate();

  return (
    <PaymentPage
      reservationId={state.orderId}
      amount={state.amount}
      onSuccess={() => navigate('/order-success')}
      onBack={() => navigate(-1)}
    />
  );
}
```

### السيناريو 2: دفع مباشر من صفحة المنتج

```typescript
function ProductPage({ product }) {
  const [showPayment, setShowPayment] = useState(false);

  if (showPayment) {
    return (
      <PaymentPage
        amount={product.price}
        onSuccess={() => {
          // حفظ الشراء
          savePurchase(product.id);
          setShowPayment(false);
        }}
        onBack={() => setShowPayment(false)}
      />
    );
  }

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.price} ريال</p>
      <button onClick={() => setShowPayment(true)}>
        اشترِ الآن
      </button>
    </div>
  );
}
```

### السيناريو 3: تجديد اشتراك

```typescript
function RenewSubscription() {
  const { subscription } = useSubscription();

  return (
    <PaymentPage
      amount={subscription.renewal_price}
      onSuccess={async () => {
        // تجديد الاشتراك
        await renewSubscription(subscription.id);
        alert('تم تجديد اشتراكك!');
      }}
    />
  );
}
```

---

## 🔌 التكامل مع بوابة الدفع

### الخطوات

1. **اختر البوابة**
   - Moyasar (السعودية)
   - Tabby (الخليج)
   - HyperPay (عالمي)

2. **ثبت SDK**
   ```bash
   npm install @moyasar/moyasar-js
   # أو
   npm install @tabby/checkout
   ```

3. **حدّث PaymentCardForm.tsx**

   ```typescript
   import Moyasar from '@moyasar/moyasar-js';

   useEffect(() => {
     Moyasar.init({
       element: '#card-number-element',
       amount: amount * 100, // بالهللات
       currency: 'SAR',
       publishable_api_key: import.meta.env.VITE_MOYASAR_PUBLIC_KEY,
       on_completed: (payment) => {
         onSuccess(payment.id, payment.source.transaction_id);
       }
     });
   }, [amount]);
   ```

4. **اختبر**
   - على Desktop
   - على iPhone (للتحقق من Apple Pay)
   - على Android

---

## 🍎 Apple Pay

### يعمل تلقائياً!

لا حاجة لأي إعداد - سيظهر تلقائياً على:
- iPhone
- iPad
- Safari على Mac

### للاختبار

```typescript
// تحقق من توفر Apple Pay
import { paymentService } from './services/paymentService';

console.log(paymentService.isApplePayAvailable());
// true على iPhone/Safari
// false على Android/Chrome
```

---

## 📊 جلب المدفوعات

### للمستخدم

```typescript
import { paymentService } from './services/paymentService';

// جلب جميع مدفوعات المستخدم
const payments = await paymentService.getUserPayments();

// عرضها
{payments.map(payment => (
  <div key={payment.id}>
    <span>{payment.amount} ريال</span>
    <span>{payment.status}</span>
    <span>{new Date(payment.created_at).toLocaleDateString('ar-SA')}</span>
  </div>
))}
```

### للأدمن

```typescript
// في لوحة التحكم
const { data: allPayments } = await supabase
  .from('payments')
  .select(`
    *,
    user_profiles(full_name, email)
  `)
  .order('created_at', { ascending: false });
```

---

## 🔒 الأمان

### ما يجب فعله

```typescript
// ✅ استخدم HTTPS
// ✅ تحقق من Token
// ✅ استخدم Environment Variables

const MOYASAR_PUBLIC_KEY = import.meta.env.VITE_MOYASAR_PUBLIC_KEY;
const MOYASAR_SECRET_KEY = import.meta.env.VITE_MOYASAR_SECRET_KEY;
```

### ما يجب تجنبه

```typescript
// ❌ لا تخزن رقم البطاقة
const cardNumber = '4111111111111111'; // ❌ خطير!

// ❌ لا تعرض CVV في logs
console.log(cvv); // ❌

// ❌ لا تشارك Secret Keys
const publicKey = 'pk_...'; // ✅ OK
const secretKey = 'sk_...'; // ❌ لا تكشفه!
```

---

## 🐛 الأخطاء الشائعة

### الخطأ 1: "User not authenticated"

```typescript
// السبب: المستخدم غير مسجل دخول

// الحل:
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  navigate('/login');
  return;
}
```

### الخطأ 2: Apple Pay لا يظهر

```typescript
// السبب: ليس على iPhone/Safari

// الحل: تحقق من الجهاز
if (!paymentService.isApplePayAvailable()) {
  console.log('Apple Pay غير متوفر على هذا الجهاز');
}
```

### الخطأ 3: الحجز لم يتحدث

```typescript
// السبب: لم يتم تقديم reservationId

// الحل:
<PaymentPage
  reservationId={reservation.id} // ✅ تأكد من تقديمه
  amount={amount}
  onSuccess={onSuccess}
/>
```

---

## 📱 التصميم Responsive

### يعمل تلقائياً!

الصفحة responsive بالكامل:
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile (iPhone + Android)

### التخصيص

```typescript
// إذا أردت تخصيص العرض على Mobile
<div className="max-w-2xl mx-auto px-4 py-8">
  <PaymentPage {...props} />
</div>
```

---

## 🎨 التخصيص

### تغيير الألوان

في `PaymentCardForm.tsx`:

```typescript
// الأزرار
className="bg-gradient-to-r from-blue-600 to-blue-700" // غيّر الأخضر لأزرق

// الحدود
className="border-blue-500" // غيّر darkgreen
```

### تغيير النصوص

```typescript
<h1>عنوان مخصص</h1> // بدلاً من "إتمام الدفع"
```

### إضافة شعار

```typescript
<div className="text-center mb-8">
  <img src="/logo.png" alt="Logo" className="mx-auto mb-4" />
  <h1>إتمام الدفع</h1>
</div>
```

---

## ✅ Checklist سريع

قبل استخدام PaymentPage:

- [ ] المستخدم مسجل دخول
- [ ] المبلغ صحيح
- [ ] onSuccess محدد
- [ ] تكامل البوابة جاهز (أو Mock للاختبار)
- [ ] HTTPS مفعّل (للإنتاج)
- [ ] Environment Variables محددة

---

## 🎉 الخلاصة

### استخدام PaymentPage بسيط:

```typescript
<PaymentPage
  amount={amount}
  onSuccess={onSuccess}
/>
```

### الميزات تلقائياً:
- ✅ حقول آمنة
- ✅ Apple Pay على iPhone
- ✅ RLS كامل
- ✅ تحديث الحجز
- ✅ طبقة طمأنة
- ✅ Responsive

**ابدأ الآن! 🚀**
