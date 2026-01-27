# 🌾 مزارعنا - منصة الاستثمار الزراعي

منصة استثمارية تربط المستثمرين بفرص زراعية موثوقة مع عوائد سنوية مضمونة.

---

## 🚀 حالة المشروع

### ✅ مكتمل وجاهز
- ✅ تصميم واجهة المستخدم الكامل (UI/UX)
- ✅ نظام الألوان والتنسيق
- ✅ بنية قاعدة البيانات (7 جداول)
- ✅ Row Level Security (RLS)
- ✅ TypeScript Type Definitions
- ✅ Supabase Client Configuration
- ✅ API Service Layer (5 خدمات)
- ✅ بيانات تجريبية (3 مزارع، 4 تصنيفات)

### 🔄 يحتاج تطوير
- Authentication UI (Login/Signup pages)
- Additional Pages (Portfolio, Calculator, Reports, Profile)
- Form Components
- State Management (Context/Zustand)
- Error Handling & Loading States
- Unit & Integration Tests

---

## 📁 بنية المشروع

```
src/
├── lib/
│   └── supabase.ts              # Supabase client configuration
├── services/
│   ├── index.ts                 # Export all services
│   ├── authService.ts           # Authentication operations
│   ├── farmService.ts           # Farm & category operations
│   ├── investmentService.ts     # Investment & portfolio operations
│   ├── reportService.ts         # Monthly reports
│   └── notificationService.ts   # User notifications
├── types/
│   └── database.types.ts        # Database TypeScript types
├── App.tsx                      # Main app component
└── main.tsx                     # Entry point
```

---

## 🗄️ قاعدة البيانات

### الجداول

1. **user_profiles** - ملفات المستخدمين
2. **farm_categories** - تصنيفات المحاصيل (زيتون، قمح، عنب، نخيل)
3. **farms** - المزارع المتاحة للاستثمار
4. **investments** - استثمارات المستخدمين
5. **transactions** - سجل المعاملات المالية
6. **monthly_reports** - التقارير الشهرية للمزارع
7. **user_notifications** - إشعارات المستخدمين

### العلاقات

```
auth.users (Supabase Auth)
    ↓
user_profiles (1:1)
    ↓
investments (1:N) → farms (N:1) → farm_categories
    ↓
transactions (1:N)

farms → monthly_reports (1:N)
users → user_notifications (1:N)
```

---

## 🔐 المصادقة والأمان

### Supabase Authentication
- Email/Password authentication
- Session management
- Auto-refresh tokens

### Row Level Security (RLS)
جميع الجداول محمية:
- ✅ المستخدم يصل فقط لبياناته
- ✅ المزارع والتصنيفات قراءة عامة
- ✅ الاستثمارات محمية حسب المستخدم
- ✅ التقارير متاحة للجميع

---

## 🛠️ البدء بالتطوير

### 1. التثبيت

```bash
npm install
```

### 2. متغيرات البيئة

ملف `.env` موجود ويحتوي على:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. تشغيل المشروع

```bash
npm run dev
```

### 4. البناء للإنتاج

```bash
npm run build
```

---

## 📚 استخدام الخدمات (Services)

### مثال: جلب المزارع

```typescript
import { farmService } from './services'

// Get all active farms
const farms = await farmService.getAllFarms('active')

// Get farm by ID
const farm = await farmService.getFarmById('farm-uuid')

// Get farms by category
const oliveFarms = await farmService.getFarmsByCategory('category-uuid')

// Get featured farms
const featured = await farmService.getFeaturedFarms(3)
```

### مثال: إنشاء استثمار

```typescript
import { investmentService } from './services'

const investment = await investmentService.createInvestment({
  userId: 'user-uuid',
  farmId: 'farm-uuid',
  amount: 10000,
  shares: 10
})
```

### مثال: جلب محفظة المستخدم

```typescript
import { investmentService } from './services'

const portfolio = await investmentService.getUserPortfolio('user-uuid')

console.log(portfolio.total_invested)
console.log(portfolio.active_investments_count)
console.log(portfolio.investments)
```

### مثال: المصادقة

```typescript
import { authService } from './services'

// Sign up
await authService.signUp('email@example.com', 'password', 'Full Name')

// Sign in
const { user, session } = await authService.signIn('email@example.com', 'password')

// Get current user
const user = await authService.getCurrentUser()

// Sign out
await authService.signOut()
```

---

## 🎨 ربط الواجهة بالبيانات

### الخطوة التالية: تحويل Static إلى Dynamic

الواجهة الحالية تعرض بيانات ثابتة. لتفعيلها:

#### مثال: تحويل Farm Cards إلى Dynamic

