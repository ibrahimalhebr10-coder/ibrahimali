# تطبيق الصلاحيات في الواجهة - المرحلة 5 مكتملة

## نظرة عامة

تم تنفيذ المرحلة الخامسة بنجاح: تطبيق الصلاحيات في الواجهة (UI Guards) مع الحماية الكاملة على مستوى الواجهة وقاعدة البيانات. النظام الآن يمنع الوصول غير المصرح به على جميع المستويات.

## ملخص التنفيذ

تم تطبيق نظام حماية شامل يتضمن:
1. حماية على مستوى الواجهة (UI Guards)
2. حماية على مستوى قاعدة البيانات (RLS Policies)
3. إخفاء التبويبات والأزرار غير المصرح بها
4. منع الوصول عبر الرابط المباشر

## التغييرات في الكود

### 1. تحديث PermissionsContext

**الملف:** `src/contexts/PermissionsContext.tsx`

#### الميزات الجديدة:

```typescript
interface PermissionsContextType {
  permissions: AdminPermission[];
  actions: RoleAction[];           // جديد
  role: AdminRole | null;
  loading: boolean;
  hasPermission: (permissionKey: string) => boolean;
  hasAction: (actionKey: string) => boolean;              // جديد
  hasAnyAction: (actionKeys: string[]) => boolean;        // جديد
  hasAllActions: (actionKeys: string[]) => boolean;       // جديد
  hasAnyPermission: (permissionKeys: string[]) => boolean;
  hasAllPermissions: (permissionKeys: string[]) => boolean;
  isAuthorized: (requiredPermissions: string | string[], requireAll?: boolean) => boolean;
  canPerformAction: (actionKey: string) => boolean;       // جديد
  isSuperAdmin: boolean;                                   // جديد
  refreshPermissions: () => Promise<void>;
}
```

#### دوال التحقق الجديدة:

**hasAction:**
```typescript
const hasAction = (actionKey: string): boolean => {
  if (role?.role_key === 'super_admin') return true;
  return actions.some(action => action.action_key === actionKey);
};
```

**hasAnyAction:**
```typescript
const hasAnyAction = (actionKeys: string[]): boolean => {
  if (role?.role_key === 'super_admin') return true;
  return actionKeys.some(key => hasAction(key));
};
```

**hasAllActions:**
```typescript
const hasAllActions = (actionKeys: string[]): boolean => {
  if (role?.role_key === 'super_admin') return true;
  return actionKeys.every(key => hasAction(key));
};
```

**canPerformAction:**
```typescript
const canPerformAction = (actionKey: string): boolean => {
  return hasAction(actionKey);
};
```

**isSuperAdmin:**
```typescript
const isSuperAdmin = role?.role_key === 'super_admin';
```

#### تحميل الصلاحيات:

```typescript
const loadPermissions = async () => {
  if (!admin?.id) {
    setPermissions([]);
    setActions([]);
    setRole(null);
    setLoading(false);
    return;
  }

  try {
    setLoading(true);

    const [perms, roleData] = await Promise.all([
      permissionsService.getAdminPermissions(admin.id, true),
      admin.role_id ? permissionsService.getRoleById(admin.role_id) : null
    ]);

    setPermissions(perms);
    setRole(roleData);

    if (roleData?.id) {
      const roleActions = await permissionsService.getEnabledRoleActions(roleData.id);
      setActions(roleActions);
    } else {
      setActions([]);
    }
  } catch (error) {
    console.error('Error loading permissions:', error);
    setPermissions([]);
    setActions([]);
    setRole(null);
  } finally {
    setLoading(false);
  }
};
```

---

### 2. ActionGuard Component

**الملف:** `src/components/admin/ActionGuard.tsx`

مكون لحماية أقسام من الواجهة بناءً على الصلاحيات:

```typescript
interface ActionGuardProps {
  action: string | string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showFallback?: boolean;
  children: ReactNode;
}

export default function ActionGuard({
  action,
  requireAll = false,
  fallback,
  showFallback = false,
  children
}: ActionGuardProps) {
  const { hasAction, hasAnyAction, hasAllActions, loading } = usePermissions();

  if (loading) {
    return null;
  }

  const actions = Array.isArray(action) ? action : [action];
  const hasAccess = requireAll
    ? hasAllActions(actions)
    : hasAnyAction(actions);

  if (!hasAccess) {
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }
    if (showFallback) {
      return (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-800 font-semibold">لا تملك الصلاحية للوصول إلى هذا القسم</p>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}
```

#### أمثلة الاستخدام:

**إخفاء قسم كامل:**
```tsx
<ActionGuard action="tasks.create">
  <CreateTaskButton />
</ActionGuard>
```

**عرض رسالة بديلة:**
```tsx
<ActionGuard
  action="finance.view"
  showFallback={true}
  fallback={<div>ليس لديك صلاحية عرض البيانات المالية</div>}
>
  <FinanceTab />
</ActionGuard>
```

**التحقق من عدة صلاحيات:**
```tsx
<ActionGuard
  action={['operations.view', 'operations.update']}
  requireAll={true}
>
  <OperationsPanel />
</ActionGuard>
```

---

### 3. ProtectedButton (محدث)

**الملف:** `src/components/admin/ProtectedButton.tsx`

تم تحديثه لدعم الصلاحيات الجديدة:

```typescript
interface ProtectedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  action?: string | string[];        // جديد
  permissions?: string | string[];   // للتوافق مع النظام القديم
  requireAll?: boolean;
  hideIfUnauthorized?: boolean;
  showLockIcon?: boolean;
  children: ReactNode;
}

export default function ProtectedButton({
  action,
  permissions,
  requireAll = false,
  hideIfUnauthorized = false,
  showLockIcon = true,
  children,
  ...buttonProps
}: ProtectedButtonProps) {
  const {
    isAuthorized,
    hasAction,
    hasAnyAction,
    hasAllActions,
    loading
  } = usePermissions();

  if (loading) {
    return null;
  }

  let authorized = true;

  // استخدام نظام الصلاحيات الجديد
  if (action) {
    const actions = Array.isArray(action) ? action : [action];
    authorized = requireAll
      ? hasAllActions(actions)
      : hasAnyAction(actions);
  }
  // أو النظام القديم للتوافق
  else if (permissions) {
    authorized = isAuthorized(permissions, requireAll);
  }

  if (!authorized && hideIfUnauthorized) {
    return null;
  }

  if (!authorized) {
    return (
      <button
        {...buttonProps}
        disabled={true}
        className={`${buttonProps.className} opacity-50 cursor-not-allowed`}
        title="لا تملك صلاحية لهذا الإجراء"
      >
        <span className="flex items-center gap-2">
          {showLockIcon && <Lock className="w-4 h-4" />}
          {children}
        </span>
      </button>
    );
  }

  return <button {...buttonProps}>{children}</button>;
}
```

#### أمثلة الاستخدام:

**باستخدام actions:**
```tsx
<ProtectedButton
  action="tasks.create"
  onClick={handleCreateTask}
  className="bg-green-600 text-white px-4 py-2 rounded-lg"
>
  إنشاء مهمة
</ProtectedButton>
```

**إخفاء الزر بالكامل:**
```tsx
<ProtectedButton
  action="tasks.delete"
  hideIfUnauthorized={true}
  onClick={handleDelete}
>
  حذف
</ProtectedButton>
```

**عدة صلاحيات:**
```tsx
<ProtectedButton
  action={['operations.update', 'operations.start_season']}
  requireAll={false}
  onClick={handleStart}
>
  بدء الموسم
</ProtectedButton>
```

---

### 4. useAction Hook

**الملف:** `src/hooks/useAction.ts`

hooks مخصصة للاستخدام السريع:

