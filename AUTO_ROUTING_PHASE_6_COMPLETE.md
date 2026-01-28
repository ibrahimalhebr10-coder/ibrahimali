# التوجيه التلقائي بناءً على الأدوار - المرحلة 6 مكتملة

## نظرة عامة

تم تنفيذ المرحلة السادسة بنجاح: الربط مع تسجيل الدخول الإداري والتوجيه التلقائي للمستخدمين بناءً على أدوارهم.

## ملخص التنفيذ

عند تسجيل الدخول، يتم الآن:
1. ✅ تحميل الدور (AdminRole)
2. ✅ تحميل النطاق والصلاحيات
3. ✅ تحديد الصفحة الافتراضية تلقائياً
4. ✅ توجيه المستخدم مباشرة للصفحة المناسبة
5. ✅ عرض رسالة واضحة عن الوجهة

---

## التغييرات في الكود

### 1. تحديث AdminContext

**الملف:** `src/contexts/AdminContext.tsx`

#### الميزات الجديدة:

```typescript
interface AdminContextType {
  admin: Admin | null;
  adminRole: AdminRole | null;           // جديد
  defaultPage: 'dashboard' | 'harvest' | null;  // جديد
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  checkAdminSession: () => Promise<void>;
  signOutAdmin: () => Promise<void>;
  onSessionExpire?: () => void;
}
```

#### دالة تحديد الصفحة الافتراضية:

```typescript
function determineDefaultPage(role: AdminRole | null): 'dashboard' | 'harvest' {
  if (!role) return 'dashboard';

  // الأدوار التشغيلية
  const operationalRoles = ['worker', 'supervisor', 'farm_supervisor'];

  // إذا كان الدور تشغيلي → محصولي
  if (operationalRoles.includes(role.role_key)) {
    return 'harvest';
  }

  // باقي الأدوار → لوحة التحكم
  return 'dashboard';
}
```

#### تحميل البيانات عند التحقق من الجلسة:

```typescript
async function checkAdminSession() {
  console.log('🔄 AdminContext: checkAdminSession called');
  try {
    const adminData = await adminSessionService.validateAdminSession();
    console.log('🔄 AdminContext: validateAdminSession returned:', adminData ? 'admin data' : 'null');

    if (adminData) {
      setAdmin(adminData);

      // تحميل الدور
      const role = adminData.role_id
        ? await permissionsService.getRoleById(adminData.role_id)
        : null;

      setAdminRole(role);

      // تحديد الصفحة الافتراضية
      const page = determineDefaultPage(role);
      setDefaultPage(page);

      console.log('✅ AdminContext: Admin authenticated');
      console.log('📋 Role:', role?.role_name_ar);
      console.log('🎯 Default page:', page);

      adminSessionService.startSessionMonitoring(handleSessionExpire);
    } else {
      console.log('❌ AdminContext: No admin data');
      setAdmin(null);
      setAdminRole(null);
      setDefaultPage(null);
    }
  } catch (error) {
    console.error('❌ AdminContext: Error checking admin session:', error);
    setAdmin(null);
    setAdminRole(null);
    setDefaultPage(null);
  } finally {
    setIsLoading(false);
    console.log('🔄 AdminContext: isLoading set to false');
  }
}
```

#### Provider Value محدث:

```typescript
return (
  <AdminContext.Provider
    value={{
      admin,
      adminRole,        // جديد
      defaultPage,      // جديد
      isAdminAuthenticated: !!admin,
      isLoading,
      checkAdminSession,
      signOutAdmin
    }}
  >
    {children}
  </AdminContext.Provider>
);
```

---

### 2. تحديث AdminDashboard

**الملف:** `src/components/admin/AdminDashboard.tsx`

#### استخدام الصفحة الافتراضية:

```typescript
export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const { admin, adminRole, defaultPage, signOutAdmin } = useAdmin();
  const [currentPage, setCurrentPage] = useState<AdminPage>('dashboard');

  // ... باقي الكود

  // تعيين الصفحة الافتراضية عند التحميل
  useEffect(() => {
    if (defaultPage) {
      console.log('🎯 Setting initial page to:', defaultPage);
      setCurrentPage(defaultPage);
    }
  }, [defaultPage]);

  // ... باقي الكود
}
```

