# إصلاح خطأ 404 - جدول Users غير موجود

## المشكلة

كان التطبيق يفشل عند محاولة عرض شهادة الاستثمار مع الخطأ التالي:

```
GET https://fyxxrplokeqbgkrvscto.supabase.co/rest/v1/users?select=full_name%2Cemail&id=eq.51704c12-64e4-4d02-9327-22d764df91f4 404 (Not Found)

Error: "Perhaps …nd the table 'public.users' in the schema cache"
```

## السبب

في ملف `InvestmentContract.tsx`، كان الكود يحاول جلب بيانات المستخدم من جدول `users` غير موجود في قاعدة البيانات:

```typescript
const { data: userData } = await supabase
  .from('users')  // ❌ هذا الجدول غير موجود!
  .select('full_name, email')
  .eq('id', reservation.user_id)
  .single();
```

## الحل

تم إزالة الاستعلام غير الضروري والاعتماد على `investorName` الممرر كـ prop:

### قبل الإصلاح:
```typescript
const { data: userData } = await supabase
  .from('users')
  .select('full_name, email')
  .eq('id', reservation.user_id)
  .single();

investorName: investorName || userData?.full_name || userData?.email?.split('@')[0] || 'المستثمر'
```

### بعد الإصلاح:
```typescript
investorName: investorName || 'المستثمر'
```

## التفاصيل

### لماذا هذا الحل صحيح؟

1. **المكون يستقبل `investorName` كـ prop**: عند استدعاء `InvestmentContract`، يتم تمرير اسم المستثمر من المكون الأب

2. **البيانات موجودة بالفعل**: في `AccountProfile.tsx`، يتم استخدام:
   ```typescript
   investorName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
   ```

3. **لا حاجة لاستعلام إضافي**: البيانات متوفرة من Auth Context

### الملف المعدل

**`src/components/InvestmentContract.tsx`**
- ✅ إزالة استعلام جدول users غير الموجود
- ✅ الاعتماد على prop الممرر
- ✅ تبسيط الكود

## النتيجة

✅ البناء نجح بدون أخطاء
✅ شهادة الاستثمار تعمل بشكل صحيح
✅ لا مزيد من أخطاء 404
✅ الأداء أفضل (استعلام أقل)

## ملاحظات إضافية

### عن جدول Users في Supabase

في Supabase، بيانات المستخدمين موجودة في:
- `auth.users` (جدول النظام) - لا يمكن الوصول إليه مباشرة عبر REST API
- يمكن إنشاء `public.profiles` إذا احتجنا بيانات إضافية للمستخدمين
- في حالتنا، نستخدم `user_metadata` وهو كافٍ

### البديل (إذا احتجنا جدول profiles مستقبلاً)

يمكن إنشاء جدول profiles بهذا الشكل:

```sql
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  full_name text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
```

لكن في حالتنا الحالية، ليس هناك حاجة لذلك.

---

**التاريخ:** 2024-01-31
**الحالة:** ✅ تم الإصلاح
**البناء:** ✅ نجح
