# إخفاء Header و Footer عند الدخول للوحة التحكم الإدارية

## المشكلة

عند الدخول إلى لوحة التحكم الإدارية، كان الـ Header والـ Footer للواجهة الرئيسية لا يزالان ظاهرين، مما يسبب:
- إرباك بصري
- أخذ مساحة غير ضرورية
- تداخل مع واجهة الإدارة

## الحل المطبق

تم إضافة شروط إضافية لإخفاء جميع عناصر الواجهة الرئيسية عند الدخول للوحة التحكم.

### التغييرات في App.tsx

#### 1. إخفاء Header

```typescript
// قبل
{!selectedInvestmentFarm && (
  <Header
    isVisible={!isScrollingDown}
    onAdminAccess={() => setShowAdminLogin(true)}
  />
)}

// بعد
{!selectedInvestmentFarm && !showAdminDashboard && !showAdminLogin && !admin && (
  <Header
    isVisible={!isScrollingDown}
    onAdminAccess={() => setShowAdminLogin(true)}
  />
)}
```

#### 2. إخفاء المحتوى الرئيسي

```typescript
// قبل
{!selectedInvestmentFarm && (
  <>
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* القوائم والمزارع */}
    </div>
  </>
)}

// بعد
{!selectedInvestmentFarm && !showAdminDashboard && !showAdminLogin && !admin && (
  <>
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* القوائم والمزارع */}
    </div>
  </>
)}
```

#### 3. إخفاء Footer للديسكتوب

```typescript
// قبل
{!selectedInvestmentFarm && !showAssistant && (
  <nav className="hidden lg:flex fixed left-0 right-0 z-50 backdrop-blur-2xl">
    {/* محتوى الفوتر */}
  </nav>
)}

// بعد
{!selectedInvestmentFarm && !showAssistant && !showAdminDashboard && !showAdminLogin && !admin && (
  <nav className="hidden lg:flex fixed left-0 right-0 z-50 backdrop-blur-2xl">
    {/* محتوى الفوتر */}
  </nav>
)}
```

#### 4. إخفاء Footer للموبايل

```typescript
// قبل
{!selectedInvestmentFarm && !showAssistant && (
  <nav className="fixed left-0 right-0 lg:hidden backdrop-blur-2xl">
    {/* محتوى الفوتر */}
  </nav>
)}

// بعد
{!selectedInvestmentFarm && !showAssistant && !showAdminDashboard && !showAdminLogin && !admin && (
  <nav className="fixed left-0 right-0 lg:hidden backdrop-blur-2xl">
    {/* محتوى الفوتر */}
  </nav>
)}
```

## الشروط المضافة

تم إضافة ثلاثة شروط جديدة لكل عنصر:

```typescript
!showAdminDashboard  // عدم عرض لوحة التحكم
!showAdminLogin      // عدم عرض صفحة تسجيل دخول المدير
!admin               // المستخدم ليس مديراً
```

## النتيجة

عند الدخول إلى لوحة التحكم الإدارية، يختفي تماماً:
- Header الرئيسي
- القوائم العلوية
- مبدل الوضع
- فئات المزارع
- بطاقات المزارع
- Footer الديسكتوب
- Footer الموبايل

ويظهر فقط لوحة التحكم الإدارية بمساحة عمل كاملة ونظيفة.

## الاختبار

1. افتح المنصة
2. اضغط على زر "الإدارة" في Header
3. سجل دخول: admin@dev.com / Admin@2026
4. تحقق: لا Header، لا Footer

---

**تاريخ التحديث:** 2026-02-02
**الحالة:** مكتمل
**التأثير:** تجربة إدارية نظيفة بدون تشتيت
