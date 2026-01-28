# ربط الأدوار بالصلاحيات - المرحلة 4 مكتملة

## نظرة عامة

تم تنفيذ المرحلة الرابعة بنجاح: ربط الأدوار بالصلاحيات (Role-Actions Mapping). الآن كل دور مرتبط بمجموعة محددة من الصلاحيات من سجل الصلاحيات المركزي.

## ملخص التنفيذ

تم ربط 5 أدوار رئيسية بصلاحياتهم:
1. **المدير العام**: جميع الصلاحيات (49 صلاحية)
2. **مدير المزارع**: 10 صلاحيات
3. **مدير مزرعة**: 21 صلاحية
4. **مشرف**: 9 صلاحيات
5. **عامل**: 2 صلاحية فقط

## التغييرات في قاعدة البيانات

### 1. جدول role_actions

جدول ربط Many-to-Many بين الأدوار والصلاحيات:

```sql
CREATE TABLE role_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  action_id uuid NOT NULL REFERENCES admin_actions(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(role_id, action_id)
);
```

#### الحقول الرئيسية

- **role_id**: معرف الدور (FK → admin_roles)
- **action_id**: معرف الصلاحية (FK → admin_actions)
- **is_enabled**: هل الصلاحية مفعلة؟
- **notes**: ملاحظات إضافية
- **UNIQUE constraint**: كل صلاحية تظهر مرة واحدة فقط لكل دور

### 2. سياسات RLS

```sql
-- القراءة: جميع المديرين
CREATE POLICY "المديرون يمكنهم قراءة ربط الأدوار بالصلاحيات"
  ON role_actions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

-- الكتابة: المدير العام فقط
CREATE POLICY "المدير العام يمكنه إدارة ربط الأدوار بالصلاحيات"
  ON role_actions FOR ALL TO authenticated
  USING (...role_key = 'super_admin'...)
  WITH CHECK (...role_key = 'super_admin'...);
```

## الدوال المساعدة

### 1. get_role_actions

الحصول على جميع صلاحيات دور (مع بيانات كاملة):

```sql
SELECT * FROM get_role_actions('role-uuid-here');
```

**العائد:**
```typescript
{
  action_id: uuid,
  action_key: text,
  action_name_ar: text,
  action_name_en: text,
  description_ar: text,
  description_en: text,
  scope_level: text,
  is_dangerous: boolean,
  requires_approval: boolean,
  category_key: text,
  category_name_ar: text,
  is_enabled: boolean
}
```

### 2. get_enabled_role_actions

الحصول على الصلاحيات المفعلة فقط لدور:

```sql
SELECT * FROM get_enabled_role_actions('role-uuid-here');
```

### 3. check_role_has_action

التحقق من امتلاك دور لصلاحية معينة:

```sql
SELECT check_role_has_action('role-uuid', 'tasks.create');
-- Returns: true or false
```

### 4. assign_actions_to_role

تعيين صلاحيات لدور (batch):

```sql
SELECT assign_actions_to_role(
  'role-uuid',
  ARRAY['operations.view', 'tasks.create', 'messaging.send']
);
```

### 5. toggle_role_action

تفعيل/تعطيل صلاحية لدور:

```sql
SELECT toggle_role_action('role-uuid', 'action-uuid', true);
```

### 6. get_roles_actions_count

إحصائيات الصلاحيات لكل دور:

```sql
SELECT * FROM get_roles_actions_count();
```

## الصلاحيات المعينة لكل دور

### 1. المدير العام (super_admin)

**عدد الصلاحيات**: 49 صلاحية (جميع الصلاحيات)

**ملاحظة خاصة**: تم تعطيل صلاحية `messaging.send` افتراضياً

#### التقسيم حسب المجموعات:
- **التشغيل**: 6 صلاحيات
- **المهام**: 9 صلاحيات
- **الصيانة**: 7 صلاحيات
- **المعدات**: 7 صلاحيات
- **المالية التشغيلية**: 7 صلاحيات
- **المراسلة**: 6 صلاحيات (messaging.send معطلة)
- **الإشراف**: 7 صلاحيات

