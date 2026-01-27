# 🎨 خريطة ربط الواجهة بالبرمجة

دليل سريع لربط كل عنصر في الواجهة بالكود المطلوب.

---

## 📱 Header (الترويسة)

### أيقونة المستخدم (يمين)
```typescript
Button → onClick → Navigate to /profile
Required: ✅ Authentication
Service: authService.getUserProfile(userId)
```

---

## 📢 Announcement Bar (شريط الإعلانات)

### النص الديناميكي
```typescript
Display: Latest farm announcement
Service: farmService.getAllFarms('upcoming').limit(1)
Required: ❌ Public
```

---

## 🏞️ Hero Section (القسم الرئيسي)

### الصورة والمحتوى
```typescript
Type: Static content
Future: Can be dynamic from settings table
Required: ❌ Public
```

---

## ⚡ Quick Actions (الإجراءات السريعة)

### 1. بطاقة الحاسبة
```typescript
Button → onClick → Navigate to /calculator
Component: <InvestmentCalculator />
Required: ❌ Public
Logic: Client-side calculation
```

### 2. بطاقة المحفظة
```typescript
Button → onClick → {
  if (!user) Navigate to /auth/login
  else Navigate to /portfolio
}
Service: investmentService.getUserPortfolio(userId)
Required: ✅ Authentication
```

### 3. بطاقة التقارير
```typescript
Button → onClick → {
  if (!user) Navigate to /auth/login
  else Navigate to /reports
}
Service: reportService.getMonthlyReports(userId)
Required: ✅ Authentication
```

---

## ℹ️ Info Bar (شريط المعلومات)

### النص الديناميكي
```typescript
Display: Latest user notification
Service: notificationService.getLatestNotification(userId)
Required: ✅ Authentication
Fallback: Generic message if not logged in
```

---

## 🌾 Farm Cards (بطاقات المزارع)

### عرض البطاقات
```typescript
onMount → {
  const farms = await farmService.getAllFarms('active')
  setFarms(farms)
}
Required: ❌ Public for viewing
```

### زر "استثمر الآن"
```typescript
Button → onClick → {
  if (!user) {
    Navigate to /auth/login
    Store intended farm in sessionStorage
  } else {
    Show investment modal/form
    On submit → {
      await investmentService.createInvestment({
        userId: user.id,
        farmId: farm.id,
        amount: inputAmount,
        shares: inputShares
      })
      Navigate to /portfolio
    }
  }
}
Required: ✅ Authentication
Validation:
  - amount >= farm.min_investment
  - amount <= farm.max_investment
  - farm.current_invested + amount <= farm.total_capacity
```

---

## 🏷️ Category Slider (شريط التصنيفات)

### أيقونة Apple (زيتون)
```typescript
Button → onClick → {
  const categoryId = getCategoryId('Olives')
  const farms = await farmService.getFarmsByCategory(categoryId)
  setFarms(farms)
}
Required: ❌ Public
```

### أيقونة Wheat (قمح)
```typescript
Button → onClick → {
  const categoryId = getCategoryId('Wheat')
  const farms = await farmService.getFarmsByCategory(categoryId)
  setFarms(farms)
}
Required: ❌ Public
```

### أيقونة Grape (عنب)
```typescript
Button → onClick → {
  const categoryId = getCategoryId('Grapes')
  const farms = await farmService.getFarmsByCategory(categoryId)
  setFarms(farms)
}
Required: ❌ Public
```

### أيقونة Plus (عرض الكل)
```typescript
Button → onClick → {
  const farms = await farmService.getAllFarms('active')
  setFarms(farms)
}
Required: ❌ Public
```

---

## 🧭 Bottom Navigation (التنقل السفلي)

### 1. الأسواق (TrendingUp)
```typescript
Button → onClick → Navigate to /markets
Page shows: All available farms with filters
Service: farmService.getAllFarms()
Required: ❌ Public
```

### 2. المحفظة (FileText)
```typescript
Button → onClick → {
  if (!user) Navigate to /auth/login
  else Navigate to /portfolio
}
Page shows: User's investments, returns, stats
Service: investmentService.getUserPortfolio(userId)
Required: ✅ Authentication
```

### 3. الزر الرئيسي (Sprout - مركزي برتقالي)
```typescript
Button → onClick → Navigate to / (Home)
Page shows: Main landing page (current view)
Required: ❌ Public
```

### 4. الحاسبة (Calculator)
```typescript
Button → onClick → Navigate to /calculator
Page shows: Investment calculator form
Logic:
  - Input: amount, duration, rate
  - Output: expected_return = amount * rate * (duration/12)
Required: ❌ Public
```