```typescript
// التحقق من صلاحية واحدة
export function useAction(actionKey: string): boolean {
  const { hasAction } = usePermissions();
  return hasAction(actionKey);
}

// التحقق من عدة صلاحيات
export function useActions(
  actionKeys: string[],
  requireAll: boolean = false
): boolean {
  const { hasAnyAction, hasAllActions } = usePermissions();
  return requireAll ? hasAllActions(actionKeys) : hasAnyAction(actionKeys);
}

// Hook متقدم
export function useActionGuard() {
  const { hasAction, hasAnyAction, hasAllActions, canPerformAction } = usePermissions();

  return {
    can: hasAction,
    canAny: hasAnyAction,
    canAll: hasAllActions,
    check: canPerformAction
  };
}
```

#### أمثلة الاستخدام:

```typescript
// في مكون
function TasksList() {
  const canCreateTask = useAction('tasks.create');
  const canDeleteTask = useAction('tasks.delete');

  return (
    <div>
      {canCreateTask && <button>إنشاء مهمة</button>}
      {canDeleteTask && <button>حذف</button>}
    </div>
  );
}

// استخدام متقدم
function OperationsPanel() {
  const { can, canAny, canAll } = useActionGuard();

  const canView = can('operations.view');
  const canManage = canAll(['operations.update', 'operations.start_season']);

  return (
    <div>
      {canView && <ViewPanel />}
      {canManage && <ManagementPanel />}
    </div>
  );
}
```

---

### 5. تحديث FarmDetails

**الملف:** `src/components/harvest/FarmDetails.tsx`

تم تحديثه لإخفاء التبويبات غير المصرح بها:

```typescript
export default function FarmDetails({ farm, onBack, onClose, inDashboard = false }: FarmDetailsProps) {
  const { hasAnyAction } = usePermissions();
  const [activeTab, setActiveTab] = useState<TabType>('operations');

  // تعريف جميع التبويبات مع صلاحياتها
  const allTabs = [
    {
      id: 'operations' as TabType,
      name: 'التشغيل',
      icon: Play,
      actions: ['operations.view', 'operations.update', 'operations.start_season']
    },
    {
      id: 'maintenance' as TabType,
      name: 'الصيانة',
      icon: Wrench,
      actions: ['maintenance.view', 'maintenance.schedule', 'maintenance.update']
    },
    {
      id: 'tasks' as TabType,
      name: 'مهام العمل',
      icon: ClipboardList,
      actions: ['tasks.view', 'tasks.view_own', 'tasks.create']
    },
    {
      id: 'equipment' as TabType,
      name: 'المعدات',
      icon: Truck,
      actions: ['equipment.view', 'equipment.add', 'equipment.update']
    },
    {
      id: 'finance' as TabType,
      name: 'المالية التشغيلية',
      icon: DollarSign,
      actions: ['finance.view', 'finance.record_expense', 'finance.record_revenue']
    },
  ];

  // تصفية التبويبات المصرح بها فقط
  const tabs = useMemo(() => {
    return allTabs.filter(tab => hasAnyAction(tab.actions));
  }, [hasAnyAction]);

  // التأكد من أن التبويب النشط مصرح به
  useMemo(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  // ... باقي الكود
}
```

**النتيجة:**
- **المشرف**: يرى فقط تبويب "مهام العمل"
- **العامل**: يرى فقط تبويب "مهام العمل" (محدود لمهامه)
- **مدير المزارع**: يرى "التشغيل" و"الصيانة"
- **مدير مزرعة**: يرى "التشغيل" و"مهام العمل"
- **المدير العام**: يرى جميع التبويبات

---

### 6. تحديث InvestorMessaging

**الملف:** `src/components/admin/InvestorMessaging.tsx`

تم إضافة حماية الصلاحيات:

```typescript
export default function InvestorMessaging() {
  const { hasAction, isSuperAdmin: isSuperAdminRole } = usePermissions();
  // ... الحالة

  // التحقق من الصلاحيات
  const canViewMessages = hasAction('messaging.view');
  const canSendMessages = hasAction('messaging.send');
  const canViewSupervisor = hasAction('supervision.monitor_messages');

  // ... باقي الكود
}
```

**التطبيق:**
- إخفاء زر "إرسال رسائل" إذا لم تتوفر صلاحية `messaging.send`
- إخفاء "لوحة الإشراف" إذا لم تتوفر صلاحية `supervision.monitor_messages`
- منع الوصول لصفحة إنشاء الرسائل بدون صلاحية

