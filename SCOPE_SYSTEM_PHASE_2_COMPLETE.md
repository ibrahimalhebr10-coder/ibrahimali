# نظام نطاق الرؤية (Scope) - المرحلة 2 مكتملة

## نظرة عامة

تم تنفيذ المرحلة الثانية من نظام RBAC وهي إضافة نطاق الرؤية (Scope) للمديرين. النظام الآن يخزن النطاق لكل مدير حسب دوره، ويسمح بتعيين المزارع للمديرين.

## التغييرات في قاعدة البيانات

### 1. حقول جديدة في جدول admins

تم إضافة حقلين جديدين:

```sql
ALTER TABLE admins
ADD COLUMN scope_type text DEFAULT 'all',
ADD COLUMN scope_value jsonb DEFAULT NULL;

-- قيد على scope_type
CHECK (scope_type IN ('all', 'farms', 'farm', 'tasks'))
```

#### scope_type
نوع النطاق للمدير. القيم المعتمدة:
- `all` - وصول كامل لجميع البيانات (المدير العام)
- `farms` - وصول لمجموعة من المزارع (مدير المزارع)
- `farm` - وصول لمزرعة واحدة (مدير مزرعة، مشرف)
- `tasks` - وصول محدد بالمهام (عامل)

#### scope_value
قيمة النطاق بصيغة JSON. يختلف البنية حسب scope_type:

```typescript
// all
scope_value: null

// farms (مجموعة مزارع)
scope_value: {
  farm_ids: ["uuid1", "uuid2", "uuid3"]
}

// farm (مزرعة واحدة)
scope_value: {
  farm_id: "uuid"
}

// tasks (مهام)
scope_value: {
  task_ids: ["uuid1", "uuid2"]
}
```

### 2. جدول admin_farm_assignments

جدول جديد لربط المديرين بالمزارع المعينة لهم:

```sql
CREATE TABLE admin_farm_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES admins(id),
  assigned_at timestamptz DEFAULT now(),
  notes text,
  UNIQUE(admin_id, farm_id)
);
```

#### الحقول
- `id` - معرف فريد للتعيين
- `admin_id` - معرف المدير
- `farm_id` - معرف المزرعة
- `assigned_by` - المدير الذي قام بالتعيين
- `assigned_at` - تاريخ ووقت التعيين
- `notes` - ملاحظات حول التعيين

#### الفهارس
```sql
CREATE INDEX idx_admin_farm_assignments_admin_id ON admin_farm_assignments(admin_id);
CREATE INDEX idx_admin_farm_assignments_farm_id ON admin_farm_assignments(farm_id);
```

### 3. سياسات الأمان (RLS)

تم إضافة سياسات RLS لحماية جدول التعيينات:

```sql
-- قراءة: جميع المديرين
CREATE POLICY "read_farm_assignments"
  ON admin_farm_assignments FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

-- إنشاء: المدير العام ومدير المزارع فقط
CREATE POLICY "create_farm_assignments"
  ON admin_farm_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN admin_roles ar ON ar.id = a.role_id
      WHERE a.id = auth.uid()
        AND ar.role_key IN ('super_admin', 'farm_manager')
    )
  );

-- حذف: المدير العام ومدير المزارع فقط
CREATE POLICY "delete_farm_assignments"
  ON admin_farm_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN admin_roles ar ON ar.id = a.role_id
      WHERE a.id = auth.uid()
        AND ar.role_key IN ('super_admin', 'farm_manager')
    )
  );
```

## الدوال المساعدة

### 1. update_admin_scope_from_assignments

تحديث scope_value تلقائياً بناءً على التعيينات:

```sql
SELECT update_admin_scope_from_assignments('admin_id');
```

- تُستدعى تلقائياً عند إضافة أو حذف تعيين
- تحدث scope_value ليعكس المزارع المعينة حالياً

### 2. get_admin_assigned_farms

الحصول على المزارع المعينة لمدير:

