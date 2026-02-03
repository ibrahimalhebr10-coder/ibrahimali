# دليل المطور لنظام الهويات المزدوجة

## Developer Guide - Dual Identity System

---

## نظرة عامة

هذا الدليل موجه للمطورين الذين يريدون فهم أو تعديل نظام الهويات المزدوجة.

---

## البنية التقنية

### 1. Database Schema

```sql
-- user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  email text,
  phone text,
  primary_identity text CHECK (
    primary_identity IN ('agricultural', 'investment')
  ) DEFAULT 'agricultural',
  secondary_identity text CHECK (
    secondary_identity IN ('agricultural', 'investment')
  ),
  secondary_identity_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**القواعد:**
- `primary_identity`: الهوية الحالية النشطة
- `secondary_identity`: الهوية الاحتياطية (nullable)
- `secondary_identity_enabled`: هل الهوية الثانية مفعّلة؟
- الهوية الثانية يجب أن تكون مختلفة عن الأساسية

---

### 2. IdentityService API

**الموقع:** `src/services/identityService.ts`

#### Types:
```typescript
export type IdentityType = 'agricultural' | 'investment';

export interface UserIdentity {
  userId: string;
  primaryIdentity: IdentityType;
  secondaryIdentity: IdentityType | null;
  secondaryIdentityEnabled: boolean;
}
```

#### Methods:

##### getUserIdentity()
```typescript
async getUserIdentity(userId: string): Promise<UserIdentity | null>
```
الحصول على معلومات هوية المستخدم من قاعدة البيانات.

**Example:**
```typescript
const identity = await identityService.getUserIdentity(userId);
console.log(identity.primaryIdentity); // 'agricultural'
console.log(identity.secondaryIdentity); // 'investment' or null
```

##### enableSecondaryIdentity()
```typescript
async enableSecondaryIdentity(
  userId: string,
  secondaryIdentity: IdentityType
): Promise<boolean>
```
تفعيل الهوية الثانية للمستخدم.

**Example:**
```typescript
const success = await identityService.enableSecondaryIdentity(
  userId,
  'investment'
);

if (success) {
  console.log('Secondary identity enabled!');
}
```

**Validation:**
- يتحقق أن الهوية الثانية مختلفة عن الأساسية
- يضبط `secondary_identity_enabled` إلى `true`

##### disableSecondaryIdentity()
```typescript
async disableSecondaryIdentity(userId: string): Promise<boolean>
```
تعطيل الهوية الثانية (تضبطها إلى null).

**Example:**
```typescript
await identityService.disableSecondaryIdentity(userId);
// secondary_identity = null
// secondary_identity_enabled = false
```

##### switchIdentities()
```typescript
async switchIdentities(userId: string): Promise<boolean>
```
التبديل بين الهوية الأساسية والثانية.

**Example:**
```typescript
// Before: primary='agricultural', secondary='investment'
await identityService.switchIdentities(userId);
// After: primary='investment', secondary='agricultural'
```

**Logic:**
```typescript
// تبديل القيم في قاعدة البيانات
UPDATE user_profiles
SET
  primary_identity = secondary_identity,
  secondary_identity = primary_identity
WHERE id = userId;
```

##### Helper Methods:
```typescript
getIdentityLabel(identity: IdentityType): string
// 'agricultural' → 'مزارع'
// 'investment' → 'مستثمر'

getIdentityColor(identity: IdentityType): string
// 'agricultural' → '#3aa17e' (green)
// 'investment' → '#d4af37' (gold)