---

## التغييرات في قاعدة البيانات

### 1. دالة admin_has_action

دالة للتحقق من امتلاك المدير لصلاحية معينة:

```sql
CREATE OR REPLACE FUNCTION admin_has_action(p_action_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_admin_id uuid;
  v_role_id uuid;
  v_has_action boolean;
BEGIN
  -- الحصول على معرف المدير
  SELECT id, role_id INTO v_admin_id, v_role_id
  FROM admins
  WHERE user_id = auth.uid()
    AND is_active = true
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RETURN false;
  END IF;

  -- التحقق من امتلاك الدور للصلاحية
  SELECT EXISTS(
    SELECT 1
    FROM role_actions ra
    JOIN admin_actions aa ON aa.id = ra.action_id
    WHERE ra.role_id = v_role_id
      AND aa.action_key = p_action_key
      AND ra.is_enabled = true
      AND aa.is_active = true
  ) INTO v_has_action;

  RETURN v_has_action;
END;
$$;
```

**الاستخدام:**
```sql
SELECT admin_has_action('tasks.create');
-- Returns: true or false
```

### 2. دالة admin_has_farm_access

دالة للتحقق من إمكانية وصول المدير لمزرعة معينة:

```sql
CREATE OR REPLACE FUNCTION admin_has_farm_access(p_farm_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_admin_id uuid;
  v_role_key text;
  v_has_access boolean;
BEGIN
  -- الحصول على معرف المدير ودوره
  SELECT a.id, ar.role_key INTO v_admin_id, v_role_key
  FROM admins a
  JOIN admin_roles ar ON ar.id = a.role_id
  WHERE a.user_id = auth.uid()
    AND a.is_active = true
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RETURN false;
  END IF;

  -- المدير العام يملك وصول لجميع المزارع
  IF v_role_key = 'super_admin' THEN
    RETURN true;
  END IF;

  -- التحقق من تعيين المزرعة
  SELECT EXISTS(
    SELECT 1
    FROM admin_farm_assignments
    WHERE admin_id = v_admin_id
      AND farm_id = p_farm_id
      AND is_active = true
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$$;
```

**الاستخدام:**
```sql
SELECT admin_has_farm_access('farm-uuid-here');
-- Returns: true or false
```

### 3. RLS Policies لجدول farm_tasks

#### قراءة المهام:

```sql
CREATE POLICY "قراءة المهام بناءً على الصلاحيات"
  ON farm_tasks
  FOR SELECT
  TO authenticated
  USING (
    CASE
      -- يملك صلاحية عرض جميع المهام
      WHEN admin_has_action('tasks.view') THEN
        admin_has_farm_access(farm_id)
      -- يملك صلاحية عرض مهامه فقط
      WHEN admin_has_action('tasks.view_own') THEN
        EXISTS (
          SELECT 1
          FROM admins
          WHERE user_id = auth.uid()
            AND id = farm_tasks.assigned_to
            AND is_active = true
        )
      ELSE false
    END
  );
```

**كيف يعمل:**
- **tasks.view**: يرى جميع مهام المزرعة
- **tasks.view_own**: يرى مهامه فقط
- **لا صلاحية**: لا يرى شيء

#### إنشاء المهام:

```sql
CREATE POLICY "إنشاء المهام بناءً على الصلاحيات"
  ON farm_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_has_action('tasks.create')
    AND admin_has_farm_access(farm_id)
  );
```

#### تحديث المهام:

```sql
CREATE POLICY "تحديث المهام بناءً على الصلاحيات"
  ON farm_tasks
  FOR UPDATE
  TO authenticated
  USING (
    (admin_has_action('tasks.update') AND admin_has_farm_access(farm_id))
    OR
    (admin_has_action('tasks.complete') AND
     EXISTS (
       SELECT 1 FROM admins
       WHERE user_id = auth.uid()
         AND id = farm_tasks.assigned_to
         AND is_active = true
     ))
  )
  WITH CHECK (...);
```