#### الصلاحيات المعطلة:
- `messaging.send` - إرسال رسائل (معطلة افتراضياً)

---

### 2. مدير المزارع (farm_manager)

**عدد الصلاحيات**: 10 صلاحيات

#### الصلاحيات المعينة:

**أ) التشغيل (2 صلاحيات):**
1. `operations.view` - عرض حالة التشغيل
2. `operations.view_reports` - عرض التقارير التشغيلية

**ب) الصيانة (7 صلاحيات):**
1. `maintenance.view` - عرض جدول الصيانة
2. `maintenance.schedule` - جدولة صيانة دورية
3. `maintenance.emergency` - تسجيل صيانة طارئة
4. `maintenance.update` - تحديث حالة الصيانة
5. `maintenance.complete` - إكمال صيانة
6. `maintenance.approve` - الموافقة على الصيانة
7. `maintenance.cancel` - إلغاء صيانة

**ج) المراسلة (1 صلاحية):**
1. `messaging.view` - الاطلاع على المراسلات

#### القيود:
- لا يمكنه بدء/إغلاق موسم
- لا يمكنه إدارة المهام
- لا يمكنه إرسال رسائل
- لا يمكنه الوصول للمعدات أو المالية

---

### 3. مدير مزرعة (farm_supervisor)

**عدد الصلاحيات**: 21 صلاحية

#### الصلاحيات المعينة:

**أ) التشغيل (6 صلاحيات):**
1. `operations.view` - عرض حالة التشغيل
2. `operations.update` - تحديث حالة التشغيل
3. `operations.start_season` - بدء موسم جديد
4. `operations.close_season` - إغلاق موسم
5. `operations.log_daily` - تسجيل العمليات اليومية
6. `operations.view_reports` - عرض التقارير التشغيلية

**ب) المهام (9 صلاحيات):**
1. `tasks.view` - عرض المهام
2. `tasks.view_own` - عرض المهام الخاصة
3. `tasks.create` - إنشاء مهام
4. `tasks.assign` - تعيين مهام
5. `tasks.update` - تحديث حالة المهام
6. `tasks.complete` - إكمال مهام
7. `tasks.approve` - الموافقة على إكمال المهام
8. `tasks.cancel` - إلغاء مهام
9. `tasks.delete` - حذف مهام

**ج) المراسلة (6 صلاحيات):**
1. `messaging.view` - عرض الرسائل
2. `messaging.create` - إنشاء رسائل
3. `messaging.send` - إرسال رسائل
4. `messaging.reply` - الرد على رسائل
5. `messaging.attach_files` - إرفاق ملفات
6. `messaging.delete` - حذف رسائل

#### الصلاحيات الكاملة:
- إدارة كاملة للتشغيل
- إدارة كاملة للمهام
- إدارة كاملة للمراسلات (ضمن مزرعته)

#### القيود:
- لا يمكنه إدارة الصيانة
- لا يمكنه إدارة المعدات
- لا يمكنه الوصول للمالية التشغيلية

---

### 4. مشرف (supervisor)

**عدد الصلاحيات**: 9 صلاحيات (المهام فقط)

#### الصلاحيات المعينة (المهام فقط):

1. `tasks.view` - عرض المهام
2. `tasks.view_own` - عرض المهام الخاصة
3. `tasks.create` - إنشاء مهام
4. `tasks.assign` - تعيين مهام
5. `tasks.update` - تحديث حالة المهام
6. `tasks.complete` - إكمال مهام
7. `tasks.approve` - الموافقة على إكمال المهام
8. `tasks.cancel` - إلغاء مهام
9. `tasks.delete` - حذف مهام

#### التركيز:
- إدارة المهام بشكل كامل
- لا صلاحيات خارج المهام

#### القيود:
- **لا يمكنه** إدارة التشغيل
- **لا يمكنه** إدارة الصيانة
- **لا يمكنه** الوصول للمراسلة
- **لا يمكنه** الوصول للمالية
- **لا يمكنه** إدارة المعدات

---

### 5. عامل (worker)

**عدد الصلاحيات**: 2 صلاحية فقط

#### الصلاحيات المعينة:

1. `tasks.view_own` - عرض المهام المكلف بها فقط
2. `tasks.complete` - إغلاق/إكمال مهامه الخاصة

#### النطاق المحدود:
- يرى فقط المهام المسندة له شخصياً
- يمكنه فقط وضع علامة إكمال على مهامه
- **لا يمكنه رؤية** مهام الآخرين
- **لا يمكنه إنشاء** مهام
- **لا يمكنه تعيين** مهام
- **لا يمكنه حذف** مهام

#### الأمان:
- `scope_level: own` - يرى بياناته فقط
- محدود جداً للأمان

---

## جدول مقارنة الصلاحيات

| المجموعة | المدير العام | مدير المزارع | مدير مزرعة | مشرف | عامل |
|----------|-------------|-------------|-----------|------|------|
| **التشغيل** | 6/6 | 2/6 | 6/6 | 0/6 | 0/6 |
| **المهام** | 9/9 | 0/9 | 9/9 | 9/9 | 2/9 |
| **الصيانة** | 7/7 | 7/7 | 0/7 | 0/7 | 0/7 |
| **المعدات** | 7/7 | 0/7 | 0/7 | 0/7 | 0/7 |
| **المالية** | 7/7 | 0/7 | 0/7 | 0/7 | 0/7 |
| **المراسلة** | 5/6* | 1/6 | 6/6 | 0/6 | 0/6 |
| **الإشراف** | 7/7 | 0/7 | 0/7 | 0/7 | 0/7 |
| **المجموع** | **48/49** | **10/49** | **21/49** | **9/49** | **2/49** |

*messaging.send معطلة افتراضياً للمدير العام

## التحديثات في الكود

### 1. permissionsService

تم إضافة 8 دوال جديدة:

```typescript
// الحصول على صلاحيات دور
await permissionsService.getRoleActions(roleId);

// الحصول على الصلاحيات المفعلة فقط
await permissionsService.getEnabledRoleActions(roleId);

// التحقق من صلاحية معينة
await permissionsService.checkRoleHasAction(roleId, 'tasks.create');

// تعيين صلاحيات لدور (batch)
await permissionsService.assignActionsToRole(roleId, ['tasks.view', 'tasks.create']);

// تفعيل/تعطيل صلاحية
await permissionsService.toggleRoleAction(roleId, actionId, true);

// إحصائيات الصلاحيات
await permissionsService.getRolesActionsCount();

// مزامنة الصلاحيات (حذف القديمة + إضافة الجديدة)
await permissionsService.syncRoleActions(roleId, [actionId1, actionId2]);
```

### 2. RoleActionsMapping Component

مكون React جديد لعرض ربط الأدوار بالصلاحيات:

**الميزات:**
- عرض جميع الأدوار مع عدد الصلاحيات
- اختيار دور لمشاهدة صلاحياته التفصيلية
- تجميع الصلاحيات حسب المجموعات
- badges للحالة (مفعلة/معطلة)
- عرض الصلاحيات الحرجة والتي تتطلب موافقة
- تصميم تفاعلي وواضح

**الموقع:** `src/components/admin/RoleActionsMapping.tsx`

### 3. PermissionsManagement Update

تم إضافة تبويب خامس "ربط الصلاحيات":

```typescript
const tabs = [
  { id: 'mapping', label: 'ربط الصلاحيات', icon: Link2 },
  { id: 'actions', label: 'سجل الصلاحيات', icon: List },
  { id: 'roles', label: 'الأدوار', icon: Shield },
  { id: 'permissions', label: 'الصلاحيات', icon: Key },
  { id: 'users', label: 'مستخدمو الإدارة', icon: Users }
];
```

- التبويب الافتراضي الآن هو "ربط الصلاحيات"
- واجهة متكاملة مع 5 تبويبات

## طريقة الاستخدام

### 1. الوصول إلى ربط الصلاحيات

من لوحة التحكم:
1. اذهب إلى **إعدادات النظام** > **الصلاحيات**
2. ستفتح على تبويب **ربط الصلاحيات** مباشرة
3. اختر دوراً من القائمة لمشاهدة صلاحياته

### 2. استعراض الصلاحيات