getIdentityDescription(identity: IdentityType): string
// 'agricultural' → 'أنت في رحلة زراعية'
// 'investment' → 'أنت في رحلة استثمارية'
```

---

### 3. AuthContext Integration

**الموقع:** `src/contexts/AuthContext.tsx`

#### State:
```typescript
const [identity, setIdentity] = useState<IdentityType>('agricultural');
const [secondaryIdentity, setSecondaryIdentity] = useState<IdentityType | null>(null);
const [secondaryIdentityEnabled, setSecondaryIdentityEnabled] = useState(false);
```

#### Context Value:
```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  identity: IdentityType;
  identityLoading: boolean;
  secondaryIdentity: IdentityType | null;
  secondaryIdentityEnabled: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateIdentity: (newIdentity: IdentityType) => Promise<boolean>;
  enableSecondaryIdentity: (identity: IdentityType) => Promise<boolean>;
  switchToSecondaryIdentity: () => Promise<boolean>;
  disableSecondaryIdentity: () => Promise<boolean>;
}
```

#### Methods:

##### enableSecondaryIdentity()
```typescript
const enableSecondaryIdentity = async (
  newSecondaryIdentity: IdentityType
): Promise<boolean> => {
  if (!user) return false;

  const success = await identityService.enableSecondaryIdentity(
    user.id,
    newSecondaryIdentity
  );

  if (success) {
    setSecondaryIdentity(newSecondaryIdentity);
    setSecondaryIdentityEnabled(true);
    return true;
  }

  return false;
};
```

##### switchToSecondaryIdentity()
```typescript
const switchToSecondaryIdentity = async (): Promise<boolean> => {
  if (!user || !secondaryIdentity || !secondaryIdentityEnabled) {
    return false;
  }

  const success = await identityService.switchIdentities(user.id);

  if (success) {
    // Swap in state
    const temp = identity;
    setIdentity(secondaryIdentity);
    setSecondaryIdentity(temp);
    localStorage.setItem('appMode', secondaryIdentity);
    return true;
  }

  return false;
};
```

##### disableSecondaryIdentity()
```typescript
const disableSecondaryIdentity = async (): Promise<boolean> => {
  if (!user) return false;

  const success = await identityService.disableSecondaryIdentity(user.id);

  if (success) {
    setSecondaryIdentity(null);
    setSecondaryIdentityEnabled(false);
    return true;
  }

  return false;
};
```

#### Auto-loading:
```typescript
useEffect(() => {
  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // تحميل الهوية من قاعدة البيانات
        await loadIdentity(session.user.id);
      }
    }
  );

  return () => {
    authListener.subscription.unsubscribe();
  };
}, []);
```

---

### 4. UI Components

#### IdentitySwitcher Component

**الموقع:** `src/components/IdentitySwitcher.tsx`

**Purpose:** زر عائم للتبديل السريع بين الهويات

**Usage:**
```typescript
import IdentitySwitcher from './components/IdentitySwitcher';

// في App.tsx
<IdentitySwitcher />
```

**Visibility Logic:**
```typescript
if (!user || !secondaryIdentity || !secondaryIdentityEnabled) {
  return null; // مخفي
}
return <button>...</button>; // ظاهر
```

**Styling:**
```typescript
const primaryColor = identityService.getIdentityColor(identity);
const secondaryColor = identityService.getIdentityColor(secondaryIdentity);

// Gradient background
background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
```

**Position:**
```css
position: fixed;
bottom: 6rem; /* 24px */
left: 1rem; /* 16px */
z-index: 40;
```

---

#### IdentityManager Component

**الموقع:** `src/components/IdentityManager.tsx`

**Purpose:** واجهة كاملة لإدارة الهويات في حساب المستخدم

**Usage:**
```typescript
import IdentityManager from './components/IdentityManager';

// في AccountProfile.tsx
<IdentityManager />
```

**Features:**
- عرض الهوية الأساسية (بطاقة)
- عرض الهوية الثانية (إذا كانت مفعّلة)
- زر لإضافة الهوية الثانية
- زر للتبديل بين الهويات
- زر لتعطيل الهوية الثانية
- شرح توضيحي

**State Management:**
```typescript
const [isProcessing, setIsProcessing] = useState(false);
const [showEnableOptions, setShowEnableOptions] = useState(false);
```

---

## كيفية الاستخدام في كودك

### Example 1: الحصول على الهوية الحالية
```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { identity, secondaryIdentity, secondaryIdentityEnabled } = useAuth();

  console.log('Current identity:', identity);
  console.log('Has secondary?', secondaryIdentityEnabled);

  return (
    <div>
      <p>أنت الآن: {identity === 'agricultural' ? 'مزارع' : 'مستثمر'}</p>
    </div>
  );
}
```

### Example 2: تفعيل الهوية الثانية برمجياً
```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { enableSecondaryIdentity } = useAuth();

  const handleEnable = async () => {
    const success = await enableSecondaryIdentity('investment');

    if (success) {
      alert('تم تفعيل الهوية الثانية!');
    } else {
      alert('فشل التفعيل');
    }
  };

  return <button onClick={handleEnable}>تفعيل هوية المستثمر</button>;
}
```

### Example 3: التبديل برمجياً
```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { switchToSecondaryIdentity, secondaryIdentityEnabled } = useAuth();

  const handleSwitch = async () => {
    if (!secondaryIdentityEnabled) {
      alert('يجب تفعيل الهوية الثانية أولاً');
      return;
    }

    const success = await switchToSecondaryIdentity();

    if (success) {
      alert('تم التبديل بنجاح!');
    }
  };

  return <button onClick={handleSwitch}>تبديل الهوية</button>;
}
```

### Example 4: إظهار محتوى مختلف حسب الهوية
```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { identity } = useAuth();

  if (identity === 'agricultural') {
    return <AgriculturalDashboard />;
  }

  return <InvestmentDashboard />;
}
```

### Example 5: التحقق من الهوية الثانية
```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, secondaryIdentity, secondaryIdentityEnabled } = useAuth();

  const hasSecondary = user && secondaryIdentity && secondaryIdentityEnabled;

  return (
    <div>
      {hasSecondary ? (
        <p>لديك هوية ثانية: {secondaryIdentity}</p>
      ) : (
        <p>ليس لديك هوية ثانية</p>
      )}
    </div>
  );
}
```

---

## Database Queries

### Query 1: عرض المستخدمين مع الهويات
```sql
SELECT
  id,
  full_name,
  email,
  primary_identity,
  secondary_identity,
  secondary_identity_enabled,
  created_at