```sql
SELECT * FROM get_admin_assigned_farms('admin_id');
```

**العائد:**
```typescript
{
  farm_id: uuid,
  farm_name_ar: text,
  farm_name_en: text,
  assigned_at: timestamptz,
  assigned_by_name: text
}
```

### 3. get_farm_assigned_admins

الحصول على المديرين المعينين لمزرعة:

```sql
SELECT * FROM get_farm_assigned_admins('farm_id');
```

**العائد:**
```typescript
{
  admin_id: uuid,
  full_name: text,
  email: text,
  role_name_ar: text,
  assigned_at: timestamptz
}
```

### 4. assign_farm_to_admin

تعيين مزرعة لمدير:

```sql
SELECT assign_farm_to_admin(
  'admin_id',
  'farm_id',
  'assigned_by_id',
  'ملاحظات اختيارية'
);
```

- يُنشئ تعييناً جديداً أو يحدث القديم
- يُحدث scope_value تلقائياً

### 5. unassign_farm_from_admin

إلغاء تعيين مزرعة من مدير:

```sql
SELECT unassign_farm_from_admin('admin_id', 'farm_id');
```

- يحذف التعيين
- يُحدث scope_value تلقائياً

## التحديثات في الكود

### 1. permissionsService

تم إضافة دوال جديدة:

```typescript
// الحصول على المزارع المعينة لمدير
await permissionsService.getAdminAssignedFarms(adminId);

// الحصول على المديرين المعينين لمزرعة
await permissionsService.getFarmAssignedAdmins(farmId);

// تعيين مزرعة لمدير
await permissionsService.assignFarmToAdmin(
  adminId,
  farmId,
  assignedBy,
  notes?
);

// إلغاء تعيين مزرعة من مدير
await permissionsService.unassignFarmFromAdmin(adminId, farmId);

// تحديث نطاق المدير
await permissionsService.updateAdminScope(
  adminId,
  scopeType,
  scopeValue?
);

// الحصول على نطاق المدير
await permissionsService.getAdminScope(adminId);
```

### 2. ManageFarmAssignments Component

تم تحديث مكون إدارة تعيينات المزارع:

```typescript
interface ManageFarmAssignmentsProps {
  admin: {
    id: string;
    full_name: string;
    email: string;
    scope_type?: string;
    scope_value?: any;
  };
  onClose: () => void;
  onUpdate: () => void;
  currentAdminId: string; // جديد
}
```

**الميزات الجديدة:**
- استخدام permissionsService بدلاً من استدعاءات مباشرة
- دعم scope_type و scope_value
- رسائل خطأ محسنة
- تحديث تلقائي لـ scope_value

### 3. AdminUsersTab Component

تم إضافة:
- `currentAdminId` state
- دالة `loadCurrentAdmin()` للحصول على المدير الحالي
- تمرير `currentAdminId` إلى `ManageFarmAssignments`

```typescript
const [currentAdminId, setCurrentAdminId] = useState<string>('');

async function loadCurrentAdmin() {
  const result = await permissionsService.getCurrentAdminWithRole();
  if (result?.admin) {
    setCurrentAdminId(result.admin.id);
  }
}
```

## نطاقات الأدوار (Scope by Role)

### المدير العام (Super Admin)
```typescript
scope_type: 'all'
scope_value: null
```
- وصول كامل لجميع المزارع والبيانات
- لا حاجة لتعيينات

### مدير المزارع (Farm Manager)
```typescript
scope_type: 'farms'
scope_value: {
  farm_ids: ["uuid1", "uuid2", ...]
}
```
- يُعين له مجموعة من المزارع
- يمكنه إدارة المزارع المعينة فقط

### مدير مزرعة (Farm Supervisor)
```typescript
scope_type: 'farm'
scope_value: {
  farm_id: "uuid"
}
```
- يُعين له مزرعة واحدة أو أكثر (تُحفظ الأولى في scope_value)
- يمكنه إدارة مزرعته فقط

