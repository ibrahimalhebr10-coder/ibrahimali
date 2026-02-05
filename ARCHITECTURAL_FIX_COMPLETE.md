# تصحيح معماري كامل — نظام أشجاري الذهبية

## الخلاصة التنفيذية

تم إلغاء الازدواجية المعمارية بالكامل وتوحيد المسار إلى زر واحد ديناميكي.

---

## المشكلة المعمارية الأساسية

**الخلل:**
- وجود **زرين منفصلين** للذهبية:
  1. زر ديناميكي (أشجاري الخضراء / أشجاري الذهبية)
  2. زر إضافي ثابت (أشجاري الذهبية)

**التعارض:**
- الزر الإضافي كان مربوط بالتشغيل الفعلي → AshjariGoldExperience
- الزر الديناميكي كان مخصص لـ Demo → MyGreenTrees
- هذا يخلق **ازدواجية معمارية** و**تعارض في المسارات**

---

## التصحيح المطبق (3 خطوات رئيسية)

### الخطوة 1: إزالة الزر الإضافي نهائياً

#### 1.1 Footer.tsx
```typescript
// قبل:
interface FooterProps {
  identity: IdentityType;
  onMyFarmClick: () => void;
  onOfferFarmClick: () => void;
  onGoldenTreesClick: () => void; // ← تم إزالته
}

// بعد:
interface FooterProps {
  identity: IdentityType;
  onMyFarmClick: () => void;
  onOfferFarmClick: () => void;
}
```

- حذف `onGoldenTreesClick` من props
- حذف زر "أشجاري الذهبية" الإضافي من JSX
- حذف import Sparkles

#### 1.2 App.tsx (3 أماكن)
1. **State:**
   ```typescript
   // تم إزالة:
   const [showAshjariGold, setShowAshjariGold] = useState(false);
   ```

2. **Handler:**
   ```typescript
   // تم إزالة:
   const handleGoldenTreesClick = () => { ... }
   ```

3. **Header (Desktop):**
   - حذف زر "أشجاري الذهبية" الإضافي

4. **Footer المحمول:**
   - حذف زر "ذهبية" الصغير

5. **Render:**
   ```typescript
   // تم إزالة:
   {showAshjariGold && <AshjariGoldExperience />}
   ```

6. **Import:**
   ```typescript
   // تم إزالة:
   import AshjariGoldExperience from './components/AshjariGoldExperience';
   ```

---

### الخطوة 2: إنشاء goldenTreesService.ts

**الموقع:** `src/services/goldenTreesService.ts`

**الوظائف الرئيسية:**

#### 2.1 تحديد الوضع
```typescript
determineGoldenTreesMode(): Promise<GoldenTreesContext>
```
**المنطق:**
1. التحقق من `auth.getUser()`
2. إذا `!user` → `mode = 'demo'`
3. إذا `user` → استعلام عن reservations:
   ```sql
   SELECT id FROM reservations
   WHERE investor_id = user.id
     AND path_type = 'investment'
     AND status = 'confirmed'
   ```
4. إذا `count > 0` → `mode = 'active'`
5. إذا `count = 0` → `mode = 'no-assets'`

#### 2.2 جلب الأصول
```typescript
getGoldenTreeAssets(): Promise<GoldenTreeAsset[]>
```
**يجلب:**
- id, farm_name, tree_type
- trees_count, contract_start_date
- contract_duration, total_price

**شرط:** `path_type = 'investment'` AND `status = 'confirmed'`

#### 2.3 جلب رسوم الصيانة
```typescript
getGoldenTreeMaintenanceFees(): Promise<GoldenTreeMaintenance[]>
```
**يجلب:**
- fee_title, amount_due
- due_date, payment_status
- maintenance_type

**شرط:** `path_type = 'investment'`

---

### الخطوة 3: دمج المنطق في InvestmentAssetsView

**الموقع:** `src/components/InvestmentAssetsView.tsx`

#### 3.1 التحديثات
```typescript
// إضافة:
const [mode, setMode] = useState<GoldenTreesMode>('demo');
const [assets, setAssets] = useState<any[]>([]);
const [fees, setFees] = useState<any[]>([]);

useEffect(() => {
  const context = await determineGoldenTreesMode();
  setMode(context.mode);

  if (context.mode === 'active') {
    const [assetsData, feesData] = await Promise.all([
      getGoldenTreeAssets(),
      getGoldenTreeMaintenanceFees()
    ]);
    setAssets(assetsData);
    setFees(feesData);
  }
}, []);
```

#### 3.2 الواجهة الجديدة (3 حالات)

**Demo Mode:**
```typescript
{mode === 'demo' && (
  <div className="bg-amber-500/10 border border-amber-500/30">
    <h3>وضع العرض التوضيحي</h3>
    <p>هذه نظرة عامة على التجربة...</p>
    <button onClick={handleInvestmentAction}>تسجيل الدخول</button>
  </div>
)}
```

**No Assets Mode:**
```typescript
{mode === 'no-assets' && (
  <div className="bg-slate-800/50">
    <h3>لا توجد أصول استثمارية</h3>
    <p>أنت مسجل دخول لكن لا تملك أشجار ذهبية...</p>
    <button>ابدأ الاستثمار</button>
  </div>
)}
```