FROM user_profiles
ORDER BY created_at DESC;
```

### Query 2: المستخدمون مع هوية ثانية فقط
```sql
SELECT
  id,
  full_name,
  primary_identity,
  secondary_identity
FROM user_profiles
WHERE secondary_identity IS NOT NULL
  AND secondary_identity_enabled = true;
```

### Query 3: إحصائيات الهويات
```sql
SELECT
  primary_identity,
  COUNT(*) as count
FROM user_profiles
GROUP BY primary_identity;

SELECT
  secondary_identity,
  COUNT(*) as count
FROM user_profiles
WHERE secondary_identity IS NOT NULL
GROUP BY secondary_identity;
```

### Query 4: تفعيل يدوي للاختبار
```sql
-- تفعيل الهوية الثانية لمستخدم
UPDATE user_profiles
SET
  secondary_identity = 'investment',
  secondary_identity_enabled = true
WHERE id = 'user-uuid-here';
```

### Query 5: تبديل يدوي للاختبار
```sql
-- تبديل الهويات
UPDATE user_profiles
SET
  primary_identity = 'investment',
  secondary_identity = 'agricultural'
WHERE id = 'user-uuid-here'
  AND secondary_identity = 'investment';
```

---

## Testing

### Unit Tests (مثال)

```typescript
// identityService.test.ts
describe('identityService', () => {
  test('enableSecondaryIdentity - success', async () => {
    const userId = 'test-user-id';
    const result = await identityService.enableSecondaryIdentity(
      userId,
      'investment'
    );

    expect(result).toBe(true);
  });

  test('enableSecondaryIdentity - same as primary', async () => {
    const userId = 'test-user-id';
    // User has primary_identity = 'agricultural'

    const result = await identityService.enableSecondaryIdentity(
      userId,
      'agricultural'
    );

    expect(result).toBe(false);
  });

  test('switchIdentities - success', async () => {
    const userId = 'test-user-id';
    const result = await identityService.switchIdentities(userId);

    expect(result).toBe(true);

    // Verify in database
    const identity = await identityService.getUserIdentity(userId);
    expect(identity.primaryIdentity).toBe('investment');
    expect(identity.secondaryIdentity).toBe('agricultural');
  });
});
```

### Integration Tests

```typescript
// AuthContext.test.tsx
describe('AuthContext', () => {
  test('enableSecondaryIdentity updates state', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.enableSecondaryIdentity('investment');
    });

    expect(result.current.secondaryIdentity).toBe('investment');
    expect(result.current.secondaryIdentityEnabled).toBe(true);
  });

  test('switchToSecondaryIdentity swaps identities', async () => {
    const { result } = renderHook(() => useAuth());

    // Setup
    await act(async () => {
      await result.current.enableSecondaryIdentity('investment');
    });

    const oldPrimary = result.current.identity;
    const oldSecondary = result.current.secondaryIdentity;

    // Switch
    await act(async () => {
      await result.current.switchToSecondaryIdentity();
    });

    expect(result.current.identity).toBe(oldSecondary);
    expect(result.current.secondaryIdentity).toBe(oldPrimary);
  });
});
```

---

## Performance Considerations

### 1. Database Queries
```typescript
// ✅ Good - Single query
const identity = await identityService.getUserIdentity(userId);

// ❌ Bad - Multiple queries
const primary = await getPrimaryIdentity(userId);
const secondary = await getSecondaryIdentity(userId);
const enabled = await isSecondaryEnabled(userId);
```

### 2. State Updates
```typescript
// ✅ Good - Optimistic UI
setSecondaryIdentity(newIdentity); // Update UI immediately
await identityService.enableSecondaryIdentity(userId, newIdentity);