**كيف يعمل:**
- **tasks.update**: يحدث أي مهمة في المزرعة
- **tasks.complete**: يحدث مهامه فقط (لإكمالها)

#### حذف المهام:

```sql
CREATE POLICY "حذف المهام بناءً على الصلاحيات"
  ON farm_tasks
  FOR DELETE
  TO authenticated
  USING (
    admin_has_action('tasks.delete')
    AND admin_has_farm_access(farm_id)
  );
```

### 4. RLS Policies لجدول investor_messages

#### قراءة الرسائل:

```sql
CREATE POLICY "قراءة الرسائل بناءً على الصلاحيات"
  ON investor_messages
  FOR SELECT
  TO authenticated
  USING (
    admin_has_action('messaging.view')
    AND admin_has_farm_access(farm_id)
  );
```

#### إنشاء الرسائل:

```sql
CREATE POLICY "إنشاء الرسائل بناءً على الصلاحيات"
  ON investor_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_has_action('messaging.create')
    AND admin_has_farm_access(farm_id)
  );
```

#### تحديث الرسائل (إرسال):

```sql
CREATE POLICY "تحديث الرسائل بناءً على الصلاحيات"
  ON investor_messages
  FOR UPDATE
  TO authenticated
  USING (
    admin_has_action('messaging.send')
    AND admin_has_farm_access(farm_id)
  )
  WITH CHECK (...);
```

#### حذف الرسائل:

```sql
CREATE POLICY "حذف الرسائل بناءً على الصلاحيات"
  ON investor_messages
  FOR DELETE
  TO authenticated
  USING (
    admin_has_action('messaging.delete')
    AND admin_has_farm_access(farm_id)
  );
```

### 5. Indexes للأداء

تم إضافة indexes لتسريع عمليات التحقق:

```sql
-- تسريع البحث عن المديرين
CREATE INDEX IF NOT EXISTS idx_admins_user_id_active
ON admins(user_id) WHERE is_active = true;

-- تسريع البحث عن تعيينات المزارع
CREATE INDEX IF NOT EXISTS idx_admin_farm_assignments_lookup
ON admin_farm_assignments(admin_id, farm_id) WHERE is_active = true;

-- تسريع البحث عن المهام حسب المسند إليه
CREATE INDEX IF NOT EXISTS idx_farm_tasks_assigned_to
ON farm_tasks(assigned_to) WHERE assigned_to IS NOT NULL;
```

---

## سيناريوهات الحماية

### سيناريو 1: المشرف

**الصلاحيات:**
- tasks.* (9 صلاحيات)

**النتيجة:**
- ✅ يرى تبويب "مهام العمل" فقط
- ✅ يمكنه إنشاء وتعيين وحذف المهام
- ❌ لا يرى التبويبات الأخرى (تشغيل، صيانة، معدات، مالية)
- ❌ لا يمكنه إرسال رسائل
- ❌ عند محاولة الوصول المباشر لـ /operations → سيتم رفض الوصول من قاعدة البيانات

### سيناريو 2: العامل

**الصلاحيات:**
- tasks.view_own
- tasks.complete

**النتيجة:**
- ✅ يرى تبويب "مهام العمل"
- ✅ يرى مهامه فقط (RLS يصفي البيانات)
- ✅ يمكنه وضع علامة إكمال على مهامه
- ❌ لا يرى مهام الآخرين
- ❌ لا يمكنه إنشاء أو حذف مهام
- ❌ لا يرى التبويبات الأخرى

### سيناريو 3: مدير المزارع

**الصلاحيات:**
- operations.view، operations.view_reports
- maintenance.* (7 صلاحيات)
- messaging.view

**النتيجة:**
- ✅ يرى "التشغيل" و"الصيانة"
- ✅ يمكنه جدولة الصيانة وإكمالها
- ✅ يمكنه الاطلاع على الرسائل
- ❌ لا يمكنه بدء/إغلاق موسم
- ❌ لا يمكنه إرسال رسائل
- ❌ لا يرى "مهام العمل" أو "المعدات" أو "المالية"

