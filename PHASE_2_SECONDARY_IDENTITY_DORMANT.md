# المرحلة 2 - تثبيت الهوية الثانية (نائمة) ✅

## تاريخ الإنجاز
2026-02-03

---

## الهدف
تجهيز البنية المنطقية لحفظ هوية ثانية للمستخدم بدون عرضها في الواجهة

---

## ما تم إنجازه

### 1. Migration - إضافة حقول الهوية الثانية

تم إضافة الحقول التالية إلى جدول `user_profiles`:

#### الحقول الجديدة:
- **`primary_identity`** (text, NOT NULL)
  - الهوية الأساسية للمستخدم
  - القيم: `'agricultural'` أو `'investment'`
  - القيمة الافتراضية: `'agricultural'`

- **`secondary_identity`** (text, NULL)
  - الهوية الثانية (نائمة)
  - القيم: `'agricultural'` أو `'investment'` أو `NULL`
  - القيمة الافتراضية: `NULL`

- **`secondary_identity_enabled`** (boolean, NOT NULL)
  - هل الهوية الثانية مفعلة؟
  - القيمة الافتراضية: `false`
  - دائماً `false` في المرحلة الحالية

#### القيود (Constraints):
- ✅ `primary_identity` يجب أن يكون `'agricultural'` أو `'investment'`
- ✅ `secondary_identity` يجب أن يكون `'agricultural'` أو `'investment'` أو `NULL`
- ✅ `secondary_identity` يجب أن يكون مختلفاً عن `primary_identity`

#### الفهارس (Indexes):
- `idx_user_profiles_primary_identity` - لتسريع البحث بالهوية الأساسية
- `idx_user_profiles_secondary_identity` - لتسريع البحث بالهوية الثانية

---

### 2. دوال مساعدة في قاعدة البيانات

#### `get_user_current_identity(p_user_id uuid)`
- **الوظيفة**: الحصول على الهوية الأساسية الحالية للمستخدم
- **المعاملات**: `p_user_id` - معرف المستخدم
- **الإرجاع**: `text` - الهوية الحالية (افتراضياً `'agricultural'`)

```sql
SELECT get_user_current_identity('uuid-here');
-- Returns: 'agricultural' or 'investment'
```

#### `has_secondary_identity(p_user_id uuid)`
- **الوظيفة**: التحقق من وجود هوية ثانية مفعلة
- **المعاملات**: `p_user_id` - معرف المستخدم
- **الإرجاع**: `boolean` - `true` إذا كانت الهوية الثانية موجودة ومفعلة

```sql
SELECT has_secondary_identity('uuid-here');
-- Returns: true or false
```

---

### 3. Identity Service - خدمة إدارة الهويات

تم إنشاء `identityService` في `src/services/identityService.ts`

#### Types:
```typescript
type IdentityType = 'agricultural' | 'investment';

interface UserIdentity {
  userId: string;
  primaryIdentity: IdentityType;
  secondaryIdentity: IdentityType | null;
  secondaryIdentityEnabled: boolean;
}
```

#### الدوال المتاحة:

##### `getUserIdentity(userId: string)`
الحصول على كامل بيانات هوية المستخدم
```typescript
const identity = await identityService.getUserIdentity(userId);
// Returns: UserIdentity | null
```

##### `setPrimaryIdentity(userId: string, identity: IdentityType)`
تحديد الهوية الأساسية للمستخدم
```typescript
await identityService.setPrimaryIdentity(userId, 'investment');
// Returns: boolean (success)
```

##### `setSecondaryIdentity(userId: string, secondaryIdentity: IdentityType | null)`
تحديد الهوية الثانية (مع التحقق من عدم تطابقها مع الأساسية)
```typescript
await identityService.setSecondaryIdentity(userId, 'agricultural');
// Returns: boolean (success)
```

##### `enableSecondaryIdentity(userId: string, enabled: boolean)`
تفعيل أو تعطيل الهوية الثانية
```typescript
await identityService.enableSecondaryIdentity(userId, true);
// Returns: boolean (success)
```

##### `hasSecondaryIdentity(userId: string)`
التحقق من وجود هوية ثانية مفعلة
```typescript
const hasSecondary = await identityService.hasSecondaryIdentity(userId);
// Returns: boolean
```

##### `getCurrentIdentity(userId: string)`
الحصول على الهوية الأساسية فقط
```typescript
const identity = await identityService.getCurrentIdentity(userId);
// Returns: IdentityType
```

