# 📋 مواصفات التطوير الفنية - منصة مزارعنا

## 🎯 نظرة عامة

هذا المستند يحدد المتطلبات الفنية الكاملة لتفعيل المنصة وربطها بالخلفية.

---

## 🗂️ بنية قاعدة البيانات

### الجداول المنشأة

✅ **user_profiles** - ملفات المستخدمين الشخصية
✅ **farm_categories** - تصنيفات المحاصيل
✅ **farms** - المزارع المتاحة للاستثمار
✅ **investments** - استثمارات المستخدمين
✅ **transactions** - المعاملات المالية
✅ **monthly_reports** - التقارير الشهرية
✅ **user_notifications** - الإشعارات

---

## 🔐 المصادقة والأمان

### متطلبات Authentication

```typescript
// يتطلب Supabase Auth
import { createClient } from '@supabase/supabase-js'

// المستخدم يجب أن يكون مسجل دخول لـ:
- عرض المحفظة الاستثمارية
- إنشاء استثمار جديد
- عرض التقارير الشهرية
- إدارة الملف الشخصي
- عرض الإشعارات
```

### Row Level Security (RLS)
- ✅ جميع الجداول محمية بـ RLS
- ✅ المستخدم يصل فقط لبياناته الخاصة
- ✅ المزارع والتصنيفات متاحة للجميع (قراءة فقط)

---

## 🎨 ربط واجهة المستخدم بالخلفية

### 1️⃣ **Header (64px)**

#### الزر: أيقونة المستخدم
```typescript
Action: Navigate to Profile Page
API Required: GET /api/user/profile
Authentication: ✅ Required
Data Model: user_profiles table

Response:
{
  full_name: string
  phone: string
  total_invested: number
  total_returns: number
}
```

---

### 2️⃣ **Announcement Bar (36px)**

#### محتوى ديناميكي
```typescript
Action: Display latest farm announcement
API Required: GET /api/farms?status=upcoming&limit=1
Authentication: ❌ Public
Data Model: farms table

Response:
{
  name_ar: string
  annual_return_rate: number
}
```

---

### 3️⃣ **Hero Section (220px)**

#### الصورة والمحتوى
```typescript
Action: Display hero content
API Required: Static content (no API needed initially)
Authentication: ❌ Public
Future: Can be dynamic from CMS table
```

---

### 4️⃣ **Quick Actions - 3 Cards (96px)**

#### بطاقة 1: الحاسبة الاستثمارية
```typescript
Action: Navigate to Investment Calculator
API Required: None (client-side calculation)
Authentication: ❌ Public
Component: <InvestmentCalculator />

Calculator Logic:
- Input: investment_amount (number)
- Input: annual_return_rate (number)
- Input: duration_months (number)
- Output: expected_return (calculated)
```

#### بطاقة 2: محفظتي الاستثمارية
```typescript
Action: Navigate to Portfolio Page
API Required: GET /api/investments/my-portfolio
Authentication: ✅ Required
Data Model: investments + farms (JOIN)

Response:
{
  total_invested: number
  total_expected_return: number
  active_investments: Investment[]
}

Investment Type:
{
  id: string
  farm_name: string
  amount: number
  expected_return: number
  status: 'active' | 'completed'
  invested_at: date
  maturity_date: date
}
```

#### بطاقة 3: التقارير الشهرية
```typescript
Action: Navigate to Reports Page
API Required: GET /api/reports/monthly
Authentication: ✅ Required (for personalized reports)
Data Model: monthly_reports + investments (JOIN)

Response:
{
  reports: Report[]
}

Report Type:
{
  id: string
  farm_name: string
  report_month: date
  title_ar: string
  content_ar: string
  harvest_amount: number
  revenue: number
}
```

---

### 5️⃣ **Info Bar (40px)**

#### محتوى ديناميكي
```typescript
Action: Display latest activity
API Required: GET /api/notifications/latest
Authentication: ✅ Required
Data Model: user_notifications table

Response:
{
  message_ar: string
  type: 'investment' | 'return' | 'report' | 'system'
  created_at: date
}
```

---

### 6️⃣ **Farm Cards (160px each)**

#### بطاقة مزرعة واحدة
```typescript
Action: Display farm investment opportunity
API Required: GET /api/farms?status=active
Authentication: ❌ Public (list view)
Data Model: farms + farm_categories (JOIN)

Response:
{
  farms: Farm[]
}

Farm Type:
{
  id: string
  name_ar: string
  description_ar: string
  image_url: string
  annual_return_rate: number
  min_investment: number
  max_investment: number
  total_capacity: number
  current_invested: number
  status: 'active' | 'upcoming' | 'completed'
  location: string
  category: {
    name_ar: string
    icon: string
  }
}
```

#### زر "استثمر الآن"
```typescript
Action: Create new investment
API Required: POST /api/investments/create
Authentication: ✅ Required
Data Model: investments + transactions

Request Body:
{
  farm_id: string
  amount: number
  shares: number
}

Response:
{
  investment_id: string
  transaction_id: string
  status: 'pending' | 'completed'
  expected_return: number
  maturity_date: date
}

Business Logic:
1. Verify user is authenticated
2. Validate investment amount (min/max)
3. Check farm capacity (current_invested + amount <= total_capacity)
4. Create investment record
5. Create transaction record
6. Update farm.current_invested
7. Update user_profiles.total_invested
8. Send notification to user
```

