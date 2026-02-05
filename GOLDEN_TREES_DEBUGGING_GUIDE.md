# 🔍 دليل تتبع مشكلة "أشجاري الذهبية"

## 📋 ملخص المشكلة

المستخدم يقول: "الدورات الاستثمارية موجودة في لوحة الإدارة، لكنها لا تظهر عند الضغط على زر الفوتر 'أشجاري'"

---

## ✅ التحقق من البيانات في قاعدة البيانات

### 1. الدورات الاستثمارية موجودة ومنشورة ✓

```sql
SELECT
  id, farm_id, status, visible_to_client, cycle_date, description
FROM investment_cycles
WHERE status = 'published' AND visible_to_client = true;
```

**النتيجة:**
- ✅ دورتان منشورتان
- ✅ visible_to_client = true
- ✅ البيانات صحيحة

### 2. المستخدمون لديهم حجوزات استثمارية ✓

```sql
SELECT
  user_id, farm_id, total_trees, status
FROM reservations
WHERE path_type = 'investment' AND status IN ('active', 'confirmed', 'paid');
```

**النتيجة:**
- ✅ 11 حجز استثماري نشط
- ✅ المستخدمون لديهم أشجار في المزارع الصحيحة
- ✅ العلاقة بين الحجوزات والمزارع صحيحة

---

## 🔍 التدفق الكامل للنظام

### 1. عند الضغط على زر "أشجاري" في الفوتر

```typescript
// src/App.tsx - handleMyFarmClick()
const handleMyFarmClick = () => {
  console.log(`🏠 [Footer Button] Clicked "أشجاري"`);

  if (!user) {
    // للزوار: يدخل Demo Mode
    const demoType = identity === 'agricultural' ? 'green' : 'golden';
    enterDemoMode(demoType);
    setShowMyTrees(true);
    return;
  }

  // للمستخدمين المسجلين: يفتح MyTrees
  console.log(`✅ [Footer Button] Opening My Trees`);
  setShowMyTrees(true);
};
```

### 2. داخل MyTrees Component

```typescript
// src/components/MyTrees.tsx
export default function MyTrees() {
  const { user, identity } = useAuth(); // ← هنا المفتاح!
  const { isDemoMode, demoType } = useDemoMode();

  const activePath: ActivePath = isDemoMode
    ? (demoType === 'green' ? 'green' : 'golden')
    : (identity === 'agricultural' ? 'green' : 'golden'); // ← يعتمد على الهوية!

  return <MyGreenTrees ... />;
}
```

### 3. داخل MyGreenTrees Component

```typescript
// src/components/MyGreenTrees.tsx
const loadMaintenanceRecords = async () => {
  if (identity === 'investment') {
    // ✅ يحمل الدورات الاستثمارية
    const cycles = await investmentCyclesService.getClientInvestmentCycles();
    setInvestmentCycles(cycles);
  } else {
    // ✅ يحمل سجلات الصيانة الزراعية
    const data = await clientMaintenanceService.getClientMaintenanceRecords('agricultural');
    setRecords(data);
  }
};
```

---

## 🎯 السبب المحتمل للمشكلة

**المشكلة**: المستخدم مسجل دخول بهوية `agricultural` وليس `investment`!

### كيف تتحقق من الهوية الحالية:

#### الطريقة 1: من خلال الواجهة
1. افتح التطبيق
2. إذا كنت في Demo Mode، اخرج منه
3. سجل الدخول
4. افتح **Developer Console** (F12)
5. اكتب: `localStorage.getItem('appMode')`
6. ستظهر إما `'agricultural'` أو `'investment'`

#### الطريقة 2: من خلال قاعدة البيانات
```sql
SELECT
  user_id,
  primary_identity,
  secondary_identity,
  secondary_identity_enabled
FROM user_profiles
WHERE user_id = 'YOUR_USER_ID';
```

---

## 🔧 الحل

### ✅ الحل الأول: تبديل الهوية

إذا كان المستخدم مسجل بهوية `agricultural`، يحتاج لتبديلها إلى `investment`:

1. **من الواجهة:**
   - ابحث عن زر "تبديل الهوية" أو "Identity Switcher"
   - أو استخدم `IdentitySwitcher` component

2. **من Console:**
```javascript
// تغيير الهوية مؤقتاً (للاختبار فقط)
localStorage.setItem('appMode', 'investment');
window.location.reload();
```

### ✅ الحل الثاني: تفعيل الهوية الثانوية

إذا كان المستخدم يريد استخدام كلا المسارين:

```sql
-- تفعيل الهوية الثانوية للمستخدم
UPDATE user_profiles
SET
  secondary_identity = 'investment',
  secondary_identity_enabled = true
WHERE user_id = 'YOUR_USER_ID';
```

---

## 📊 تسجيلات التصحيح (Debug Logs)

لقد أضفت console.log شاملة في:

### 1. MyTrees Component
```
[MyTrees] Component mounted/updated: {
  user: "xxx",
  identity: "agricultural" أو "investment",
  isDemoMode: true/false,
  activePath: "green" أو "golden"
}
```

### 2. MyGreenTrees Component