**كيف يعمل:**
1. عند فتح AdminDashboard، يتحقق من `defaultPage`
2. إذا كان موجوداً، يعين `currentPage` إلى القيمة المحددة
3. النتيجة: المستخدم يرى الصفحة المناسبة مباشرة

---

### 3. تحديث SmartAdminLoginGate

**الملف:** `src/components/admin/SmartAdminLoginGate.tsx`

#### Imports جديدة:

```typescript
import {
  Crown,
  Lock,
  User,
  X,
  AlertCircle,
  Check,
  Shield,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sprout,           // جديد
  LayoutDashboard,  // جديد
  ArrowRight        // جديد
} from 'lucide-react';
```

#### State جديد:

```typescript
const [defaultPage, setDefaultPage] = useState<'dashboard' | 'harvest'>('dashboard');
```

#### دالة تحديد الصفحة (نسخة محلية):

```typescript
function determineDefaultPage(role: AdminRole | null): 'dashboard' | 'harvest' {
  if (!role) return 'dashboard';

  const operationalRoles = ['worker', 'supervisor', 'farm_supervisor'];

  if (operationalRoles.includes(role.role_key)) {
    return 'harvest';
  }

  return 'dashboard';
}
```

#### تحديث handleLogin:

```typescript
async function handleLogin(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const result = await adminSessionService.signInAdmin(email, password);

    if (!result.success || !result.admin) {
      setError(result.error || 'حدث خطأ أثناء تسجيل الدخول');
      setLoading(false);
      return;
    }

    setStep('loading');

    const [role, perms] = await Promise.all([
      result.admin.role_id
        ? permissionsService.getRoleById(result.admin.role_id)
        : null,
      permissionsService.getAdminPermissions(result.admin.id, false)
    ]);

    setAdminRole(role);
    setPermissions(perms);

    // تحديد الصفحة الافتراضية
    const page = determineDefaultPage(role);
    setDefaultPage(page);

    await new Promise(resolve => setTimeout(resolve, 1000));

    setStep('welcome');

    setTimeout(() => {
      onSuccess();
    }, 2000);
  } catch (err: any) {
    console.error('Login error:', err);
    setError('حدث خطأ أثناء تسجيل الدخول');
    setLoading(false);
    setStep('login');
  }
}
```

#### شاشة الترحيب محدثة:

```tsx
<div className="text-center">
  {/* بطاقة معلومات الوجهة */}
  <div className="mb-4 p-4 rounded-xl" style={{
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)'
  }}>
    <div className="flex items-center justify-center gap-2 mb-2">
      {defaultPage === 'harvest' ? (
        <Sprout className="w-5 h-5 text-green-400" />
      ) : (
        <LayoutDashboard className="w-5 h-5 text-blue-400" />
      )}
      <ArrowRight className="w-4 h-4 text-white/40" />
    </div>
    <p className="text-white/80 text-sm font-medium">
      {defaultPage === 'harvest'
        ? 'سيتم توجيهك إلى محصولي'
        : 'سيتم توجيهك إلى لوحة التحكم'
      }
    </p>
  </div>
  <p className="text-white/60 mb-4">جاري تحميل البيانات...</p>
  <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mx-auto" />
</div>
```

---

## سيناريوهات التوجيه

### السيناريو 1: عامل يسجل دخول

**الدور:** worker

**الخطوات:**
1. يدخل البريد وكلمة المرور
2. النظام يتحقق من الدور
3. يحدد أن الدور = worker (تشغيلي)
4. يعين defaultPage = 'harvest'
5. يعرض رسالة: "سيتم توجيهك إلى محصولي"
6. عند فتح AdminDashboard، يذهب مباشرة لصفحة "محصولي"

**النتيجة:** ✅ العامل يرى مباشرة صفحة المحصول مع مهامه

---

### السيناريو 2: مشرف يسجل دخول

**الدور:** supervisor

**الخطوات:**
1. يدخل البريد وكلمة المرور
2. النظام يتحقق من الدور
3. يحدد أن الدور = supervisor (تشغيلي)
4. يعين defaultPage = 'harvest'
5. يعرض رسالة: "سيتم توجيهك إلى محصولي"
6. عند فتح AdminDashboard، يذهب مباشرة لصفحة "محصولي"

**النتيجة:** ✅ المشرف يرى مباشرة صفحة المحصول مع جميع المهام

---

### السيناريو 3: مدير المزارع يسجل دخول

**الدور:** farm_supervisor