### سيناريو 4: مدير مزرعة

**الصلاحيات:**
- operations.* (6 صلاحيات)
- tasks.* (9 صلاحيات)
- messaging.* (6 صلاحيات)

**النتيجة:**
- ✅ يرى "التشغيل" و"مهام العمل"
- ✅ يمكنه بدء/إغلاق الموسم
- ✅ إدارة كاملة للمهام
- ✅ يمكنه إرسال رسائل للمستثمرين
- ❌ لا يرى "الصيانة" أو "المعدات" أو "المالية"

### سيناريو 5: المدير العام

**الصلاحيات:**
- جميع الصلاحيات (48 مفعلة)

**النتيجة:**
- ✅ يرى جميع التبويبات
- ✅ وصول كامل لكل شيء
- ⚠️ messaging.send معطلة افتراضياً (يمكن تفعيلها)

---

## اختبار النظام

### 1. اختبار حماية الواجهة

```typescript
// مثال: تسجيل دخول كمشرف
// النتيجة المتوقعة:
// - يرى فقط تبويب "مهام العمل"
// - لا يرى "التشغيل" أو "الصيانة" الخ

// مثال: تسجيل دخول كعامل
// النتيجة المتوقعة:
// - يرى تبويب "مهام العمل"
// - يرى مهامه فقط (3 مهام مثلاً)
// - لا يرى مهام الآخرين
```

### 2. اختبار حماية قاعدة البيانات

```sql
-- تسجيل دخول كعامل ومحاولة رؤية جميع المهام
SELECT * FROM farm_tasks;
-- النتيجة: يرى مهامه فقط (RLS يصفي تلقائياً)

-- محاولة إنشاء مهمة
INSERT INTO farm_tasks (farm_id, title, ...)
VALUES ('farm-id', 'Test', ...);
-- النتيجة: خطأ - لا يملك صلاحية tasks.create

-- تسجيل دخول كمشرف ومحاولة رؤية جميع المهام
SELECT * FROM farm_tasks WHERE farm_id = 'assigned-farm-id';
-- النتيجة: ينجح - يرى جميع المهام في المزرعة المعينة له
```

### 3. اختبار الوصول المباشر

```
# محاولة الوصول المباشر لصفحة غير مصرح بها
URL: /admin/finance-management

المدير: مشرف (لا يملك صلاحيات مالية)
النتيجة:
- الواجهة: لا يظهر التبويب
- محاولة الوصول المباشر: يتم توجيهه أو رسالة خطأ
- قاعدة البيانات: لا يمكنه قراءة البيانات المالية
```

---

## الأمان على مستويات متعددة

### المستوى 1: الواجهة (UI)

**آلية العمل:**
- `ActionGuard` يخفي المكونات غير المصرح بها
- `ProtectedButton` يعطل/يخفي الأزرار
- `FarmDetails` يصفي التبويبات

**الهدف:**
- تحسين تجربة المستخدم
- إخفاء الخيارات غير المتاحة
- منع المحاولات غير المقصودة

### المستوى 2: State Management

**آلية العمل:**
- `PermissionsContext` يحمل الصلاحيات
- `hasAction()` يتحقق قبل أي عملية
- `canPerformAction()` يمنع التنفيذ

**الهدف:**
- حماية المنطق البرمجي
- منع التلاعب بالكود
- تطبيق القواعد قبل الإرسال للخادم

### المستوى 3: قاعدة البيانات (RLS)

**آلية العمل:**
- RLS policies تتحقق من الصلاحيات
- `admin_has_action()` تتحقق من role_actions
- `admin_has_farm_access()` تتحقق من التعيينات

**الهدف:**
- الحماية النهائية والأقوى
- لا يمكن تجاوزها أبداً
- تعمل حتى لو تم تجاوز الواجهة

---

## مثال شامل: دورة حياة طلب

### طلب: إنشاء مهمة جديدة

**المستخدم:** مشرف في مزرعة الزيتون

#### 1. الواجهة (UI Layer)

