# إصلاح تداخل جلسة المدير مع واجهة المنصة

## المشكلة الأصلية

عند تسجيل دخول المدير ثم العودة لواجهة المنصة الرئيسية، كانت تحدث المشاكل التالية:

### 1. مشكلة التبديل بين المسارات
- عند الضغط على زر "أشجاري الذهبية" أثناء تفعيل "أشجاري الخضراء" - لا يقبل التبديل
- العكس صحيح - عند محاولة التبديل من الذهبية للخضراء لا يعمل
- عند الخروج من الحساب بشكل كامل يعود للعمل بشكل طبيعي

### 2. مشكلة اختفاء البيانات في لوحة التحكم
- عند العودة للوحة التحكم > قسم التسويق > تبويب شركاء المسيرة - تختفي جميع المعلومات
- في الإعدادات > تبويب المدفوعات - تختفي البيانات
- عند الخروج ثم العودة تظهر البيانات مجدداً

## التحليل الفني للمشكلة

### السبب الجذري

المشكلة كانت في **تضارب بين سياقات المصادقة وإدارة الهوية** (Identity Management):

1. **AuthContext** كان يحاول تحميل identity من جدول `user_profiles` لجميع المستخدمين بما فيهم المديرين
2. المديرون ليس لهم بالضرورة سجل في `user_profiles` أو قد يكون السجل غير متطابق مع المسار المطلوب
3. عند تغيير المسار (agricultural ⟷ investment)، كان `updateIdentity` يحاول التحديث في قاعدة البيانات حتى للمديرين
4. مكونات لوحة التحكم (Admin Components) لم تكن تستمع لتغييرات المسار، مما يسبب عدم تحديث البيانات

### التأثير على RLS Policies

سياسات RLS كانت تعتمد على:

```sql
EXISTS (
  SELECT 1 FROM admins WHERE user_id = auth.uid()
)
```

لكن عند محاولة الوصول للبيانات مع identity غير صحيح، كانت تحدث مشاكل في الفلترة.

## الحل المطبّق

### 1. إصلاح AuthContext - استثناء المديرين

**الملف**: `src/contexts/AuthContext.tsx`

#### في دالة `loadIdentity`:

```typescript
// فحص إذا كان المستخدم مدير
const { data: adminData } = await supabase
  .from('admins')
  .select('id, role')
  .eq('user_id', userId)
  .eq('is_active', true)
  .maybeSingle();

if (adminData) {
  console.log('👤 [AuthContext] User is Admin - using localStorage mode only');
  const savedMode = localStorage.getItem('appMode');
  const fallbackIdentity: IdentityType =
    (savedMode === 'agricultural' || savedMode === 'investment') ? savedMode : 'agricultural';

  console.log('🔄 [AuthContext] Admin mode:', fallbackIdentity);
  setIdentity(fallbackIdentity);
  setSecondaryIdentity(null);
  setSecondaryIdentityEnabled(false);
  setIdentityLoading(false);
  return; // مهم - نخرج هنا ولا نكمل للتحقق من user_profiles
}
```

**الفوائد**:
- المديرون لا يعتمدون على جدول `user_profiles`
- يستخدمون فقط `localStorage` للتبديل بين المسارات
- لا محاولات لتحديث قاعدة البيانات

#### في دالة `updateIdentity`:

```typescript
const updateIdentity = async (newIdentity: IdentityType): Promise<boolean> => {
  if (user) {
    // فحص إذا كان مدير
    const { data: adminData } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (adminData) {
      // مدير - فقط تحديث localStorage والـ state
      console.log('👤 [AuthContext] Admin identity switch to:', newIdentity);
      setIdentity(newIdentity);
      localStorage.setItem('appMode', newIdentity);

      // إطلاق event لتحديث البيانات في مكونات الإدارة
      window.dispatchEvent(new CustomEvent('admin-identity-changed', {
        detail: { identity: newIdentity }
      }));
      return true;
    }

    // مستخدم عادي - تحديث قاعدة البيانات
    const success = await identityService.setPrimaryIdentity(user.id, newIdentity);
    if (success) {
      setIdentity(newIdentity);
      localStorage.setItem('appMode', newIdentity);
      return true;
    }
    return false;
  } else {
    setIdentity(newIdentity);
    localStorage.setItem('appMode', newIdentity);
    return true;
  }
};
```

**الفوائد**:
- تبديل فوري للمسار للمديرين دون انتظار قاعدة البيانات
- إطلاق Custom Event لإعلام مكونات الإدارة بالتغيير

### 2. إضافة Force Refresh في مكونات الإدارة

#### InfluencerPartnersManager

**الملف**: `src/components/admin/InfluencerPartnersManager.tsx`

```typescript
useEffect(() => {
  loadData();

  // الاستماع لتغييرات identity المدير
  const handleIdentityChange = () => {
    console.log('🔄 [InfluencerPartnersManager] Identity changed, reloading data...');
    loadData();
  };

  window.addEventListener('admin-identity-changed', handleIdentityChange);

  return () => {
    window.removeEventListener('admin-identity-changed', handleIdentityChange);
  };
}, []);
```

#### PaymentProvidersManager

**الملف**: `src/components/admin/PaymentProvidersManager.tsx`

```typescript
useEffect(() => {
  loadProviders();

  // الاستماع لتغييرات identity المدير
  const handleIdentityChange = () => {
    console.log('🔄 [PaymentProvidersManager] Identity changed, reloading data...');
    loadProviders();
  };

  window.addEventListener('admin-identity-changed', handleIdentityChange);

  return () => {
    window.removeEventListener('admin-identity-changed', handleIdentityChange);
  };
}, []);
```

#### PendingPartnersRequests

**الملف**: `src/components/admin/PendingPartnersRequests.tsx`