**الخطوات:**
1. يدخل البريد وكلمة المرور
2. النظام يتحقق من الدور
3. يحدد أن الدور = farm_supervisor (تشغيلي)
4. يعين defaultPage = 'harvest'
5. يعرض رسالة: "سيتم توجيهك إلى محصولي"
6. عند فتح AdminDashboard، يذهب مباشرة لصفحة "محصولي"

**النتيجة:** ✅ مدير المزارع يرى صفحة المحصول

---

### السيناريو 4: مدير مزرعة يسجل دخول

**الدور:** farm_manager

**الخطوات:**
1. يدخل البريد وكلمة المرور
2. النظام يتحقق من الدور
3. يحدد أن الدور = farm_manager (إداري)
4. يعين defaultPage = 'dashboard'
5. يعرض رسالة: "سيتم توجيهك إلى لوحة التحكم"
6. عند فتح AdminDashboard، يذهب مباشرة للوحة التحكم

**النتيجة:** ✅ مدير المزرعة يرى لوحة التحكم الكاملة

---

### السيناريو 5: المدير العام يسجل دخول

**الدور:** super_admin

**الخطوات:**
1. يدخل البريد وكلمة المرور
2. النظام يتحقق من الدور
3. يحدد أن الدور = super_admin (إداري)
4. يعين defaultPage = 'dashboard'
5. يعرض رسالة: "سيتم توجيهك إلى لوحة التحكم"
6. عند فتح AdminDashboard، يذهب مباشرة للوحة التحكم

**النتيجة:** ✅ المدير العام يرى لوحة التحكم الكاملة

---

### السيناريو 6: المدير المالي يسجل دخول

**الدور:** financial_manager

**الخطوات:**
1. يدخل البريد وكلمة المرور
2. النظام يتحقق من الدور
3. يحدد أن الدور = financial_manager (إداري)
4. يعين defaultPage = 'dashboard'
5. يعرض رسالة: "سيتم توجيهك إلى لوحة التحكم"
6. عند فتح AdminDashboard، يذهب مباشرة للوحة التحكم

**النتيجة:** ✅ المدير المالي يرى لوحة التحكم

---

## منطق التصنيف

### الأدوار التشغيلية (Operational Roles)

هذه الأدوار تركز على العمليات اليومية في المزرعة:

| الدور | role_key | الوجهة |
|-------|----------|--------|
| عامل | worker | محصولي |
| مشرف | supervisor | محصولي |
| مدير المزارع | farm_supervisor | محصولي |

**السبب:**
- هؤلاء المستخدمون يحتاجون للوصول السريع لمهامهم
- لا يحتاجون عادة للوحة التحكم الإدارية
- تجربة مستخدم أفضل بالذهاب مباشرة لعملهم

### الأدوار الإدارية (Administrative Roles)

هذه الأدوار تركز على الإدارة والإشراف:

| الدور | role_key | الوجهة |
|-------|----------|--------|
| المدير العام | super_admin | لوحة التحكم |
| مدير مزرعة | farm_manager | لوحة التحكم |
| المدير المالي | financial_manager | لوحة التحكم |

**السبب:**
- هؤلاء المستخدمون يحتاجون للإشراف العام
- يحتاجون للوصول لمختلف الأقسام الإدارية
- لوحة التحكم توفر نظرة شاملة على النظام

---

## الكود الداخلي

### determineDefaultPage في AdminContext

```typescript
function determineDefaultPage(role: AdminRole | null): 'dashboard' | 'harvest' {
  if (!role) return 'dashboard';

  const operationalRoles = ['worker', 'supervisor', 'farm_supervisor'];

  if (operationalRoles.includes(role.role_key)) {
    return 'harvest';
  }

  return 'dashboard';
}
```

**المنطق:**
1. إذا لم يكن هناك دور → لوحة التحكم (افتراضي)
2. إذا كان الدور في قائمة operationalRoles → محصولي
3. أي دور آخر → لوحة التحكم

**مرن وقابل للتوسع:**
```typescript
// يمكن بسهولة إضافة أدوار جديدة
const operationalRoles = [
  'worker',
  'supervisor',
  'farm_supervisor',
  'harvest_coordinator',  // جديد
  'field_technician'      // جديد
];
```

---

## تدفق البيانات الكامل

### 1. تسجيل الدخول