// ❌ Bad - Wait for response
await identityService.enableSecondaryIdentity(userId, newIdentity);
setSecondaryIdentity(newIdentity); // UI updates late
```

### 3. localStorage Sync
```typescript
// تحديث localStorage عند التبديل
localStorage.setItem('appMode', newIdentity);

// يُستخدم للزوار (غير المسجلين) وكنسخة احتياطية
```

---

## Security Considerations

### 1. RLS Policies
```sql
-- يمكن للمستخدم قراءة وتعديل هويته فقط
CREATE POLICY "Users can update their own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### 2. Validation
```typescript
// في identityService
if (secondaryIdentity === identity.primaryIdentity) {
  // منع جعل الهوية الثانية مماثلة للأساسية
  return false;
}
```

### 3. Authentication
```typescript
// في useAuth
if (!user) {
  // لا يمكن التبديل بدون تسجيل دخول
  return false;
}
```

---

## Troubleshooting

### Problem 1: زر التبديل لا يظهر
```typescript
// Check:
console.log('user:', user); // يجب أن لا يكون null
console.log('secondaryIdentity:', secondaryIdentity); // يجب أن لا يكون null
console.log('secondaryIdentityEnabled:', secondaryIdentityEnabled); // يجب أن يكون true

// Solution:
await enableSecondaryIdentity('investment');
```

### Problem 2: التبديل لا يعمل
```typescript
// Check database:
SELECT primary_identity, secondary_identity, secondary_identity_enabled
FROM user_profiles
WHERE id = 'user-id';

// Verify state:
console.log('identity:', identity);
console.log('secondaryIdentity:', secondaryIdentity);

// Check for errors:
const success = await switchToSecondaryIdentity();
console.log('Switch success:', success);
```

### Problem 3: البيانات لا تُحفظ
```typescript
// Check RLS policies
// Verify user authentication
// Check network errors in console
```

---

## Best Practices

### 1. Always check user authentication
```typescript
if (!user) {
  return <LoginPrompt />;
}
```

### 2. Handle loading states
```typescript
const { identityLoading } = useAuth();

if (identityLoading) {
  return <Spinner />;
}
```

### 3. Provide user feedback
```typescript
const [isProcessing, setIsProcessing] = useState(false);

const handleSwitch = async () => {
  setIsProcessing(true);
  try {
    await switchToSecondaryIdentity();
    toast.success('تم التبديل بنجاح');
  } catch (error) {
    toast.error('فشل التبديل');
  } finally {
    setIsProcessing(false);
  }
};
```

### 4. Validate before operations
```typescript
if (!secondaryIdentityEnabled) {
  alert('يجب تفعيل الهوية الثانية أولاً');
  return;
}
```

---

## API Reference Summary

### identityService
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getUserIdentity` | `userId: string` | `Promise<UserIdentity \| null>` | Get user identity |
| `enableSecondaryIdentity` | `userId: string, identity: IdentityType` | `Promise<boolean>` | Enable secondary |
| `disableSecondaryIdentity` | `userId: string` | `Promise<boolean>` | Disable secondary |
| `switchIdentities` | `userId: string` | `Promise<boolean>` | Switch identities |
| `getIdentityLabel` | `identity: IdentityType` | `string` | Get label |
| `getIdentityColor` | `identity: IdentityType` | `string` | Get color |

### useAuth Hook
| Property/Method | Type | Description |
|----------------|------|-------------|
| `identity` | `IdentityType` | Current identity |
| `secondaryIdentity` | `IdentityType \| null` | Secondary identity |
| `secondaryIdentityEnabled` | `boolean` | Is secondary enabled? |
| `enableSecondaryIdentity` | `(identity: IdentityType) => Promise<boolean>` | Enable secondary |
| `switchToSecondaryIdentity` | `() => Promise<boolean>` | Switch identities |
| `disableSecondaryIdentity` | `() => Promise<boolean>` | Disable secondary |

---

## Conclusion

نظام الهويات المزدوجة مصمم ليكون:
- بسيط الاستخدام
- آمن ومحمي
- سريع وفعّال
- سهل الصيانة

للأسئلة أو المشاكل، راجع الملفات التالية:
- `DUAL_IDENTITY_SYSTEM_FINAL_REPORT.md`
- `HOW_TO_USE_DUAL_IDENTITY.md`
- وثائق المراحل (PHASE_*.md)
