# تطبيق نظام الباقات الاستثمارية - اكتمل

## تاريخ الإنجاز
2 فبراير 2026

## الملخص
تم بنجاح تطبيق نظام الباقات في صفحة الاستثمار الزراعي بنفس الطريقة المستخدمة في صفحة المحصول الزراعي، مع محتوى مخصص للاستثمار.

---

## المراحل المنجزة

### المرحلة 1: قاعدة البيانات ✅

#### إنشاء جدول `investment_packages`
```sql
CREATE TABLE investment_packages (
  id uuid PRIMARY KEY,
  package_name text NOT NULL,
  contract_id uuid NOT NULL REFERENCES farm_contracts(id),
  price_per_tree integer NOT NULL,
  motivational_text text,
  description text NOT NULL,
  investment_duration_title text,
  investor_rights jsonb,
  management_approach text,
  returns_info text,
  disclaimer text,
  action_button_text text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### سياسات الأمان (RLS)
- ✅ السماح للجميع بقراءة الباقات النشطة
- ✅ السماح للمشرفين بإدارة الباقات

#### البيانات التجريبية
تم إضافة باقتين:
1. **باقة استثمار سنة واحدة**
   - السعر: 750 ر.س للشجرة
   - العقد: 1 سنة + 2 سنوات مجانية

2. **باقة استثمار 3 سنوات**
   - السعر: 650 ر.س للشجرة
   - العقد: 3 سنوات + 7 سنوات مجانية

---

### المرحلة 2: الخدمات (Services) ✅

#### ملف جديد: `investmentPackagesService.ts`
```typescript
export interface InvestmentPackage {
  id: string;
  package_name: string;
  contract_id: string;
  price_per_tree: number;
  motivational_text?: string;
  description: string;
  investment_duration_title: string;
  investor_rights: string[];
  management_approach: string;
  returns_info: string;
  disclaimer: string;
  action_button_text: string;
  // ... المزيد
}
```

الوظائف المتاحة:
- `getActivePackages()` - جلب جميع الباقات النشطة
- `getPackageById(id)` - جلب باقة معينة
- `getPackagesByContractId(contractId)` - جلب الباقات حسب العقد

---

### المرحلة 3: واجهة المستخدم ✅

#### ملف جديد: `InvestmentPackageDetailsModal.tsx`
Modal شامل لعرض تفاصيل الباقة الاستثمارية يتضمن:

**الأقسام:**
1. ✅ تعريف الباقة
2. ✅ مدة الاستثمار
3. ✅ حقوق المستثمر (قائمة مفصلة)
4. ✅ آلية الإدارة
5. ✅ معلومات العائد
6. ✅ التنويه القانوني
7. ✅ زر الإجراء (اختيار الباقة)

**التصميم:**
- استخدام ألوان ذهبية (Gold Theme)
- أيقونات توضيحية لكل قسم
- تصميم responsive مع scroll
- زر ثابت في الأسفل للاختيار

---

### المرحلة 4: تحديث صفحة الاستثمار ✅

#### تحديثات على `InvestmentFarmPage.tsx`

**1. State Management الجديدة:**
```typescript
const [packages, setPackages] = useState<InvestmentPackage[]>([]);
const [selectedPackage, setSelectedPackage] = useState<InvestmentPackage | null>(null);
const [showPackageDetailsModal, setShowPackageDetailsModal] = useState(false);
const [currentPackageIndex, setCurrentPackageIndex] = useState(0);
const scrollContainerRef = useRef<HTMLDivElement>(null);
const packagesScrollRef = useRef<HTMLDivElement>(null);
```

**2. تحميل الباقات:**
```typescript
useEffect(() => {
  const loadPackages = async () => {
    const pkgs = await investmentPackagesService.getActivePackages();
    setPackages(pkgs);
  };
  loadPackages();
}, []);
```

**3. معالج اختيار الباقة:**
```typescript
const handleSelectPackage = async (pkg: InvestmentPackage) => {
  setSelectedPackage(pkg);

  // جلب تفاصيل العقد من قاعدة البيانات
  const { data: contract } = await supabase
    .from('farm_contracts')
    .select('*')
    .eq('id', pkg.contract_id)
    .maybeSingle();

  if (contract) {
    setSelectedContract(contract);
  }
};
```

**4. واجهة عرض الباقات:**
- ✅ Slider أفقي للباقات
- ✅ بطاقات قابلة للنقر (clickable cards)
- ✅ زر "اقرأ عن الباقة" في كل بطاقة
- ✅ علامة "مختارة" على الباقة المحددة
- ✅ نقاط التنقل (dots navigation)
- ✅ أزرار السهم للتنقل بين الباقات

**5. حساب السعر:**
```typescript
const calculateTotal = () => {
  if (treeCount === 0) return 0;
  if (selectedPackage) {
    return treeCount * selectedPackage.price_per_tree;
  }
  if (selectedContract) {
    return treeCount * selectedContract.investor_price;
  }
  return 0;
};
```

**6. شاشة المراجعة:**
تم تحديث `InvestmentReviewScreen` لاستخدام:
- اسم الباقة المختارة (إن وجدت)
- معلومات العقد الصحيحة (duration_years, bonus_years)

---

## المحتوى المخصص للاستثمار

### حقوق المستثمر
يحق للمستثمر الاستفادة من القيمة الكاملة للشجرة:
1. الثمار الموسمية
2. الزيوت المستخرجة
3. مخلفات التقليم (الحطب)
4. أوراق الأشجار
5. بقايا العصر والنواتج النباتية

### آلية الإدارة
- المنصة تتولى الزراعة، الري، الصيانة، والحصاد
- إدارة بيع المنتجات والمخلفات
- متابعة دورية عبر حساب المستثمر

### معلومات العائد
- العائد مرتبط بالإنتاج والموسم
- لا توجد عوائد ثابتة أو مضمونة
- تفاصيل العوائد تظهر داخل الحساب عند توفرها

### التنويه القانوني
الاستثمار الزراعي يخضع لعوامل طبيعية ومناخية والمنصة تدير الاستثمار ولا تضمن نتائج مالية محددة.

---

## الميزات المنفذة

### 1. عرض الباقات
- ✅ Slider أفقي مع snap scrolling
- ✅ بطاقات ملونة بألوان ذهبية
- ✅ نص تحفيزي لكل باقة
- ✅ السعر بارز ومميز

### 2. التفاعل
- ✅ النقر على البطاقة لاختيار الباقة
- ✅ زر "اقرأ عن الباقة" لفتح Modal
- ✅ تحديث تلقائي للعقد عند الاختيار
- ✅ تحديث السعر في الشريط السفلي

### 3. Modal التفاصيل
- ✅ تصميم شامل ومنظم
- ✅ أقسام ملونة لكل معلومة
- ✅ أيقونات توضيحية
- ✅ زر اختيار ثابت في الأسفل

### 4. التكامل مع النظام
- ✅ ربط كامل مع جدول farm_contracts
- ✅ حساب السعر الصحيح
- ✅ عرض معلومات العقد في الشريط السفلي
- ✅ نقل البيانات الصحيحة لشاشة المراجعة

---

## ملفات تم إنشاؤها

1. **Migration:**
   - `supabase/migrations/[timestamp]_create_investment_packages_system.sql`
   - `supabase/migrations/[timestamp]_seed_investment_packages.sql`

2. **Services:**
   - `src/services/investmentPackagesService.ts`

3. **Components:**
   - `src/components/InvestmentPackageDetailsModal.tsx`

4. **تحديثات:**
   - `src/components/InvestmentFarmPage.tsx`

---

## اختبار النظام

### البناء
```bash
npm run build
```
**النتيجة:** ✅ نجح البناء بدون أخطاء

### قاعدة البيانات
```sql
SELECT * FROM investment_packages WHERE is_active = true;
```
**النتيجة:** ✅ وجود باقتين نشطتين

---

## طريقة الاستخدام

### للمستخدم:
1. فتح صفحة الاستثمار الزراعي
2. رؤية slider الباقات الاستثمارية
3. النقر على "اقرأ عن الباقة" لعرض التفاصيل الكاملة
4. اختيار الباقة المناسبة بالنقر عليها
5. تحديد عدد الأشجار
6. رؤية السعر الإجمالي في الشريط السفلي
7. المتابعة لإتمام الحجز

### للمشرف:
يمكن إضافة/تعديل الباقات من خلال جدول `investment_packages` في قاعدة البيانات.

---

## الفرق بين النظامين

### المحصول الزراعي (Agricultural)
- ألوان خضراء
- محتوى زراعي مباشر
- التركيز على العائد الزراعي

### الاستثمار الزراعي (Investment)
- ألوان ذهبية
- محتوى استثماري
- التركيز على حقوق المستثمر والعوائد المالية
- تنويه قانوني واضح عن عدم ضمان العوائد

---

## الملخص النهائي

تم تطبيق نظام الباقات بنجاح في صفحة الاستثمار الزراعي مع:

✅ **قاعدة بيانات كاملة** - جدول investment_packages مع RLS
✅ **خدمات متكاملة** - investmentPackagesService
✅ **واجهة مستخدم احترافية** - Modal تفاصيل + Slider باقات
✅ **تكامل كامل** - ربط مع العقود والأسعار
✅ **محتوى مخصص** - محتوى استثماري متخصص
✅ **بيانات تجريبية** - باقتين جاهزتين للاستخدام
✅ **بناء ناجح** - بدون أخطاء

النظام جاهز للاستخدام الفوري!