نفس النمط مع الحفاظ على real-time subscription الموجود.

**الفوائد**:
- تحديث تلقائي للبيانات عند تغيير المسار
- لا حاجة لإعادة تحميل الصفحة
- الاحتفاظ بـ real-time updates

## كيف يعمل النظام الآن

### سيناريو 1: مدير يستخدم واجهة المنصة

1. المدير يسجل دخول للوحة التحكم
2. يعود للواجهة الرئيسية (دون خروج)
3. AuthContext يكتشف أنه مدير → يستخدم localStorage فقط
4. يمكنه التبديل بين "أشجاري الخضراء" و "أشجاري الذهبية" بحرية
5. كل تبديل يطلق event: `admin-identity-changed`

### سيناريو 2: مدير في لوحة التحكم

1. المدير داخل لوحة التحكم
2. يبدل المسار من الواجهة الرئيسية
3. Event `admin-identity-changed` يُطلق
4. جميع مكونات الإدارة النشطة تستمع للـ event
5. كل مكون يُعيد تحميل بياناته تلقائياً
6. لا اختفاء للبيانات

### سيناريو 3: مستخدم عادي

1. المستخدم العادي غير متأثر
2. يستمر النظام في استخدام `user_profiles` و `identityService`
3. التبديل بين المسارات يحدّث قاعدة البيانات
4. كل شيء يعمل كما هو

## الاختبار

### خطوات الاختبار المطلوبة

#### 1. اختبار التبديل للمدير في الواجهة الرئيسية

```
1. سجّل دخول كمدير: admin@ashjari.local
2. اذهب للوحة التحكم
3. ارجع للواجهة الرئيسية (دون خروج)
4. فعّل "أشجاري الذهبية" → يجب أن يعمل فوراً ✅
5. بدّل إلى "أشجاري الخضراء" → يجب أن يعمل فوراً ✅
6. كرر عدة مرات → لا مشاكل ✅
```

#### 2. اختبار البيانات في لوحة التحكم

```
1. سجّل دخول كمدير
2. اذهب لـ التسويق > شركاء المسيرة → البيانات تظهر ✅
3. اذهب للواجهة وبدّل المسار
4. ارجع لـ التسويق > شركاء المسيرة → البيانات لا زالت ظاهرة ✅
5. اذهب لـ الإعدادات > المدفوعات → البيانات تظهر ✅
6. بدّل المسار مجدداً
7. ارجع للإعدادات > المدفوعات → البيانات لا زالت ظاهرة ✅
```

#### 3. اختبار المستخدم العادي

```
1. سجّل حساب جديد (مستخدم عادي)
2. بدّل بين المسارات → يعمل بشكل طبيعي ✅
3. تحقق من user_profiles → البيانات تُحدّث ✅
4. الوظائف العادية تعمل كما هي ✅
```

### Console Logs للمراقبة

عند التبديل بين المسارات، ستظهر في Console:

```javascript
// عند التبديل كمدير:
👤 [AuthContext] User is Admin - using localStorage mode only
🔄 [AuthContext] Admin mode: investment
👤 [AuthContext] Admin identity switch to: investment

// عند التحديث في مكونات الإدارة:
🔄 [InfluencerPartnersManager] Identity changed, reloading data...
🔄 [PaymentProvidersManager] Identity changed, reloading data...
🔄 [PendingPartnersRequests] Identity changed, reloading data...
```

## الملفات المُعدّلة

1. ✅ `src/contexts/AuthContext.tsx`
   - إضافة فحص للمديرين في `loadIdentity`
   - تعديل `updateIdentity` لمعالجة المديرين بشكل خاص
   - إطلاق Custom Event عند تغيير identity

2. ✅ `src/components/admin/InfluencerPartnersManager.tsx`
   - إضافة listener لـ `admin-identity-changed`
   - force reload عند التغيير

3. ✅ `src/components/admin/PaymentProvidersManager.tsx`
   - إضافة listener لـ `admin-identity-changed`
   - force reload عند التغيير

4. ✅ `src/components/admin/PendingPartnersRequests.tsx`
   - إضافة listener لـ `admin-identity-changed`
   - force reload عند التغيير
   - الحفاظ على real-time subscription

## الفوائد النهائية

✅ **تجربة سلسة للمدير**: يمكنه التبديل بين المسارات دون أي تأخير أو مشاكل

✅ **لا اختفاء للبيانات**: جميع مكونات لوحة التحكم تُحدّث تلقائياً

✅ **فصل واضح بين الأدوار**: المديرون لهم معاملة خاصة، المستخدمون العاديون لا يتأثرون

✅ **Performance محسّن**: لا استعلامات غير ضرورية لقاعدة البيانات للمديرين

✅ **Debugging سهل**: Console logs واضحة تساعد في التتبع

## ملاحظات مهمة

⚠️ **للمطورين المستقبليين**:

1. عند إضافة مكون إدارة جديد يعرض بيانات، أضف listener لـ `admin-identity-changed`
2. استخدم pattern نفسه:

```typescript
useEffect(() => {
  loadData();

  const handleIdentityChange = () => {
    console.log('🔄 [ComponentName] Identity changed, reloading data...');
    loadData();
  };

  window.addEventListener('admin-identity-changed', handleIdentityChange);

  return () => {
    window.removeEventListener('admin-identity-changed', handleIdentityChange);
  };
}, []);
```

3. لا تعتمد على `user_profiles` للمديرين - استخدم `localStorage` فقط
4. Custom Event `admin-identity-changed` يحمل `detail.identity` إذا احتجته

---

**تاريخ الإصلاح**: 2026-02-06
**الحالة**: مكتمل ✅
**تم البناء**: نجح بدون أخطاء ✅
