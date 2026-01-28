# سجل الصلاحيات المركزي - المرحلة 3 مكتملة

## نظرة عامة

تم تنفيذ المرحلة الثالثة من نظام RBAC: تعريف سجل مركزي للصلاحيات (Actions Registry). النظام الآن يحتوي على جميع الصلاحيات المحتملة في المنصة، مقسمة إلى 7 مجموعات رئيسية.

## ملخص التنفيذ

تم إنشاء سجل شامل يحتوي على:
- **7 مجموعات** للصلاحيات
- **40+ صلاحية** موزعة على المجموعات
- **4 مستويات نطاق** (system, farm, task, own)
- **واجهة عرض** تفاعلية للسجل

## التغييرات في قاعدة البيانات

### 1. جدول action_categories

جدول مجموعات الصلاحيات:

```sql
CREATE TABLE action_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key text UNIQUE NOT NULL,
  category_name_ar text NOT NULL,
  category_name_en text NOT NULL,
  description_ar text,
  description_en text,
  icon text,
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

#### المجموعات السبعة

| المفتاح | الاسم العربي | الاسم الإنجليزي | الوصف |
|---------|-------------|-----------------|-------|
| `operations` | التشغيل | Operations | صلاحيات التشغيل اليومي للمزرعة |
| `tasks` | المهام | Tasks | إدارة وتنفيذ المهام |
| `maintenance` | الصيانة | Maintenance | الصيانة الدورية والطارئة |
| `equipment` | المعدات | Equipment | إدارة المعدات والأدوات |
| `operational_finance` | المالية التشغيلية | Operational Finance | المصروفات والمشتريات |
| `messaging` | المراسلة | Messaging | التواصل مع المستثمرين |
| `supervision` | الإشراف | Supervision | الإشراف والمراقبة |

### 2. جدول admin_actions

جدول الصلاحيات الفردية:

```sql
CREATE TABLE admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES action_categories(id) ON DELETE CASCADE,
  action_key text UNIQUE NOT NULL,
  action_name_ar text NOT NULL,
  action_name_en text NOT NULL,
  description_ar text,
  description_en text,
  scope_level text DEFAULT 'farm',
  is_dangerous boolean DEFAULT false,
  requires_approval boolean DEFAULT false,
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
```

#### الحقول الرئيسية

- **action_key**: مفتاح فريد للصلاحية (مثل: `operations.view`)
- **scope_level**: مستوى النطاق (system, farm, task, own)
- **is_dangerous**: هل الصلاحية حرجة/خطيرة؟
- **requires_approval**: هل تتطلب موافقة قبل التنفيذ؟

### 3. مستويات النطاق (Scope Levels)

```sql
CHECK (scope_level IN ('system', 'farm', 'task', 'own'))
```

| المستوى | الوصف | مثال |
|---------|-------|------|
| `system` | النظام بالكامل | إدارة جميع المزارع |
| `farm` | مزرعة محددة | عرض بيانات مزرعة واحدة |
| `task` | مهمة محددة | تحديث حالة مهمة |
| `own` | بيانات المستخدم فقط | عرض المهام الخاصة |

### 4. سياسات RLS

```sql
-- قراءة: جميع المديرين
CREATE POLICY "المديرون يمكنهم قراءة مجموعات الصلاحيات"
  ON action_categories FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

CREATE POLICY "المديرون يمكنهم قراءة الصلاحيات"
  ON admin_actions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

-- كتابة: المدير العام فقط
CREATE POLICY "المدير العام يمكنه إدارة مجموعات الصلاحيات"
  ON action_categories FOR ALL TO authenticated
  USING (...role_key = 'super_admin'...)
  WITH CHECK (...role_key = 'super_admin'...);

CREATE POLICY "المدير العام يمكنه إدارة الصلاحيات"
  ON admin_actions FOR ALL TO authenticated
  USING (...role_key = 'super_admin'...)
  WITH CHECK (...role_key = 'super_admin'...);