**Active Mode:**
```typescript
{mode === 'active' && assets.length > 0 && (
  <div>
    <h2>أصولك الاستثمارية</h2>
    {assets.map(asset => (
      <div key={asset.id}>
        <h3>{asset.tree_type}</h3>
        <p>{asset.farm_name}</p>
        <p>{asset.trees_count} شجرة</p>
        <p>{asset.total_price.toLocaleString()} ر.س</p>
      </div>
    ))}

    {fees.length > 0 && (
      <div>
        <h3>رسوم الصيانة</h3>
        {fees.map(fee => (
          <div key={fee.id}>
            <h4>{fee.fee_title}</h4>
            <p>{fee.amount_due.toLocaleString()} ر.س</p>
            {fee.payment_status === 'pending' && (
              <button>سداد الآن</button>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)}
```

---

## البنية المعمارية النهائية

### الزر الوحيد المعتمد
**الزر الديناميكي في Footer:**
- اسمه يتغير حسب `identity`:
  - `agricultural` → "أشجاري الخضراء"
  - `investment` → "أشجاري الذهبية"

### المسار الواحد
```
المستخدم يضغط على الزر الديناميكي
↓
handleMyFarmClick()
↓
يتحقق من identity
↓
إذا agricultural:
  → يفتح MyGreenTrees
  → يعرض agricultural path

إذا investment:
  → يفتح MyGreenTrees
  → MyGreenTrees يتحقق من identity
  → يعرض InvestmentAssetsView
  → InvestmentAssetsView يحدد الوضع:
     • Demo (غير مسجل)
     • Active (مسجل + لديه أشجار)
     • NoAssets (مسجل + لا يملك أشجار)
```

---

## التأكيدات المعمارية

### ✅ القاعدة الذهبية
```
زر واحد = مسار واحد = منطق واحد
```

### ✅ لا ازدواجية
- ❌ لا يوجد زر إضافي للذهبية
- ❌ لا يوجد مسار مستقل لـ AshjariGoldExperience
- ✅ كل شيء يمر عبر الزر الديناميكي
- ✅ InvestmentAssetsView يتعامل مع كل الحالات

### ✅ Demo Mode داخلي
- Demo ليس زر منفصل
- Demo حالة داخلية في InvestmentAssetsView
- يتم تحديده بناءً على auth + ownership

### ✅ فصل واضح
- `agricultural` → MyGreenTrees → Agricultural data
- `investment` → MyGreenTrees → InvestmentAssetsView → Golden trees data

---

## الملفات المعدلة

1. ✅ `src/components/Footer.tsx`
   - إزالة onGoldenTreesClick prop
   - حذف زر "أشجاري الذهبية" الإضافي
   - حذف import Sparkles

2. ✅ `src/App.tsx`
   - إزالة showAshjariGold state
   - إزالة handleGoldenTreesClick function
   - إزالة import AshjariGoldExperience
   - حذف زر الذهبية من Header (Desktop)
   - حذف زر "ذهبية" من Mobile Footer
   - حذف المكون AshjariGoldExperience من render

3. ✅ `src/services/goldenTreesService.ts` - **جديد**
   - determineGoldenTreesMode()
   - getGoldenTreeAssets()
   - getGoldenTreeMaintenanceFees()

4. ✅ `src/components/InvestmentAssetsView.tsx`
   - import goldenTreesService
   - إضافة mode, assets, fees state
   - إضافة loadGoldenTreesData()
   - إضافة Demo Mode banner
   - إضافة No Assets banner
   - إضافة Active Mode content
   - شرط demo content بـ `mode === 'demo'`

---

## الاختبار

### الحالة 1: زائر (غير مسجل)
```
1. identity = investment
2. الزر الديناميكي يعرض: "أشجاري الذهبية"
3. الضغط → handleMyFarmClick()
4. MyGreenTrees يتحقق من identity
5. يعرض InvestmentAssetsView
6. determineGoldenTreesMode() → user = null
7. النتيجة: mode = 'demo'
8. عرض demo content + banner تسجيل دخول
```

### الحالة 2: مستخدم مسجل بدون أشجار
```
1. identity = investment
2. الضغط على الزر الديناميكي
3. InvestmentAssetsView يحمل
4. determineGoldenTreesMode() → user ✓, count = 0
5. النتيجة: mode = 'no-assets'
6. عرض banner "لا توجد أصول" + دعوة للاستثمار
```

### الحالة 3: مستثمر فعلي
```
1. identity = investment
2. الضغط على الزر الديناميكي
3. InvestmentAssetsView يحمل
4. determineGoldenTreesMode() → user ✓, count > 0
5. النتيجة: mode = 'active'
6. getGoldenTreeAssets() + getGoldenTreeMaintenanceFees()
7. عرض الأصول الحقيقية + رسوم الصيانة + إمكانية السداد
```

---

## الضمانات الأمنية

1. **لا Demo بعد التسجيل:**
   - إذا auth = true، Demo Mode يُلغى تلقائياً

2. **إعادة التحقق في كل مرة:**
   - كل مرة يُفتح InvestmentAssetsView
   - يتم استعلام جديد عن auth + ownership

3. **فصل البيانات حسب path_type:**
   - investment → `path_type = 'investment'`
   - agricultural → `path_type = 'agricultural'`

---

## الخلاصة

تم تصحيح المعمار بالكامل:
- **زر واحد فقط** → الديناميكي (أشجاري الخضراء / الذهبية)
- **مسار واحد** → handleMyFarmClick → MyGreenTrees → InvestmentAssetsView
- **لا ازدواجية** → لا زر إضافي، لا مسار مستقل
- **Demo داخلي** → ليس زر منفصل، حالة داخل InvestmentAssetsView
- **3 حالات واضحة** → Demo | Active | NoAssets

البناء نجح بدون أخطاء.