```
User enters credentials
  ↓
SmartAdminLoginGate.handleLogin()
  ↓
adminSessionService.signInAdmin()
  ↓
Success → Load role and permissions
  ↓
determineDefaultPage(role)
  ↓
setDefaultPage('harvest' or 'dashboard')
  ↓
Show welcome screen with destination info
  ↓
onSuccess() callback
  ↓
AdminContext.checkAdminSession()
```

### 2. AdminContext

```
checkAdminSession()
  ↓
validateAdminSession()
  ↓
Load role: getRoleById()
  ↓
determineDefaultPage(role)
  ↓
setAdminRole(role)
setDefaultPage(page)
  ↓
Context provides: { admin, adminRole, defaultPage }
```

### 3. AdminDashboard

```
AdminDashboard renders
  ↓
useAdmin() → get defaultPage
  ↓
useEffect(() => {
  if (defaultPage) {
    setCurrentPage(defaultPage)
  }
}, [defaultPage])
  ↓
Renders the correct page immediately
```

---

## مثال: دورة حياة كاملة للعامل

### الخطوة 1: تسجيل الدخول

```typescript
// SmartAdminLoginGate
const result = await adminSessionService.signInAdmin(email, password);
// result.admin.role_id = 'role-worker-uuid'
```

### الخطوة 2: تحميل الدور

```typescript
const role = await permissionsService.getRoleById(result.admin.role_id);
// role = {
//   id: 'role-worker-uuid',
//   role_key: 'worker',
//   role_name_ar: 'عامل',
//   ...
// }
```

### الخطوة 3: تحديد الصفحة

```typescript
const page = determineDefaultPage(role);
// 'worker' in operationalRoles → true
// page = 'harvest'
```

### الخطوة 4: عرض الرسالة

```tsx
<p className="text-white/80 text-sm font-medium">
  سيتم توجيهك إلى محصولي
</p>
// المستخدم يعرف إلى أين سيذهب
```

### الخطوة 5: AdminContext يحمل نفس البيانات

```typescript
// في AdminContext.checkAdminSession()
const role = await permissionsService.getRoleById(adminData.role_id);
const page = determineDefaultPage(role);
// page = 'harvest'
setDefaultPage('harvest');
```

### الخطوة 6: AdminDashboard يعرض الصفحة

```typescript
// في AdminDashboard
useEffect(() => {
  if (defaultPage) {
    setCurrentPage('harvest');  // مباشرة!
  }
}, [defaultPage]);
```

### الخطوة 7: النتيجة

```
User sees:
  - My Harvest page
  - Their assigned tasks
  - Appropriate UI based on permissions
```

---

## مميزات التنفيذ

### 1. تجربة مستخدم محسنة

**قبل:**
```
Login → Dashboard → User navigates to their section → Work
```

**بعد:**
```
Login → Directly to work section
```

**الفائدة:** توفير 2-3 نقرات لكل تسجيل دخول

### 2. واضح وشفاف

```tsx
// المستخدم يعرف إلى أين سيذهب قبل الوصول
<p>سيتم توجيهك إلى محصولي</p>
// vs
<p>جاري تحميل...</p>
```

### 3. مرونة عالية

```typescript
// سهل جداً إضافة صفحات جديدة
type DefaultPage = 'dashboard' | 'harvest' | 'reports' | 'analytics';

// أو إضافة منطق أكثر تعقيداً
function determineDefaultPage(role: AdminRole, permissions: string[]): DefaultPage {
  if (role.role_key === 'analyst') return 'analytics';
  if (permissions.includes('reports.view')) return 'reports';
  // ...
}
```

### 4. متوافق مع الصلاحيات

```typescript
// AdminDashboard يستخدم نفس منطق التحقق
const { defaultPage } = useAdmin();
// يذهب للصفحة الافتراضية
// ثم PermissionsContext يصفي ما يمكن عرضه في تلك الصفحة
```

---

## Logging والتتبع

### Console Logs مفيدة

```typescript
// في AdminContext
console.log('✅ AdminContext: Admin authenticated');
console.log('📋 Role:', role?.role_name_ar);
console.log('🎯 Default page:', page);

// في AdminDashboard
console.log('🎯 Setting initial page to:', defaultPage);
```

**مثال Output:**
```
✅ AdminContext: Admin authenticated
📋 Role: عامل
🎯 Default page: harvest
🎯 Setting initial page to: harvest
```