**قبل (Static):**
```tsx
<div className="border rounded-lg">
  <img src="https://..." alt="Olive farm" />
  <h3>مزرعة الزيتون</h3>
  <span>العائد السنوي: 12%</span>
  <button>استثمر الآن</button>
</div>
```

**بعد (Dynamic):**
```tsx
import { useEffect, useState } from 'react'
import { farmService } from './services'

function FarmsList() {
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFarms() {
      try {
        const data = await farmService.getAllFarms('active')
        setFarms(data)
      } catch (error) {
        console.error('Error loading farms:', error)
      } finally {
        setLoading(false)
      }
    }
    loadFarms()
  }, [])

  if (loading) return <div>جاري التحميل...</div>

  return (
    <div className="space-y-4">
      {farms.map(farm => (
        <div key={farm.id} className="border rounded-lg">
          <img src={farm.image_url} alt={farm.name_ar} />
          <h3>{farm.name_ar}</h3>
          <span>العائد السنوي: {farm.annual_return_rate}%</span>
          <button onClick={() => handleInvest(farm.id)}>
            استثمر الآن
          </button>
        </div>
      ))}
    </div>
  )
}
```

---

## 📖 المستندات الفنية

راجع `TECHNICAL_SPEC.md` للمواصفات الكاملة:
- ربط كل عنصر UI بـ API المطلوب
- نماذج البيانات
- متطلبات Authentication
- Business Logic

---

## 🧪 الاختبار

### بيانات تجريبية متوفرة

قاعدة البيانات تحتوي على:
- ✅ 4 تصنيفات (زيتون، قمح، عنب، نخيل)
- ✅ 3 مزارع نشطة بعوائد مختلفة (10%, 12%, 15%)

### لإنشاء حساب تجريبي:

```typescript
import { authService } from './services'

await authService.signUp(
  'test@example.com',
  'SecurePassword123!',
  'مستثمر تجريبي'
)
```

---

## 🔧 الصيانة والتطوير

### إضافة مزرعة جديدة

```sql
INSERT INTO farms (
  category_id,
  name_ar,
  name_en,
  description_ar,
  image_url,
  annual_return_rate,
  min_investment,
  total_capacity,
  start_date,
  end_date,
  status,
  location
) VALUES (
  'category-uuid',
  'مزرعة جديدة',
  'New Farm',
  'وصف المزرعة',
  'https://image-url.jpg',
  12.50,
  5000,
  1000000,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '12 months',
  'active',
  'الموقع'
);
```

### إضافة تقرير شهري

```sql
INSERT INTO monthly_reports (
  farm_id,
  report_month,
  title_ar,
  content_ar,
  harvest_amount,
  revenue,
  distributed_returns
) VALUES (
  'farm-uuid',
  '2026-01-01',
  'تقرير يناير 2026',
  'محتوى التقرير...',
  1500.00,
  150000.00,
  18000.00
);
```

---

## 📊 الأداء والتحسين

### Indexes المضافة
- ✅ `investments.user_id`
- ✅ `investments.farm_id`
- ✅ `transactions.user_id`
- ✅ `farms.status`
- ✅ `notifications.user_id`

### Query Optimization
- استخدام `select()` مع fields محددة
- JOIN محدود حسب الحاجة
- Pagination للقوائم الطويلة

---

## 🤝 المساهمة

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/portfolio-page

# Make changes and commit
git add .
git commit -m "Add portfolio page with investment cards"

# Push and create PR
git push origin feature/portfolio-page
```

### Code Style
- TypeScript strict mode
- ESLint configuration included
- Prettier for formatting
- Arabic comments for business logic

---

## 📞 الدعم الفني

للأسئلة والمساعدة:
- 📄 راجع `TECHNICAL_SPEC.md`
- 🔍 تحقق من `src/types/database.types.ts`
- 🛠️ استخدم `src/services/*` للأمثلة

---

## 📝 الترخيص

هذا المشروع خاص ومحمي بحقوق الملكية.

---

## ✨ الميزات القادمة

- [ ] صفحة تسجيل الدخول والتسجيل
- [ ] صفحة المحفظة الاستثمارية
- [ ] صفحة الحاسبة الاستثمارية
- [ ] صفحة التقارير الشهرية
- [ ] صفحة الملف الشخصي
- [ ] نظام الإشعارات الفورية
- [ ] نظام الدفع الإلكتروني
- [ ] لوحة تحكم الإدارة

---

**تم بناء المنصة بـ:**
- ⚛️ React 18 + TypeScript
- ⚡ Vite
- 🎨 Tailwind CSS
- 🔥 Supabase (Database + Auth)
- 🎯 Lucide React Icons