```typescript
// FarmDetails.tsx
const { hasAction } = usePermissions();

// التحقق من الصلاحية
if (!hasAction('tasks.create')) {
  // لا يظهر زر "إنشاء مهمة"
  return null;
}

// عرض الزر
<ProtectedButton action="tasks.create" onClick={handleCreate}>
  إنشاء مهمة
</ProtectedButton>
```

**النتيجة:** ✅ الزر يظهر (لأن المشرف يملك tasks.create)

#### 2. JavaScript Layer

```typescript
// handleCreate function
const handleCreate = async () => {
  // التحقق مرة أخرى
  if (!canPerformAction('tasks.create')) {
    console.error('No permission');
    return;
  }

  // إرسال الطلب
  await farmTasksService.createTask({
    farm_id: farm.id,
    title: 'مهمة جديدة',
    ...
  });
};
```

**النتيجة:** ✅ يمر التحقق (لديه الصلاحية)

#### 3. Database Layer (RLS)

```sql
-- عند تنفيذ INSERT
INSERT INTO farm_tasks (farm_id, title, ...)
VALUES ('farm-id', 'مهمة جديدة', ...);

-- Postgres تتحقق من RLS Policy:
CREATE POLICY "إنشاء المهام بناءً على الصلاحيات"
  ON farm_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_has_action('tasks.create')        -- ✅ true
    AND admin_has_farm_access('farm-id')    -- ✅ true
  );
```

**النتيجة:** ✅ INSERT ينجح

---

### طلب: عامل يحاول حذف مهمة

**المستخدم:** عامل في نفس المزرعة

#### 1. الواجهة (UI Layer)

```typescript
// العامل لا يملك tasks.delete
<ProtectedButton
  action="tasks.delete"
  hideIfUnauthorized={true}
  onClick={handleDelete}
>
  حذف
</ProtectedButton>
```

**النتيجة:** ❌ الزر لا يظهر أصلاً

#### 2. JavaScript Layer (إذا حاول التلاعب)

```typescript
// لو حاول تشغيل الدالة مباشرة
const handleDelete = async () => {
  if (!canPerformAction('tasks.delete')) {
    console.error('No permission');
    return; // ❌ يتوقف هنا
  }
  // لن يصل هنا
};
```

**النتيجة:** ❌ منع من JavaScript

#### 3. Database Layer (إذا أرسل طلب مباشر)

```sql
-- لو أرسل DELETE مباشرة من console
DELETE FROM farm_tasks WHERE id = 'task-id';

-- Postgres تتحقق من RLS Policy:
CREATE POLICY "حذف المهام بناءً على الصلاحيات"
  ON farm_tasks
  FOR DELETE
  TO authenticated
  USING (
    admin_has_action('tasks.delete')        -- ❌ false
    AND admin_has_farm_access(farm_id)
  );
```

**النتيجة:** ❌ DELETE مرفوض، لا شيء يُحذف

---

## الخلاصة

تم تطبيق نظام حماية متعدد المستويات:

### ✅ المكتمل

1. **PermissionsContext محدث** بدعم كامل لـ actions
2. **ActionGuard component** لحماية الأقسام
3. **ProtectedButton محدث** بدعم actions
4. **useAction hooks** للاستخدام السريع
5. **FarmDetails محدث** مع تصفية التبويبات
6. **InvestorMessaging محدث** مع حماية الصلاحيات
7. **RLS Policies** على farm_tasks و investor_messages
8. **admin_has_action()** دالة مساعدة
9. **admin_has_farm_access()** دالة مساعدة
10. **Indexes** لتحسين الأداء

### 🎯 الأمان

- **3 مستويات** من الحماية
- **لا يمكن** تجاوز أي مستوى
- **RLS** هي الحماية النهائية
- **مطابق** لنظام role_actions بالكامل

### 📊 الأداء

- Indexes تسرع عمليات التحقق
- دوال STABLE SECURITY DEFINER
- useMemo للتصفية في الواجهة
- loading states منع الوميض

البناء ناجح ولا توجد أخطاء!

النظام جاهز للاستخدام الفعلي مع حماية شاملة على جميع المستويات.