#### عند التحميل:
```
[MyGreenTrees] Loading maintenance records for user xxx (identity: xxx)
[MyGreenTrees] Fetching investment cycles...
[MyGreenTrees] ✅ Loaded N investment cycles: [...]
```

#### عند حساب المزارع:
```
[MyGreenTrees] Processing cycle: {
  cycleId: "xxx",
  farmId: "xxx",
  farmName: "xxx",
  userTreeCount: 50
}
```

```
[MyGreenTrees] Farm groups computed: {
  isInvestment: true,
  farmGroups: {...},
  farmGroupsKeys: ["farm1", "farm2"]
}
```

#### عند الـ Render:
```
[MyGreenTrees] Render state: {
  isInvestment: true,
  investmentCyclesLength: 2,
  farmsLength: 2,
  selectedFarm: "xxx",
  selectedFarmCyclesLength: 1
}
```

---

## 🧪 خطوات الاختبار

### السيناريو 1: مستخدم بهوية agricultural

1. سجل دخول بحساب لديه حجوزات **investment**
2. تأكد أن `identity = 'agricultural'`
3. اضغط على زر "أشجاري" في الفوتر
4. **النتيجة المتوقعة**: سيظهر سجلات الصيانة الزراعية (وليس الدورات الاستثمارية)

### السيناريو 2: مستخدم بهوية investment

1. سجل دخول بنفس الحساب
2. غيّر الهوية إلى `'investment'`
3. اضغط على زر "أشجاري" في الفوتر
4. **النتيجة المتوقعة**: سيظهر الدورات الاستثمارية ✅

### السيناريو 3: Demo Mode

1. اخرج من الحساب (لا user)
2. اضغط على زر "أشجاري" في الفوتر
3. سيدخل Demo Mode تلقائياً
4. **النتيجة المتوقعة**: سيظهر بيانات تجريبية حسب الهوية الحالية

---

## 📝 ملاحظات مهمة

### 1. العلاقة بين الهوية والمحتوى

| الهوية (Identity) | المحتوى المعروض |
|-------------------|------------------|
| `agricultural` | سجلات الصيانة الزراعية (Green Trees) |
| `investment` | الدورات الاستثمارية (Golden Trees) |

### 2. الفرق بين path_type و identity

- **`path_type` في reservations**: نوع الحجز نفسه (agricultural / investment)
- **`identity` في user_profiles**: هوية المستخدم النشطة حالياً

**مثال:**
- مستخدم لديه حجوزات investment (path_type = 'investment')
- لكن هويته الحالية agricultural (identity = 'agricultural')
- **النتيجة**: لن يرى الدورات الاستثمارية حتى يبدل هويته!

### 3. تحسينات مستقبلية مقترحة

#### خيار 1: عرض كلا النوعين
```typescript
// عرض كل من الدورات الاستثمارية والسجلات الزراعية
// بناءً على نوع الحجوزات التي يملكها المستخدم
const userHasInvestment = await checkUserHasInvestmentReservations();
const userHasAgricultural = await checkUserHasAgriculturalReservations();

if (userHasInvestment) showInvestmentCycles();
if (userHasAgricultural) showAgriculturalRecords();
```

#### خيار 2: زران منفصلان في الفوتر
```typescript
// زر "أشجاري الخضراء" - دائماً يعرض Agricultural
// زر "أشجاري الذهبية" - دائماً يعرض Investment
```

#### خيار 3: تلقائية الهوية
```typescript
// تحديد الهوية تلقائياً بناءً على نوع الحجوزات
if (user has ONLY investment reservations) {
  auto-switch to investment identity
}
```

---

## 🎬 كيفية المتابعة

### للمطور:
1. افتح Developer Console (F12)
2. انتقل إلى تبويب Console
3. اضغط على زر "أشجاري" في الفوتر
4. راقب جميع الـ console.log messages
5. شارك لقطات الشاشة من الـ logs

### للمستخدم النهائي:
1. تأكد من أنك مسجل دخول بهوية "investment"
2. أو استخدم ميزة "الهوية الثانوية" لتبديل سريع بين المسارين
3. إذا كنت في Demo Mode، اخرج منه أولاً

---

## 📞 إذا استمرت المشكلة

إذا كانت:
- ✅ الهوية = investment
- ✅ المستخدم لديه حجوزات investment
- ✅ الدورات منشورة في قاعدة البيانات
- ❌ لكن لا تظهر الدورات

فالمشكلة في:
1. استعلام `getClientInvestmentCycles()` - تحقق من الكونسول
2. RLS policies - تحقق من أن المستخدم لديه صلاحية قراءة investment_cycles
3. خطأ في JavaScript - سيظهر في الكونسول

**في هذه الحالة، شارك:**
- ✅ جميع console.log messages
- ✅ أي رسائل خطأ حمراء
- ✅ user_id المستخدم للاختبار
- ✅ لقطة شاشة من الصفحة

---

## ✨ الخلاصة

**السبب الأرجح**: المستخدم مسجل بهوية `agricultural` وليس `investment`.

**الحل السريع**: تبديل الهوية إلى `investment` قبل الضغط على الزر.

**الحل الدائم**: تنفيذ أحد التحسينات المقترحة أعلاه.