---

### 7️⃣ **Category Slider (64x64 icons)**

#### أزرار التصنيفات
```typescript
Action: Filter farms by category
API Required: GET /api/farms?category_id={id}
Authentication: ❌ Public
Data Model: farms + farm_categories (JOIN)

Categories:
- Apple (الزيتون)
- Wheat (القمح)
- Grape (العنب)
- Plus (عرض الكل)

Response:
{
  farms: Farm[] // filtered by category
}
```

---

### 8️⃣ **Bottom Navigation (72px)**

#### زر 1: الأسواق
```typescript
Action: Navigate to Markets/Browse Page
API Required: GET /api/farms?status=active
Authentication: ❌ Public
Page: Shows all available farms
```

#### زر 2: المحفظة
```typescript
Action: Navigate to Portfolio Page
API Required: GET /api/investments/my-portfolio
Authentication: ✅ Required
Page: Shows user's investments and returns
```

#### زر 3: الزر الرئيسي (مزارع)
```typescript
Action: Navigate to Home Page
API Required: None
Authentication: ❌ Public
Page: Main landing page (current view)
```

#### زر 4: الحاسبة
```typescript
Action: Navigate to Calculator Page
API Required: None (client-side)
Authentication: ❌ Public
Page: Investment calculator tool
```

#### زر 5: الملف
```typescript
Action: Navigate to Profile Page
API Required: GET /api/user/profile
Authentication: ✅ Required
Page: User profile and settings
```

---

## 🔌 API Endpoints المطلوبة

### Authentication
```
POST   /api/auth/signup          - إنشاء حساب جديد
POST   /api/auth/login           - تسجيل الدخول
POST   /api/auth/logout          - تسجيل الخروج
GET    /api/auth/session         - التحقق من الجلسة
```

### Farms
```
GET    /api/farms                - قائمة المزارع (مع فلترة)
GET    /api/farms/:id            - تفاصيل مزرعة واحدة
GET    /api/farms/featured       - المزارع المميزة
```

### Investments
```
GET    /api/investments/my-portfolio      - محفظة المستخدم
POST   /api/investments/create            - إنشاء استثمار جديد
GET    /api/investments/:id               - تفاصيل استثمار
```

### Transactions
```
GET    /api/transactions/my-history       - سجل المعاملات
POST   /api/transactions/deposit          - إيداع رصيد
POST   /api/transactions/withdraw         - سحب رصيد
```

### Reports
```
GET    /api/reports/monthly              - التقارير الشهرية
GET    /api/reports/farm/:farmId         - تقارير مزرعة محددة
```

### User Profile
```
GET    /api/user/profile                 - بيانات الملف الشخصي
PUT    /api/user/profile                 - تحديث الملف الشخصي
```

### Notifications
```
GET    /api/notifications                - جميع الإشعارات
GET    /api/notifications/latest         - آخر إشعار
PUT    /api/notifications/:id/read       - تمييز كمقروء
```

---

## 📦 حالة النظام الحالية

### ✅ مكتمل
- تصميم واجهة المستخدم الكامل
- نظام الألوان والتنسيق
- بنية قاعدة البيانات
- Row Level Security
- نماذج البيانات

### 🔄 يحتاج تطوير
- Supabase Client Configuration
- API Service Layer
- Authentication Flow
- State Management (React Context/Zustand)
- Form Validation
- Error Handling
- Loading States

### 📋 الخطوات التالية للمطور

1. **إعداد Supabase Client**
   - إنشاء `src/lib/supabase.ts`
   - إضافة Type Definitions من Database

2. **إنشاء API Services**
   - `src/services/farmService.ts`
   - `src/services/investmentService.ts`
   - `src/services/authService.ts`

3. **إضافة State Management**
   - Authentication Context
   - User Profile State
   - Investment Portfolio State

4. **إنشاء الصفحات**
   - `/portfolio` - المحفظة الاستثمارية
   - `/calculator` - الحاسبة
   - `/reports` - التقارير
   - `/profile` - الملف الشخصي
   - `/auth/login` - تسجيل الدخول
   - `/auth/signup` - إنشاء حساب

5. **إضافة Forms**
   - Investment Form
   - Profile Update Form
   - Authentication Forms

6. **Testing & Validation**
   - Unit Tests
   - Integration Tests
   - User Flow Testing

---

## 🚀 جاهزية الإنتاج

### المنصة الآن:
✅ واجهة مستقرة وجاهزة
✅ قاعدة بيانات محمية وآمنة
✅ مواصفات فنية واضحة
✅ يمكن لأي مطور فهمها والعمل عليها
✅ قابلة للتوسع والتطوير

### المنصة تنتظر:
🔄 ربط API بالواجهة
🔄 تفعيل نظام المصادقة
🔄 إضافة صفحات إضافية
🔄 اختبارات شاملة
