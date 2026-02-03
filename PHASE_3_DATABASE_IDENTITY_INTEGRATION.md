# المرحلة 3 - ربط الواجهة بقاعدة البيانات ✅

## تاريخ الإنجاز
2026-02-03

---

## الهدف
ربط الواجهة بقاعدة البيانات لقراءة وحفظ الهوية بدلاً من الاعتماد على localStorage فقط

---

## ما تم إنجازه

### 1. تحديث AuthContext - إضافة إدارة الهوية

تم توسيع `AuthContext` بإضافة الميزات التالية:

#### الـ Types الجديدة:
```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  identity: IdentityType;              // ✅ جديد
  identityLoading: boolean;            // ✅ جديد
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateIdentity: (newIdentity: IdentityType) => Promise<boolean>; // ✅ جديد
}
```

---

### 2. آلية تحميل الهوية

#### عند تسجيل الدخول:
```typescript
// تحميل الهوية من قاعدة البيانات
const userIdentity = await identityService.getUserIdentity(userId);

if (userIdentity) {
  // إذا وُجدت في قاعدة البيانات
  setIdentity(userIdentity.primaryIdentity);
} else {
  // إذا لم توجد، استخدم localStorage كـ fallback
  const savedMode = localStorage.getItem('appMode');
  const fallbackIdentity = (savedMode === 'agricultural' || savedMode === 'investment')
    ? savedMode
    : 'agricultural';

  setIdentity(fallbackIdentity);

  // حفظها في قاعدة البيانات للمرة الأولى
  await identityService.setPrimaryIdentity(userId, fallbackIdentity);
}
```

#### للزوار (غير مسجلين):
```typescript
// استخدام localStorage فقط
const savedMode = localStorage.getItem('appMode');
const fallbackIdentity = (savedMode === 'agricultural' || savedMode === 'investment')
  ? savedMode
  : 'agricultural';

setIdentity(fallbackIdentity);
```

---

### 3. دالة updateIdentity - حفظ التغييرات

```typescript
const updateIdentity = async (newIdentity: IdentityType): Promise<boolean> => {
  if (user) {
    // مستخدم مسجل: حفظ في قاعدة البيانات + localStorage
    const success = await identityService.setPrimaryIdentity(user.id, newIdentity);
    if (success) {
      setIdentity(newIdentity);
      localStorage.setItem('appMode', newIdentity);
      return true;
    }
    return false;
  } else {
    // زائر: حفظ في localStorage فقط
    setIdentity(newIdentity);
    localStorage.setItem('appMode', newIdentity);
    return true;
  }
};
```

---

### 4. تحديث App.tsx

#### قبل:
```typescript
const [appMode, setAppMode] = useState<AppMode>(() => {
  const savedMode = localStorage.getItem('appMode');
  return (savedMode === 'agricultural' || savedMode === 'investment') ? savedMode : 'agricultural';
});

const handleAppModeChange = (mode: AppMode) => {
  setAppMode(mode);
  localStorage.setItem('appMode', mode);
};
```

#### بعد:
```typescript
const { user, identity, updateIdentity } = useAuth();
const appMode = identity as AppMode;

const handleAppModeChange = async (mode: AppMode) => {
  await updateIdentity(mode);
};
```

---

## مسار البيانات الكامل

### سيناريو 1: مستخدم جديد (غير مسجل)

1. **الدخول إلى التطبيق**:
   - يقرأ من `localStorage`
   - القيمة الافتراضية: `'agricultural'`

2. **تغيير الهوية**:
   - يحفظ في `localStorage` فقط
   - لا يوجد حفظ في قاعدة البيانات

3. **التسجيل**:
   - يقرأ من `localStorage`
   - يحفظ في قاعدة البيانات للمرة الأولى

---

### سيناريو 2: مستخدم مسجل (موجود في قاعدة البيانات)

1. **تسجيل الدخول**:
   - يقرأ من قاعدة البيانات
   - يحدث `identity` state
   - يحدث `localStorage` للمزامنة

2. **تغيير الهوية**:
   ```typescript
   // 1. تحديث قاعدة البيانات
   await identityService.setPrimaryIdentity(userId, 'investment');

   // 2. تحديث State
   setIdentity('investment');

   // 3. تحديث localStorage
   localStorage.setItem('appMode', 'investment');
   ```

3. **إعادة تسجيل الدخول**:
   - يقرأ من قاعدة البيانات (البيانات محفوظة)

---

### سيناريو 3: مستخدم موجود بدون هوية في قاعدة البيانات

1. **تسجيل الدخول**:
   - لا توجد هوية في قاعدة البيانات
   - يقرأ من `localStorage` كـ fallback
   - يحفظ في قاعدة البيانات تلقائياً

---

## الفرق بين المراحل

### المرحلة 1:
- ✅ قراءة من `localStorage` فقط
- ❌ لا يوجد حفظ في قاعدة البيانات

### المرحلة 2:
- ✅ بنية قاعدة البيانات جاهزة
- ✅ Identity Service جاهز
- ❌ الواجهة لا تستخدم قاعدة البيانات

### المرحلة 3:
- ✅ قراءة من قاعدة البيانات عند تسجيل الدخول
- ✅ حفظ في قاعدة البيانات عند التغيير
- ✅ مزامنة مع `localStorage`
- ✅ Fallback إلى `localStorage` للزوار

---

## المزايا الجديدة