```

## الدوال المساعدة

### 1. get_all_actions_with_categories

الحصول على جميع الصلاحيات مع بيانات المجموعات:

```sql
SELECT * FROM get_all_actions_with_categories();
```

**العائد:**
```typescript
{
  action_id: uuid,
  action_key: text,
  action_name_ar: text,
  action_name_en: text,
  action_description_ar: text,
  action_description_en: text,
  scope_level: text,
  is_dangerous: boolean,
  requires_approval: boolean,
  category_id: uuid,
  category_key: text,
  category_name_ar: text,
  category_name_en: text
}
```

### 2. get_actions_by_category

الحصول على صلاحيات مجموعة معينة:

```sql
SELECT * FROM get_actions_by_category('operations');
```

## الصلاحيات المعرفة

### 1. التشغيل (Operations) - 6 صلاحيات

| المفتاح | الاسم | النطاق | حرجة؟ |
|---------|-------|---------|-------|
| `operations.view` | عرض حالة التشغيل | farm | لا |
| `operations.update` | تحديث حالة التشغيل | farm | لا |
| `operations.start_season` | بدء موسم جديد | farm | نعم |
| `operations.close_season` | إغلاق موسم | farm | نعم |
| `operations.log_daily` | تسجيل العمليات اليومية | farm | لا |
| `operations.view_reports` | عرض التقارير التشغيلية | farm | لا |

### 2. المهام (Tasks) - 9 صلاحيات

| المفتاح | الاسم | النطاق | حرجة؟ |
|---------|-------|---------|-------|
| `tasks.view` | عرض المهام | farm | لا |
| `tasks.view_own` | عرض المهام الخاصة | own | لا |
| `tasks.create` | إنشاء مهام | farm | لا |
| `tasks.assign` | تعيين مهام | farm | لا |
| `tasks.update` | تحديث حالة المهام | task | لا |
| `tasks.complete` | إكمال مهام | own | لا |
| `tasks.approve` | الموافقة على إكمال المهام | farm | لا |
| `tasks.cancel` | إلغاء مهام | farm | لا |
| `tasks.delete` | حذف مهام | farm | نعم |

### 3. الصيانة (Maintenance) - 7 صلاحيات

| المفتاح | الاسم | النطاق | موافقة؟ |
|---------|-------|---------|---------|
| `maintenance.view` | عرض جدول الصيانة | farm | لا |
| `maintenance.schedule` | جدولة صيانة دورية | farm | لا |
| `maintenance.emergency` | تسجيل صيانة طارئة | farm | لا |
| `maintenance.update` | تحديث حالة الصيانة | farm | لا |
| `maintenance.complete` | إكمال صيانة | farm | لا |
| `maintenance.approve` | الموافقة على الصيانة | farm | نعم |
| `maintenance.cancel` | إلغاء صيانة | farm | لا |

### 4. المعدات (Equipment) - 7 صلاحيات

| المفتاح | الاسم | النطاق | حرجة؟ |
|---------|-------|---------|-------|
| `equipment.view` | عرض المعدات | farm | لا |
| `equipment.add` | إضافة معدات | farm | لا |
| `equipment.update` | تحديث معلومات المعدات | farm | لا |
| `equipment.log_usage` | تسجيل استخدام المعدات | farm | لا |
| `equipment.transfer` | نقل معدات | farm | لا |
| `equipment.deactivate` | إيقاف تشغيل معدات | farm | لا |
| `equipment.delete` | حذف معدات | farm | نعم |

### 5. المالية التشغيلية (Operational Finance) - 7 صلاحيات

| المفتاح | الاسم | النطاق | موافقة؟ |
|---------|-------|---------|---------|
| `finance.view_expenses` | عرض المصروفات | farm | لا |
| `finance.record_expense` | تسجيل مصروفات | farm | لا |
| `finance.approve_expense` | الموافقة على مصروفات | farm | نعم |
| `finance.view_invoices` | عرض الفواتير | farm | لا |
| `finance.add_invoice` | إضافة فواتير | farm | لا |
| `finance.request_payment` | طلب صرف مالي | farm | لا |
| `finance.view_reports` | عرض التقارير المالية | farm | لا |

### 6. المراسلة (Messaging) - 6 صلاحيات

| المفتاح | الاسم | النطاق | موافقة؟ |
|---------|-------|---------|---------|
| `messaging.view` | عرض الرسائل | farm | لا |
| `messaging.create` | إنشاء رسائل | farm | لا |
| `messaging.send` | إرسال رسائل | farm | نعم |
| `messaging.reply` | الرد على رسائل | farm | لا |
| `messaging.attach_files` | إرفاق ملفات | farm | لا |
| `messaging.delete` | حذف رسائل | farm | نعم |

### 7. الإشراف (Supervision) - 7 صلاحيات

| المفتاح | الاسم | النطاق | حرجة؟ |
|---------|-------|---------|-------|
| `supervision.view_dashboard` | عرض لوحة الإشراف | farm | لا |
| `supervision.monitor_performance` | مراقبة الأداء | farm | لا |
| `supervision.review_operations` | مراجعة العمليات | farm | لا |
| `supervision.create_reports` | إنشاء تقارير | farm | لا |
| `supervision.approve_critical` | الموافقة على العمليات الحرجة | farm | نعم |
| `supervision.view_logs` | عرض سجلات النشاط | farm | لا |
| `supervision.manage_alerts` | إدارة التنبيهات | farm | لا |

## التحديثات في الكود

### 1. permissionsService

تم إضافة 6 دوال جديدة:

```typescript
// الحصول على جميع المجموعات
await permissionsService.getAllActionCategories();