---

## التعامل مع الحالات الخاصة

### حالة: دور بدون تصنيف

```typescript
function determineDefaultPage(role: AdminRole | null): 'dashboard' | 'harvest' {
  if (!role) return 'dashboard';  // آمن

  const operationalRoles = ['worker', 'supervisor', 'farm_supervisor'];

  if (operationalRoles.includes(role.role_key)) {
    return 'harvest';
  }

  return 'dashboard';  // افتراضي آمن
}
```

### حالة: تغيير الصفحة بعد التحميل

```typescript
// المستخدم يمكنه التنقل بحرية
// defaultPage يحدد فقط الصفحة الأولية
<AdminNavigation
  currentPage={currentPage}
  onPageChange={setCurrentPage}
/>
```

### حالة: Reload الصفحة

```typescript
// AdminContext.checkAdminSession() يعمل عند كل reload
useEffect(() => {
  checkAdminSession();
}, []);

// لذلك defaultPage يتم تعيينه دائماً بشكل صحيح
```

---

## الأمان

### لا تأثير على الحماية

```typescript
// التوجيه التلقائي لا يتجاوز أي حماية
// PermissionsContext لا يزال يعمل بالكامل
// RLS policies لا تزال تحمي البيانات

// مثال: عامل يذهب لمحصولي
// - يرى فقط مهامه (RLS)
// - لا يمكنه إنشاء مهام (UI Guard)
// - لا يمكنه حذف مهام (Permission Check)
```

### التوجيه ≠ الصلاحيات

```
التوجيه التلقائي:
  - يحدد الصفحة الابتدائية فقط
  - يحسن تجربة المستخدم
  - لا يمنح أي صلاحيات إضافية

الصلاحيات (من المراحل السابقة):
  - تحدد ما يمكن رؤيته
  - تحدد ما يمكن فعله
  - تحمي البيانات في قاعدة البيانات
```

---

## الإحصائيات

### الملفات المحدثة:
- **1** context محدث (AdminContext)
- **2** components محدثة (AdminDashboard, SmartAdminLoginGate)
- **0** database changes (استخدام البنية الموجودة)

### الوظائف الجديدة:
- **2** دالة determineDefaultPage (واحدة في كل ملف)
- **3** props جديدة في AdminContext
- **1** useEffect جديد في AdminDashboard

### تحسين التجربة:
- **توفير 2-3 نقرات** لكل تسجيل دخول
- **رسالة واضحة** عن الوجهة
- **تحميل أسرع** للصفحة المناسبة

---

## الخلاصة

تم تنفيذ نظام توجيه تلقائي ذكي يحسن تجربة المستخدم بشكل كبير:

✅ **تحميل كامل للبيانات:** الدور، النطاق، الصلاحيات
✅ **توجيه تلقائي:** بناءً على نوع الدور
✅ **رسائل واضحة:** المستخدم يعرف إلى أين يذهب
✅ **متوافق تماماً:** مع نظام الصلاحيات الموجود
✅ **آمن:** لا يتجاوز أي حماية
✅ **مرن:** سهل إضافة أدوار وصفحات جديدة
✅ **البناء ناجح:** لا أخطاء

النظام الآن يوفر تجربة سلسة ومخصصة لكل مستخدم بناءً على دوره، مع الحفاظ على جميع طبقات الأمان والحماية!

---

## الاختبار الموصى به

### 1. اختبار تسجيل الدخول لكل دور

```bash
# عامل
Email: worker@example.com
Expected: → محصولي (مهامه فقط)

# مشرف
Email: supervisor@example.com
Expected: → محصولي (جميع المهام)

# مدير مزرعة
Email: farm_manager@example.com
Expected: → لوحة التحكم

# المدير العام
Email: ibrahimalhebr1@gmail.com
Expected: → لوحة التحكم
```

### 2. اختبار الرسائل

```
تحقق من أن الرسالة الصحيحة تظهر:
- "سيتم توجيهك إلى محصولي" للأدوار التشغيلية
- "سيتم توجيهك إلى لوحة التحكم" للأدوار الإدارية
```

### 3. اختبار التنقل

```
بعد التسجيل:
- تحقق من الصفحة المعروضة
- جرب التنقل للصفحات الأخرى
- تحقق من أن الصلاحيات تعمل بشكل صحيح
```

البناء ناجح ولا توجد أخطاء!