##### دوال مساعدة للواجهة:
```typescript
identityService.getIdentityLabel('agricultural');    // Returns: 'مزارع'
identityService.getIdentityColor('investment');      // Returns: '#d4af37'
identityService.getIdentityDescription('agricultural'); // Returns: 'أنت في رحلة زراعية'
```

---

## الحالة الحالية للهويات

### المستخدم الجديد:
```typescript
{
  userId: "uuid",
  primaryIdentity: "agricultural",     // افتراضي
  secondaryIdentity: null,              // غير موجودة
  secondaryIdentityEnabled: false       // معطلة
}
```

### مستخدم بهوية استثمارية:
```typescript
{
  userId: "uuid",
  primaryIdentity: "investment",        // تم تحديدها
  secondaryIdentity: null,              // غير موجودة
  secondaryIdentityEnabled: false       // معطلة
}
```

### مستخدم بهوية ثانية (جاهز للمستقبل):
```typescript
{
  userId: "uuid",
  primaryIdentity: "agricultural",      // الهوية الأساسية
  secondaryIdentity: "investment",      // الهوية الثانية (نائمة)
  secondaryIdentityEnabled: false       // غير مفعلة
}
```

---

## الفرق بين المرحلة 1 والمرحلة 2

### المرحلة 1:
- قراءة الهوية من `localStorage` فقط
- عرض الهوية في الواجهة
- لا يوجد حفظ في قاعدة البيانات

### المرحلة 2:
- ✅ حفظ الهوية في قاعدة البيانات
- ✅ إمكانية هوية ثانية (منطقياً)
- ✅ خدمة كاملة لإدارة الهويات
- ✅ دوال مساعدة في قاعدة البيانات
- ⏸️ الهوية الثانية نائمة وغير مفعلة
- ⏸️ لا توجد واجهة مستخدم للتبديل

---

## ملاحظات هامة

### 🔒 الهوية الثانية نائمة
- لا تظهر في أي مكان في الواجهة
- لا يوجد زر للتبديل بين الهويات
- البيانات موجودة منطقياً فقط
- جاهزة للتفعيل في المراحل المستقبلية

### 🎯 القيم الافتراضية
- كل مستخدم جديد يبدأ بـ `primary_identity = 'agricultural'`
- `secondary_identity = NULL` (لا توجد)
- `secondary_identity_enabled = false` (معطلة)

### ✅ التحقق من البيانات
```sql
-- للتحقق من البيانات الحالية:
SELECT
  id,
  full_name,
  primary_identity,
  secondary_identity,
  secondary_identity_enabled
FROM user_profiles
LIMIT 10;
```

---

## البنية التقنية

### الملفات المضافة:
- `supabase/migrations/add_secondary_identity_to_user_profiles.sql`
- `src/services/identityService.ts`

### الملفات المعدلة:
- `src/services/index.ts` - إضافة export للـ identityService

---

## اختبار الوظائف

### السيناريو 1: مستخدم جديد
1. يتم تسجيل مستخدم جديد
2. يتم إنشاء profile تلقائياً
3. الهوية الأساسية = `'agricultural'`
4. الهوية الثانية = `null`

### السيناريو 2: تغيير الهوية الأساسية (برمجياً فقط)
```typescript
// في الكود فقط، لا توجد واجهة مستخدم
await identityService.setPrimaryIdentity(userId, 'investment');
```

### السيناريو 3: إضافة هوية ثانية (برمجياً فقط)
```typescript
// جاهز للمستقبل، لا يستخدم حالياً
await identityService.setSecondaryIdentity(userId, 'agricultural');
await identityService.enableSecondaryIdentity(userId, true);
```

---

## المرحلة التالية

**المرحلة 3️⃣ — ربط الواجهة بقاعدة البيانات**

الهدف:
- قراءة الهوية من قاعدة البيانات بدلاً من localStorage
- حفظ تغييرات الهوية في قاعدة البيانات
- مزامنة الواجهة مع البيانات المحفوظة

---

## ملاحظات التطوير

- ✅ Migration مطبق بنجاح
- ✅ Identity Service جاهز للاستخدام
- ✅ البناء ناجح بدون أخطاء
- ✅ الحقول مفهرسة للأداء الأمثل
- ✅ دوال قاعدة البيانات جاهزة
- ✅ التحقق من البيانات موجود

---

**الحالة**: ✅ مكتمل ونجح البناء