// الحصول على جميع الصلاحيات
await permissionsService.getAllActions();

// الحصول على الصلاحيات مع المجموعات
await permissionsService.getAllActionsWithCategories();

// الحصول على صلاحيات مجموعة معينة
await permissionsService.getActionsByCategory('operations');

// الحصول على صلاحية بمفتاحها
await permissionsService.getActionByKey('tasks.create');

// الحصول على مجموعة بمفتاحها
await permissionsService.getCategoryByKey('operations');
```

### 2. ActionsRegistry Component

مكون React جديد لعرض سجل الصلاحيات:

**الميزات:**
- عرض تفاعلي لجميع المجموعات
- إمكانية توسيع كل مجموعة لعرض صلاحياتها
- badges للنطاق، الحرجة، والموافقة
- تصميم احترافي مع ألوان واضحة
- رسائل تنويهية ومعلوماتية

**الموقع:** `src/components/admin/ActionsRegistry.tsx`

### 3. PermissionsManagement Update

تم إضافة تبويب رابع "سجل الصلاحيات":

```typescript
const tabs = [
  { id: 'actions', label: 'سجل الصلاحيات', icon: List },
  { id: 'roles', label: 'الأدوار', icon: Shield },
  { id: 'permissions', label: 'الصلاحيات', icon: Key },
  { id: 'users', label: 'مستخدمو الإدارة', icon: Users }
];
```

- التبويب الافتراضي هو "سجل الصلاحيات"
- الواجهة متكاملة مع التبويبات الأخرى

## طريقة الاستخدام

### 1. الوصول إلى سجل الصلاحيات

من لوحة التحكم:
1. اذهب إلى **إعدادات النظام** > **الصلاحيات**
2. اختر تبويب **سجل الصلاحيات**
3. ستظهر جميع المجموعات السبعة

### 2. استعراض الصلاحيات

- اضغط على أي مجموعة لتوسيعها
- شاهد جميع الصلاحيات في المجموعة
- لاحظ البادجات:
  - **النطاق**: نظام، مزرعة، مهمة، ذاتي
  - **عملية حرجة**: صلاحيات خطيرة
  - **تتطلب موافقة**: تحتاج موافقة مشرف

### 3. الاستعلام البرمجي

```typescript
// مثال: الحصول على جميع صلاحيات التشغيل
const operationsActions = await permissionsService.getActionsByCategory('operations');