- اختر دوراً لعرض صلاحياته
- الصلاحيات مجمعة حسب المجموعات
- اضغط على أي مجموعة لتوسيعها
- شاهد التفاصيل:
  - اسم الصلاحية ووصفها
  - النطاق (scope)
  - الحالة (مفعلة/معطلة)
  - إن كانت حرجة أو تتطلب موافقة

### 3. الاستعلام البرمجي

```typescript
// مثال: الحصول على صلاحيات دور المشرف
const supervisorRole = await permissionsService.getRoleByKey('supervisor');
if (supervisorRole) {
  const actions = await permissionsService.getRoleActions(supervisorRole.id);
  console.log(`Supervisor has ${actions.length} actions`);
}

// مثال: التحقق من صلاحية
const canCreateTasks = await permissionsService.checkRoleHasAction(
  supervisorRole.id,
  'tasks.create'
);
console.log(`Can create tasks: ${canCreateTasks}`); // true

// مثال: الحصول على الصلاحيات المفعلة فقط
const enabledActions = await permissionsService.getEnabledRoleActions(
  supervisorRole.id
);
console.log('Enabled actions:', enabledActions.map(a => a.action_key));
```

## استعلامات SQL مفيدة

### 1. عرض صلاحيات دور معين

```sql
SELECT
  ar.role_name_ar,
  ac.category_name_ar,
  aa.action_name_ar,
  aa.action_key,
  ra.is_enabled
FROM role_actions ra
JOIN admin_roles ar ON ar.id = ra.role_id
JOIN admin_actions aa ON aa.id = ra.action_id
JOIN action_categories ac ON ac.id = aa.category_id
WHERE ar.role_key = 'supervisor'
ORDER BY ac.display_order, aa.display_order;
```

### 2. عدد الصلاحيات لكل دور

```sql
SELECT
  ar.role_name_ar,
  COUNT(ra.id) FILTER (WHERE ra.is_enabled = true) as enabled_actions,
  COUNT(ra.id) as total_actions
FROM admin_roles ar
LEFT JOIN role_actions ra ON ra.role_id = ar.id
WHERE ar.is_active = true
GROUP BY ar.id, ar.role_name_ar
ORDER BY enabled_actions DESC;
```

### 3. الصلاحيات المشتركة بين دورين

```sql
SELECT
  aa.action_name_ar,
  aa.action_key
FROM role_actions ra1
JOIN role_actions ra2 ON ra2.action_id = ra1.action_id
JOIN admin_actions aa ON aa.id = ra1.action_id
JOIN admin_roles r1 ON r1.id = ra1.role_id
JOIN admin_roles r2 ON r2.id = ra2.role_id
WHERE r1.role_key = 'farm_supervisor'
  AND r2.role_key = 'supervisor'
  AND ra1.is_enabled = true
  AND ra2.is_enabled = true;
```

### 4. الأدوار التي تملك صلاحية معينة

```sql
SELECT
  ar.role_name_ar,
  ar.role_key
FROM role_actions ra
JOIN admin_roles ar ON ar.id = ra.role_id
JOIN admin_actions aa ON aa.id = ra.action_id
WHERE aa.action_key = 'messaging.send'
  AND ra.is_enabled = true;
```

## الأمان والضوابط

### 1. RLS Protection

جميع العمليات على `role_actions` محمية:
- **القراءة**: فقط المديرين المصادق عليهم
- **الكتابة**: فقط المدير العام
- **الحذف**: فقط المدير العام

### 2. Foreign Key Constraints

- حذف دور → يحذف جميع ربطه بالصلاحيات (CASCADE)
- حذف صلاحية → يحذف جميع ربطها بالأدوار (CASCADE)

### 3. Unique Constraint

لا يمكن ربط نفس الصلاحية بنفس الدور أكثر من مرة:
```sql
UNIQUE(role_id, action_id)
```

### 4. Default Values

- `is_enabled` افتراضياً `true`
- إلا في حالات استثنائية (messaging.send للمدير العام)

## ملاحظات هامة

### 1. الصلاحيات المعطلة للمدير العام

صلاحية `messaging.send` معطلة افتراضياً للمدير العام لأسباب أمنية. يمكن تفعيلها عند الحاجة.