### 1. البقاء عبر الأجهزة
```typescript
// المستخدم يسجل دخوله على جهاز مختلف
// ✅ الهوية تُحمل من قاعدة البيانات
// ✅ التجربة متسقة عبر كل الأجهزة
```

### 2. البقاء بعد تنظيف المتصفح
```typescript
// المستخدم ينظف cache المتصفح
// ✅ الهوية لا تُفقد
// ✅ تُحمل من قاعدة البيانات عند تسجيل الدخول
```

### 3. Migration تلقائي من localStorage
```typescript
// مستخدم قديم لديه هوية في localStorage فقط
// ✅ عند تسجيل الدخول، تُنقل إلى قاعدة البيانات تلقائياً
```

### 4. تجربة سلسة للزوار
```typescript
// زائر غير مسجل
// ✅ يستخدم localStorage (كما كان)
// ✅ عند التسجيل، تُحفظ في قاعدة البيانات
```

---

## Flow Chart - تدفق البيانات

```
┌─────────────────────────────────────────────────────────────┐
│                    فتح التطبيق                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │ هل المستخدم  │
              │ مسجل دخول؟   │
              └──┬────────┬──┘
                 │        │
         نعم ◄───┘        └───► لا
          │                      │
          ▼                      ▼
  ┌──────────────────┐   ┌──────────────────┐
  │ تحميل من قاعدة   │   │ تحميل من         │
  │ البيانات         │   │ localStorage     │
  └────────┬─────────┘   └─────────┬────────┘
           │                       │
           ▼                       │
    ┌─────────────┐               │
    │ هل وُجدت    │               │
    │ هوية؟       │               │
    └──┬──────┬───┘               │
       │      │                   │
  نعم ◄┘      └► لا               │
   │              │               │
   │              ▼               │
   │    ┌──────────────────┐     │
   │    │ استخدم localStorage│    │
   │    │ + احفظ في قاعدة   │     │
   │    │ البيانات          │     │
   │    └─────────┬────────┘     │
   │              │               │
   └──────────────┴───────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ عرض الهوية في  │
         │ الواجهة         │
         └────────────────┘
```

---

## الملفات المعدلة

### 1. `src/contexts/AuthContext.tsx`
- ✅ إضافة `identity` و `identityLoading` إلى state
- ✅ إضافة `updateIdentity` function
- ✅ تحميل الهوية عند تسجيل الدخول
- ✅ حفظ الهوية عند التغيير

### 2. `src/App.tsx`
- ✅ استخدام `identity` من AuthContext بدلاً من state محلي
- ✅ استخدام `updateIdentity` بدلاً من setAppMode
- ✅ إزالة إدارة الهوية المحلية

---

## اختبار الوظائف

### Test 1: مستخدم جديد
```typescript
// 1. افتح التطبيق بدون تسجيل دخول
// Expected: identity = 'agricultural' (من localStorage)

// 2. غير إلى 'investment'
// Expected: يحفظ في localStorage فقط

// 3. سجل حساب جديد
// Expected: يحفظ 'investment' في قاعدة البيانات

// 4. سجل خروج وأعد تسجيل الدخول
// Expected: يحمل 'investment' من قاعدة البيانات
```

### Test 2: مستخدم موجود
```typescript
// 1. سجل دخول بحساب موجود
// Expected: يحمل الهوية من قاعدة البيانات

// 2. غير الهوية
// Expected: يحفظ في قاعدة البيانات + localStorage

// 3. سجل دخول على جهاز آخر
// Expected: نفس الهوية المحفوظة
```

### Test 3: Migration من localStorage
```typescript
// 1. مستخدم قديم لديه 'investment' في localStorage فقط
// 2. يسجل دخول
// Expected: يحمل 'investment' من localStorage
//          ويحفظها في قاعدة البيانات تلقائياً
```

---

## التحقق من البيانات

### استعلام SQL للتحقق:
```sql
-- عرض هويات المستخدمين
SELECT
  id,
  full_name,
  primary_identity,
  secondary_identity,
  secondary_identity_enabled,
  created_at
FROM user_profiles
ORDER BY created_at DESC
LIMIT 10;
```

### التحقق من تحديث الهوية:
```sql
-- تحديث يدوي للاختبار
UPDATE user_profiles
SET primary_identity = 'investment'
WHERE id = 'user-uuid-here';
```

---

## الحالة الحالية

### للمستخدم المسجل:
```typescript
{
  user: User,
  identity: 'agricultural' | 'investment',  // من قاعدة البيانات
  identityLoading: false
}
```

### للزائر:
```typescript
{
  user: null,
  identity: 'agricultural' | 'investment',  // من localStorage
  identityLoading: false
}
```

---

## المرحلة التالية

**المرحلة 4️⃣ — إضافة UI للتبديل بين الهويات**

الهدف:
- عرض الهوية الثانية (إذا كانت موجودة)
- إضافة زر للتبديل بين الهوية الأساسية والثانية
- تفعيل الهوية الثانية في الواجهة

---

## ملاحظات التطوير

- ✅ AuthContext محدّث بنجاح
- ✅ App.tsx يستخدم الهوية من Context
- ✅ البناء ناجح بدون أخطاء
- ✅ Fallback إلى localStorage للزوار
- ✅ Migration تلقائي من localStorage
- ✅ مزامنة بين قاعدة البيانات و localStorage

---

**الحالة**: ✅ مكتمل ونجح البناء