### 5. الملف (User)
```typescript
Button → onClick → {
  if (!user) Navigate to /auth/login
  else Navigate to /profile
}
Page shows: User profile, settings, stats
Service: authService.getUserProfile(userId)
Required: ✅ Authentication
```

---

## 🔐 Authentication Flow (تدفق المصادقة)

### صفحة Login
```typescript
Form → onSubmit → {
  try {
    const { user, session } = await authService.signIn(email, password)
    Store session
    Navigate to intended page or /portfolio
  } catch (error) {
    Show error message
  }
}
```

### صفحة Signup
```typescript
Form → onSubmit → {
  try {
    await authService.signUp(email, password, fullName)
    Show success message (check email)
    Navigate to /auth/login
  } catch (error) {
    Show error message
  }
}
```

### تسجيل الخروج
```typescript
Button → onClick → {
  await authService.signOut()
  Clear session
  Navigate to /
}
```

---

## 📊 Upcoming Pages (الصفحات المطلوبة)

### `/portfolio` - المحفظة
```typescript
Components needed:
  - PortfolioSummary (total invested, returns)
  - ActiveInvestmentsList (cards with farm name, amount, status)
  - TransactionHistory (list of transactions)

Data:
  - investmentService.getUserPortfolio(userId)
  - investmentService.getUserTransactions(userId)
```

### `/calculator` - الحاسبة
```typescript
Components needed:
  - InvestmentCalculatorForm
    - Input: amount (number)
    - Input: annual_rate (number, default from farms)
    - Input: duration_months (number, default 12)
    - Output: expected_return (calculated)
    - Output: monthly_return (calculated)

Logic:
  expected_return = amount * (rate / 100) * (duration / 12)
  monthly_return = expected_return / duration
```

### `/reports` - التقارير
```typescript
Components needed:
  - MonthlyReportsList (cards with farm name, month, harvest)
  - ReportDetailModal (full report content)

Data:
  - reportService.getMonthlyReports(userId)
  - Filter by user's invested farms
```

### `/profile` - الملف الشخصي
```typescript
Components needed:
  - ProfileInfo (name, phone, email)
  - InvestmentStats (total invested, returns)
  - ProfileEditForm (update name, phone)
  - SecuritySettings (change password)

Data:
  - authService.getUserProfile(userId)
  - investmentService.getUserPortfolio(userId)
```

### `/markets` - الأسواق
```typescript
Components needed:
  - FarmFilters (by category, return rate, status)
  - FarmGrid (all available farms)
  - FarmDetailModal (full farm information)

Data:
  - farmService.getAllFarms()
  - farmService.getAllCategories()
```

---

## 🎯 Priority Order (أولوية التطوير)

### المرحلة 1 (Critical)
1. ✅ Database setup
2. ✅ Type definitions
3. ✅ Services layer
4. 🔄 Authentication pages (Login/Signup)
5. 🔄 Investment modal/form
6. 🔄 Connect farm cards to real data

### المرحلة 2 (Important)
1. Portfolio page
2. Calculator page
3. Profile page
4. Error handling
5. Loading states

### المرحلة 3 (Nice to have)
1. Reports page
2. Markets page with filters
3. Notifications system
4. Payment integration

---

## 💡 Quick Tips

### تحويل Static إلى Dynamic
```typescript
// Before (static)
<h3>مزرعة الزيتون</h3>

// After (dynamic)
<h3>{farm.name_ar}</h3>
```

### التعامل مع Authentication
```typescript
import { useEffect, useState } from 'react'
import { authService } from './services'

function useAuth() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    authService.getCurrentUser().then(setUser)

    const { data: { subscription } } = authService.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return user
}
```

### التعامل مع Errors
```typescript
try {
  const data = await farmService.getAllFarms()
  setFarms(data)
  setError(null)
} catch (error) {
  setError('حدث خطأ في تحميل المزارع')
  console.error(error)
}
```

---

## ✅ Checklist للمطور

عند تطوير صفحة جديدة:

- [ ] إنشاء component file
- [ ] إضافة route في router
- [ ] إضافة loading state
- [ ] إضافة error handling
- [ ] ربط بـ service المناسب
- [ ] إضافة authentication check إذا لزم
- [ ] اختبار مع بيانات حقيقية
- [ ] إضافة responsive design
- [ ] إضافة transitions/animations
- [ ] مراجعة accessibility

---

**كل شيء جاهز للتطوير!** 🚀