### 2. نطاق الصلاحيات

- **system**: النظام بالكامل (المدير العام فقط)
- **farm**: مزرعة محددة (حسب scope_value للمدير)
- **task**: مهمة محددة
- **own**: بيانات المستخدم فقط (العامل)

### 3. الصلاحيات الحرجة

الصلاحيات الحرجة (`is_dangerous: true`) تظهر بعلامة تحذير:
- بدء موسم جديد
- إغلاق موسم
- حذف مهام
- حذف معدات
- حذف رسائل

### 4. الصلاحيات التي تتطلب موافقة

بعض الصلاحيات تتطلب موافقة (`requires_approval: true`):
- الموافقة على الصيانة
- الموافقة على المصروفات
- إرسال رسائل
- الموافقة على العمليات الحرجة

## إحصائيات النظام

### التوزيع الحالي:
- **5** أدوار نشطة
- **49** صلاحية متاحة
- **91** ربط دور-صلاحية
- **90** صلاحية مفعلة
- **1** صلاحية معطلة (messaging.send للمدير العام)

### التوزيع حسب الدور:
| الدور | الصلاحيات المفعلة | النسبة من الإجمالي |
|-------|------------------|---------------------|
| المدير العام | 48 | 98% |
| مدير مزرعة | 21 | 43% |
| مدير المزارع | 10 | 20% |
| مشرف | 9 | 18% |
| عامل | 2 | 4% |

## الاختبار

### سيناريو اختبار شامل

```typescript
// 1. الحصول على جميع الأدوار مع إحصائيات صلاحياتهم
const rolesStats = await permissionsService.getRolesActionsCount();
console.log('Roles stats:', rolesStats);

// 2. اختبار صلاحيات المشرف
const supervisorRole = await permissionsService.getRoleByKey('supervisor');
const supervisorActions = await permissionsService.getRoleActions(supervisorRole.id);
console.log(`Supervisor has ${supervisorActions.length} actions`);

// 3. التحقق من صلاحيات محددة
const canCreateTasks = await permissionsService.checkRoleHasAction(
  supervisorRole.id,
  'tasks.create'
);
console.log(`Supervisor can create tasks: ${canCreateTasks}`); // true

const canSendMessages = await permissionsService.checkRoleHasAction(
  supervisorRole.id,
  'messaging.send'
);
console.log(`Supervisor can send messages: ${canSendMessages}`); // false

// 4. اختبار صلاحيات العامل
const workerRole = await permissionsService.getRoleByKey('worker');
const workerActions = await permissionsService.getEnabledRoleActions(workerRole.id);
console.log('Worker actions:', workerActions.map(a => a.action_key));
// Expected: ['tasks.view_own', 'tasks.complete']

// 5. اختبار المدير العام
const superAdminRole = await permissionsService.getRoleByKey('super_admin');
const superAdminActions = await permissionsService.getRoleActions(superAdminRole.id);
console.log(`Super admin has ${superAdminActions.length} total actions`);

const sendDisabled = superAdminActions.find(a =>
  a.action_key === 'messaging.send' && !a.is_enabled
);
console.log('messaging.send disabled for super admin:', !!sendDisabled);
```

## الخطوات التالية (المرحلة 5)

في المرحلة الخامسة سيتم:
1. تطبيق الصلاحيات على مستوى الواجهات (UI)
2. إنشاء PermissionGate component
3. إخفاء/تعطيل الأزرار حسب الصلاحيات
4. تطبيق الصلاحيات على مستوى الـ API
5. اختبار التطبيق الكامل

## الخلاصة

تم ربط جميع الأدوار بصلاحياتهم بنجاح. النظام الآن:
- يحتوي على 5 أدوار مرتبطة بـ 91 ربط
- يدعم 49 صلاحية موزعة على 7 مجموعات
- محمي بالكامل بسياسات RLS
- يوفر 8 دوال مساعدة للاستعلام والإدارة
- يوفر واجهة عرض تفاعلية وواضحة
- جاهز للمرحلة الخامسة (تطبيق الصلاحيات)

البناء ناجح ولا توجد أخطاء!