### مشرف (Supervisor)
```typescript
scope_type: 'farm'
scope_value: {
  farm_id: "uuid"
}
```
- نفس نطاق مدير المزرعة
- لكن بصلاحيات أقل

### عامل (Worker)
```typescript
scope_type: 'tasks'
scope_value: {
  task_ids: ["uuid1", "uuid2"]
}
```
- محدود بمهام معينة فقط
- تُدار المهام من خلال نظام منفصل

## استخدام النظام

### 1. تعيين مزارع لمدير

من لوحة التحكم:
1. اذهب إلى **إعدادات النظام** > **المستخدمون**
2. اضغط على أيقونة 📍 بجانب المدير
3. اختر المزارع المراد تعيينها
4. سيتم تحديث scope_value تلقائياً

### 2. عرض المزارع المعينة

```typescript
const farms = await permissionsService.getAdminAssignedFarms(adminId);
console.log(farms);
// [
//   {
//     farm_id: "...",
//     farm_name_ar: "مزرعة زيتون الجوف",
//     farm_name_en: "Al-Jouf Olive Farm",
//     assigned_at: "2026-01-28...",
//     assigned_by_name: "أحمد محمد"
//   }
// ]
```

### 3. التحقق من نطاق المدير

```typescript
const scope = await permissionsService.getAdminScope(adminId);
if (scope.scope_type === 'farm') {
  const farmId = scope.scope_value.farm_id;
  // تصفية البيانات حسب farm_id
}
```

## ملاحظات هامة

### 1. التخزين فقط
في هذه المرحلة، النظام يخزن النطاق فقط دون تطبيق القيود على الواجهات. التطبيق الفعلي سيكون في المرحلة الثالثة.

### 2. التحديث التلقائي
عند إضافة أو حذف تعيين، يتم تحديث scope_value تلقائياً من خلال دالة `update_admin_scope_from_assignments`.

### 3. الأمان
- جميع العمليات محمية بـ RLS
- فقط المدير العام ومدير المزارع يمكنهما تعيين أو إلغاء تعيين المزارع
- جميع المديرين يمكنهم عرض التعيينات

### 4. التوافق
النظام متوافق مع:
- نظام الصلاحيات الموجود
- قسم محصولي
- مراسلة المستثمرين
- الإشراف الإداري

## الخطوات التالية (المرحلة 3)

في المرحلة الثالثة سيتم:
1. تطبيق القيود على مستوى الاستعلامات
2. تصفية البيانات حسب النطاق المحدد
3. إخفاء الواجهات غير المسموحة
4. تطبيق النطاق في جميع الأقسام

## الاختبار

### سيناريو اختبار أساسي

1. **إنشاء مدير مزرعة:**
   ```sql
   -- في قاعدة البيانات
   UPDATE admins
   SET scope_type = 'farm', role_id = (SELECT id FROM admin_roles WHERE role_key = 'farm_supervisor')
   WHERE email = 'test.farm.manager@olivefarms.test';
   ```

2. **تعيين مزرعة له:**
   ```typescript
   await permissionsService.assignFarmToAdmin(
     adminId,
     farmId,
     currentAdminId,
     'تعيين تجريبي'
   );
   ```

3. **التحقق من scope_value:**
   ```sql
   SELECT scope_type, scope_value FROM admins WHERE id = 'admin_id';
   ```

## الخلاصة

تم تنفيذ نظام نطاق الرؤية (Scope) بنجاح في المرحلة الثانية. النظام الآن:
- يخزن نطاق كل مدير في قاعدة البيانات
- يدعم تعيين المزارع للمديرين
- يحدث النطاق تلقائياً عند إضافة أو حذف تعيينات
- محمي بالكامل بسياسات RLS
- جاهز للمرحلة الثالثة (تطبيق القيود الفعلية)

البناء ناجح ولا توجد أخطاء!
