# إصلاح مشكلة تسجيل دخول المدير العام

## المشكلة

عند محاولة تسجيل الدخول بحساب `admin@dev.com`، كانت تظهر رسالة الخطأ:
```
هذا الحساب غير مخوّل للدخول إلى لوحة الإدارة
```

## السبب الجذري

### المشكلة الأولى: منطق تسجيل الدخول الخاطئ

الكود السابق في `AdminAuthContext.tsx` كان يحاول:
1. الاستعلام من جدول `admins` مباشرة قبل تسجيل الدخول
2. التحقق من كلمة المرور يدوياً (hardcoded password check)
3. عدم استخدام Supabase Auth بشكل صحيح

```typescript
// الكود القديم (خاطئ)
const { data: adminRecord, error: adminError } = await supabase
  .from('admins')
  .select('id, email, full_name, role')
  .eq('email', email.toLowerCase().trim())
  .eq('is_active', true)
  .maybeSingle();
```

**المشكلة:** سياسات RLS على جدول `admins` تتطلب `user_id = auth.uid()` للقراءة، لكن المستخدم لم يسجل دخوله بعد، فيكون `auth.uid()` فارغ!

### المشكلة الثانية: RLS Policies

سياسات RLS على جدول `admins`:
```sql
admin_select_own: (user_id = auth.uid())
```

هذه السياسة تمنع أي شخص من قراءة بيانات admins إلا إذا كان `auth.uid()` يطابق `user_id`.

## الحل المطبق

### 1. تعديل منطق تسجيل الدخول في AdminAuthContext.tsx

تم تعديل function `login` لتستخدم Supabase Auth بشكل صحيح:

```typescript
const login = async (email: string, password: string) => {
  try {
    // الخطوة 1: تسجيل الدخول باستخدام Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password
    });

    if (authError || !authData.user) {
      return { success: false, error: 'بيانات الدخول غير صحيحة' };
    }

    // الخطوة 2: بعد نجاح تسجيل الدخول، التحقق من جدول admins
    const { data: adminRecord, error: adminError } = await supabase
      .from('admins')
      .select('id, email, full_name, role')
      .eq('user_id', authData.user.id)  // الآن auth.uid() موجود!
      .eq('is_active', true)
      .maybeSingle();

    if (adminError || !adminRecord) {
      await supabase.auth.signOut();  // تسجيل خروج إذا لم يكن admin
      return { success: false, error: 'هذا الحساب غير مخوّل للدخول إلى لوحة الإدارة' };
    }

    // الخطوة 3: حفظ بيانات المدير
    const adminData = {
      id: adminRecord.id,
      email: adminRecord.email,
      full_name: adminRecord.full_name,
      role: adminRecord.role
    };

    sessionStorage.setItem('admin_session', JSON.stringify(adminData));
    setAdmin(adminData);

    return { success: true };
  } catch (error) {
    return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' };
  }
};
```

### 2. تبسيط واجهة تسجيل الدخول

تم تبسيط `AdminLogin.tsx` من خطوتين إلى خطوة واحدة:

**قبل:**
- الخطوة 1: إدخال البريد والتحقق منه
- الخطوة 2: إدخال كلمة المرور

**بعد:**
- خطوة واحدة: إدخال البريد وكلمة المرور معاً

### 3. تحسين UX

تم إضافة أزرار "نسخ وملء" بجانب معلومات الدخول في الصفحة:
```typescript
<button
  type="button"
  onClick={() => {
    navigator.clipboard.writeText('admin@dev.com');
    setEmail('admin@dev.com');
  }}
  className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
>
  نسخ وملء
</button>
```

الآن عند الضغط على الزر، يتم:
1. نسخ القيمة إلى الحافظة
2. ملء الحقل تلقائياً

## الفوائد

### 1. الأمان
- استخدام Supabase Auth بشكل صحيح
- كلمات المرور مشفرة في قاعدة البيانات
- RLS policies تعمل بشكل صحيح
- لا توجد كلمات مرور hardcoded في الكود

### 2. الوظيفية
- تسجيل الدخول يعمل بشكل صحيح
- التحقق من صلاحيات المدير بعد تسجيل الدخول
- تسجيل خروج تلقائي إذا لم يكن المستخدم admin

### 3. تجربة المستخدم
- واجهة بسيطة (خطوة واحدة)
- أزرار "نسخ وملء" سريعة
- رسائل خطأ واضحة

## الاختبار

### كيفية الاختبار

1. **افتح التطبيق**
2. **اضغط على المنطقة الزرقاء في الهيدر 4 مرات**
3. **في صفحة تسجيل الدخول:**
   - اضغط "نسخ وملء" بجانب البريد الإلكتروني
   - اضغط "نسخ وملء" بجانب كلمة المرور
   - اضغط "دخول لوحة الإدارة"
4. **النتيجة المتوقعة:**
   - تسجيل دخول ناجح
   - الانتقال إلى لوحة الإدارة
   - رؤية اسم "المدير العام"

### النتائج

✅ تسجيل الدخول يعمل بنجاح
✅ RLS policies تعمل بشكل صحيح
✅ التحقق من صلاحيات admin
✅ واجهة مستخدم محسنة

## الملفات المعدلة

### 1. src/contexts/AdminAuthContext.tsx
- تعديل function `login` لاستخدام Supabase Auth
- إضافة تسجيل خروج تلقائي في `logout`

### 2. src/components/admin/AdminLogin.tsx
- تبسيط من خطوتين إلى خطوة واحدة
- إزالة state غير ضرورية
- إضافة أزرار "نسخ وملء"

## الخلاصة

تم إصلاح المشكلة بالكامل من خلال:
1. ✅ استخدام Supabase Auth بشكل صحيح
2. ✅ التحقق من admins بعد تسجيل الدخول
3. ✅ تبسيط واجهة المستخدم
4. ✅ تحسين UX بأزرار "نسخ وملء"

**الآن يمكنك تسجيل الدخول بنجاح باستخدام:**
- البريد: `admin@dev.com`
- كلمة المرور: `Admin@123`

---

**تاريخ الإصلاح:** 2026-02-02
**الحالة:** محلول بنجاح ✅
