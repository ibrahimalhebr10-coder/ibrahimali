# تحسين تجربة المستخدم: إخفاء/إظهار الهيدر والفوتر التلقائي

**التاريخ:** 2024-01-31
**الحالة:** ✅ تم التنفيذ بنجاح
**البناء:** ✅ نجح بدون أخطاء
**الأجهزة المدعومة:** جميع الأجهزة (موبايل وديسكتوب)

## نظرة عامة

تم تطبيق نظام ذكي لإخفاء/إظهار الهيدر والفوتر تلقائياً بناءً على اتجاه تمرير المستخدم، مما يوفر تجربة مستخدم احترافية وشاشة كاملة للمحتوى عند الحاجة.

## السلوك المطبق

### عند التمرير للأسفل ⬇️
- **يختفي الهيدر**: ينزلق للأعلى بسلاسة
- **يختفي الفوتر**: ينزلق للأسفل بسلاسة
- **النتيجة**: شاشة كاملة للمحتوى بدون إزعاج

### عند التمرير للأعلى ⬆️
- **يظهر الهيدر**: يعود للظهور مباشرة
- **يظهر الفوتر**: يعود للظهور مباشرة
- **النتيجة**: سهولة الوصول للتنقل والأزرار

## التفاصيل التقنية

### 1. إضافة State للتتبع

```typescript
const [isScrollingDown, setIsScrollingDown] = useState(false);
const [lastScrollY, setLastScrollY] = useState(0);
```

### 2. إضافة useRef للحاوية الرئيسية

```typescript
const scrollContainerRef = useRef<HTMLDivElement>(null);
```

### 3. مراقبة التمرير داخل الحاوية مع requestAnimationFrame

```typescript
useEffect(() => {
  const scrollContainer = scrollContainerRef.current;
  if (!scrollContainer) return;

  let ticking = false;

  const handleScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const currentScrollY = scrollContainer.scrollTop;

        // عند التمرير للأسفل بعد 80px من الأعلى
        if (currentScrollY > lastScrollY && currentScrollY > 80) {
          setIsScrollingDown(true);
        }
        // عند التمرير للأعلى
        else if (currentScrollY < lastScrollY) {
          setIsScrollingDown(false);
        }

        setLastScrollY(currentScrollY);
        ticking = false;
      });
      ticking = true;
    }
  };

  scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
  return () => scrollContainer.removeEventListener('scroll', handleScroll);
}, [lastScrollY]);
```

### 4. ربط الـ ref مع الحاوية الرئيسية

```typescript
<div
  ref={scrollContainerRef}
  className="fixed inset-0 bg-gradient-to-br from-green-50/95 via-emerald-50/90 to-teal-50/95 z-50 overflow-y-auto"
>
```

### 5. تطبيق Transitions على الهيدر

```typescript
<div
  className={`sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-green-200/50 transition-transform duration-300 ${
    isScrollingDown ? '-translate-y-full' : 'translate-y-0'
  }`}
>
```

### 6. تطبيق Transitions على الفوتر

```typescript
<div
  className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t-2 border-darkgreen/30 shadow-2xl p-4 z-20 transition-transform duration-300 ${
    isScrollingDown ? 'translate-y-full' : 'translate-y-0'
  }`}
>
```

## الإصلاح الحرج

تم اكتشاف أن الكود الأولي كان يستخدم `window.scrollY` بينما التمرير يحدث داخل `<div>` وليس في window. تم إصلاح هذا عن طريق:

1. إضافة `useRef` للإشارة إلى الحاوية الرئيسية
2. استخدام `scrollContainer.scrollTop` بدلاً من `window.scrollY`
3. إضافة event listener على الحاوية نفسها بدلاً من window

هذا الإصلاح حيوي لضمان عمل الميزة بشكل صحيح.

## المميزات

✅ **أداء ممتاز**: استخدام `requestAnimationFrame` لتمرير سلس
✅ **Passive Events**: استخدام `{ passive: true }` لتحسين الأداء
✅ **Threshold 80px**: لا يختفي الهيدر إلا بعد تمرير معين
✅ **انتقالات سلسة**: `transition-transform duration-300` لحركة طبيعية
✅ **تجربة مألوفة**: نفس السلوك المستخدم في Instagram وTwitter
✅ **استجابة فورية**: يظهر الهيدر والفوتر فوراً عند التمرير للأعلى
✅ **يعمل مع Fixed Containers**: مصمم للعمل مع الحاويات ذات `overflow-y-auto`

## الفوائد للمستخدم

1. **شاشة كاملة للمحتوى**: عند التمرير للأسفل لقراءة التفاصيل
2. **وصول سهل للتنقل**: عند التمرير للأعلى قليلاً
3. **تجربة احترافية**: حركات سلسة وطبيعية
4. **لا إزعاج**: الواجهة تختفي عند الحاجة وتظهر عند الطلب
5. **مساحة أكبر**: للتركيز على محتوى المزرعة والباقات

## الملفات المعدلة

- `src/components/AgriculturalFarmPage.tsx`: إضافة نظام التتبع والتطبيق

## الاختبار المطلوب

1. ✅ افتح صفحة أي مزرعة زراعية
2. ✅ مرر للأسفل ببطء - يجب أن يختفي الهيدر والفوتر
3. ✅ مرر للأعلى قليلاً - يجب أن يظهر الهيدر والفوتر فوراً
4. ✅ جرب التمرير السريع - يجب أن يكون الأداء سلس
5. ✅ اختبر على موبايل - نفس السلوك المتوقع

## ملاحظات

- النظام يعمل فقط في صفحة المزرعة الزراعية
- يمكن تطبيق نفس النمط على صفحة المزرعة الاستثمارية إذا لزم الأمر
- الـ threshold 80px يمكن تعديله حسب الحاجة
- السرعة 300ms مثالية للتوازن بين السلاسة والاستجابة

## النتيجة النهائية

تجربة مستخدم محسّنة بشكل كبير مع:
- واجهة ديناميكية تستجيب لسلوك المستخدم
- مساحة أكبر للمحتوى عند الحاجة
- سهولة الوصول للتنقل عند الطلب
- أداء ممتاز وحركات سلسة
- تصميم احترافي يضاهي التطبيقات العالمية