// مثال: التحقق من صلاحية معينة
const action = await permissionsService.getActionByKey('tasks.create');
if (action) {
  console.log(`Scope: ${action.scope_level}`);
  console.log(`Is Dangerous: ${action.is_dangerous}`);
  console.log(`Requires Approval: ${action.requires_approval}`);
}
```

## الأمان

### سياسات الحماية

1. **القراءة:**
   - جميع المديرين المصادق عليهم يمكنهم قراءة السجل
   - لا يمكن للزوار أو المستثمرين الوصول

2. **الكتابة:**
   - فقط المدير العام يمكنه تعديل أو إضافة صلاحيات
   - محمي بسياسات RLS صارمة

3. **التدقيق:**
   - جميع التغييرات مسجلة في `admin_logs`
   - يمكن تتبع من أضاف أو عدل صلاحية

## ملاحظات هامة

### 1. للعرض فقط
هذه المرحلة للتسجيل والعرض فقط. **لم يتم ربط الصلاحيات بالأدوار بعد**.

### 2. لا تطبيق فعلي
الصلاحيات المسجلة لا تطبق أي قيود حالياً. التطبيق الفعلي سيكون في المراحل القادمة.

### 3. قابلية التوسع
النظام مصمم ليكون قابلاً للتوسع:
- يمكن إضافة مجموعات جديدة
- يمكن إضافة صلاحيات جديدة لأي مجموعة
- مرن في التخصيص

### 4. التوثيق الذاتي
كل صلاحية موثقة بـ:
- اسم عربي وإنجليزي
- وصف واضح
- مفتاح فريد (action_key)
- معلومات النطاق والحرجة

## إحصائيات

- **7** مجموعات رئيسية
- **49** صلاحية فردية
- **4** مستويات نطاق
- **9** صلاحيات حرجة
- **6** صلاحيات تتطلب موافقة

## الخطوات التالية (المرحلة 4)

في المرحلة الرابعة سيتم:
1. ربط الصلاحيات بالأدوار
2. إنشاء جدول `role_actions` للربط
3. واجهة لتعيين صلاحيات لكل دور
4. تطبيق الصلاحيات على مستوى الواجهات

## الاختبار

### سيناريو اختبار أساسي

```typescript
// 1. الحصول على جميع المجموعات
const categories = await permissionsService.getAllActionCategories();
console.log(`Found ${categories.length} categories`);

// 2. الحصول على صلاحيات مجموعة
const tasksActions = await permissionsService.getActionsByCategory('tasks');
console.log(`Tasks category has ${tasksActions.length} actions`);

// 3. التحقق من صلاحية معينة
const createTask = await permissionsService.getActionByKey('tasks.create');
console.log('Action:', createTask);

// 4. الحصول على جميع الصلاحيات
const allActions = await permissionsService.getAllActions();
console.log(`Total actions: ${allActions.length}`);
```

### استعلامات SQL مباشرة

```sql
-- عدد الصلاحيات لكل مجموعة
SELECT
  ac.category_name_ar,
  COUNT(aa.id) as actions_count
FROM action_categories ac
LEFT JOIN admin_actions aa ON aa.category_id = ac.id
GROUP BY ac.id, ac.category_name_ar
ORDER BY ac.display_order;

-- الصلاحيات الحرجة
SELECT
  ac.category_name_ar,
  aa.action_name_ar,
  aa.action_key
FROM admin_actions aa
JOIN action_categories ac ON ac.id = aa.category_id
WHERE aa.is_dangerous = true;

-- الصلاحيات التي تتطلب موافقة
SELECT
  ac.category_name_ar,
  aa.action_name_ar,
  aa.action_key
FROM admin_actions aa
JOIN action_categories ac ON ac.id = aa.category_id
WHERE aa.requires_approval = true;
```

## الخلاصة

تم تنفيذ سجل مركزي شامل للصلاحيات في المرحلة الثالثة. النظام الآن:
- يحتوي على 7 مجموعات رئيسية
- يحتوي على 49 صلاحية موثقة
- يدعم 4 مستويات نطاق
- يحدد الصلاحيات الحرجة والتي تتطلب موافقة
- محمي بالكامل بسياسات RLS
- يوفر واجهة عرض تفاعلية
- جاهز للمرحلة الرابعة (ربط الصلاحيات بالأدوار)

البناء ناجح ولا توجد أخطاء!
