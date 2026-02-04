# دليل استخدام Demo Mode للمطورين

## نظرة سريعة

Demo Mode يسمح للزوار بتجربة المنصة بدون تسجيل. هذا الدليل يشرح كيفية استخدام النظام في أي مكون جديد.

---

## البداية السريعة

### 1. استيراد Context

```typescript
import { useDemoMode } from '../contexts/DemoModeContext';
```

### 2. استخدام Hook

```typescript
function MyComponent() {
  const { isDemoMode, demoType } = useDemoMode();

  // الآن يمكنك استخدام isDemoMode في أي مكان
}
```

---

## الاستخدامات الشائعة

### ✅ تحميل البيانات

```typescript
const loadData = async () => {
  if (isDemoMode) {
    // استخدام بيانات وهمية
    const demoData = demoType === 'green'
      ? getDemoGreenTreesData()
      : getDemoGoldenTreesData();
    setData(demoData);
    return;
  }

  // تحميل بيانات حقيقية من API
  const realData = await fetchFromSupabase();
  setData(realData);
};
```

### ✅ معالجة الإجراءات

```typescript
const handleAction = () => {
  if (isDemoMode) {
    // عرض modal للتسجيل
    setShowDemoActionModal(true);
    return;
  }

  // تنفيذ الإجراء الفعلي
  await executeRealAction();
};
```

### ✅ عرض UI مختلف

```typescript
{isDemoMode ? (
  <div className="demo-badge">تجربة توضيحية</div>
) : (
  <div className="live-badge">حساب حقيقي</div>
)}
```

### ✅ تغيير الألوان

```typescript
const color = isDemoMode
  ? (demoType === 'green' ? '#3aa17e' : '#d4af37')
  : userSettings.color;
```

---

## إضافة Demo Mode لمكون جديد

### مثال: مكون "MyHarvest"

```typescript
import React, { useState, useEffect } from 'react';
import { useDemoMode } from '../contexts/DemoModeContext';
import { getDemoGreenTreesData } from '../services/demoDataService';
import DemoActionModal from './DemoActionModal';

interface MyHarvestProps {
  onShowAuth?: (mode: 'login' | 'register') => void;
}

export default function MyHarvest({ onShowAuth }: MyHarvestProps) {
  const { isDemoMode, demoType } = useDemoMode();
  const [harvests, setHarvests] = useState([]);
  const [showDemoActionModal, setShowDemoActionModal] = useState(false);

  useEffect(() => {
    loadHarvests();
  }, [isDemoMode]);

  const loadHarvests = async () => {
    if (isDemoMode) {
      const demoData = getDemoGreenTreesData();
      setHarvests(demoData.harvests || []);
      return;
    }

    const data = await fetchHarvestsFromAPI();
    setHarvests(data);
  };

  const handleRequestHarvest = () => {
    if (isDemoMode) {
      setShowDemoActionModal(true);
      return;
    }

    // تنفيذ طلب الحصاد الفعلي
    submitHarvestRequest();
  };

  return (
    <div>
      {/* UI الخاص بك */}

      <button onClick={handleRequestHarvest}>
        طلب حصاد
      </button>

      {showDemoActionModal && (
        <DemoActionModal
          onClose={() => setShowDemoActionModal(false)}
          onLogin={() => {
            setShowDemoActionModal(false);
            if (onShowAuth) onShowAuth('login');
          }}
          onRegister={() => {
            setShowDemoActionModal(false);
            if (onShowAuth) onShowAuth('register');
          }}
        />
      )}
    </div>
  );
}
```

---

## البيانات الوهمية

### إضافة بيانات جديدة

في `src/services/demoDataService.ts`:

```typescript
export const getDemoHarvestsData = () => {
  return {
    farmName: 'مزرعة الياسمين التجريبية',
    harvests: [
      {
        id: 'demo-h1',
        date: '2024-03-15',
        quantity: 500,
        quality: 'ممتاز',
        value: 12500,
        status: 'completed'
      },
      // المزيد من البيانات...
    ]
  };
};
```

### استخدامها

```typescript
import { getDemoHarvestsData } from '../services/demoDataService';

if (isDemoMode) {
  const demoData = getDemoHarvestsData();
  // استخدام البيانات...
}
```

---

## Best Practices

### ✅ DO: افعل

1. **تحقق من Demo Mode دائماً قبل API calls**
   ```typescript
   if (isDemoMode) {
     return demoData;
   }
   await apiCall();
   ```

2. **استخدم DemoActionModal للإجراءات الحقيقية**
   ```typescript
   if (isDemoMode) {
     setShowDemoActionModal(true);
     return;
   }
   ```

3. **وفر بيانات Demo واقعية**
   ```typescript
   // ✅ Good
   { name: 'مزرعة الياسمين', trees: 25 }

   // ❌ Bad
   { name: 'Test Farm', trees: 999 }
   ```

4. **احترم نوع Demo (green/golden)**
   ```typescript
   const color = demoType === 'green' ? greenColor : goldenColor;
   ```

### ❌ DON'T: لا تفعل

1. **لا تنفذ إجراءات فعلية في Demo Mode**
   ```typescript
   // ❌ Bad
   await saveToDatabase();

   // ✅ Good
   if (isDemoMode) return;
   await saveToDatabase();
   ```

2. **لا تعرض معلومات مربكة**
   ```typescript
   // ❌ Bad
   "Demo Mode - Fake Data - Not Real"

   // ✅ Good
   "تجربة توضيحية" (badge صغير)
   ```

3. **لا تخلط البيانات الحقيقية والوهمية**
   ```typescript
   // ❌ Bad
   const data = [...realData, ...demoData];

   // ✅ Good
   const data = isDemoMode ? demoData : realData;
   ```

---

## الاختبار

### اختبار مكونك

```typescript
// 1. اختبار Demo Mode
- افتح بدون تسجيل دخول
- اضغط زر "أشجاري"
- تأكد من عرض البيانات الوهمية
- حاول تنفيذ إجراء
- تأكد من ظهور DemoActionModal

// 2. اختبار Real Mode
- سجل دخول
- افتح نفس المكون
- تأكد من عرض البيانات الحقيقية
- نفذ إجراء
- تأكد من تنفيذه فعلياً
```

---

## الأمان

### Frontend Guard

```typescript
// في كل handler للإجراءات الحقيقية
const handleSave = async () => {
  if (isDemoMode) {
    setShowDemoActionModal(true);
    return; // ⚠️ IMPORTANT: return فوراً
  }

  await saveToDatabase();
};
```

### Backend Guard (TODO)

```typescript
// في edge functions
if (request.headers['x-demo-mode'] === 'true') {
  throw new Error('Demo mode: action not allowed');
}
```

---

## الأسئلة الشائعة

### س: متى أستخدم DemoActionModal؟

**ج:** عند أي إجراء يغير البيانات:
- ✅ سداد، حفظ، تحديث، حذف
- ✅ طلب، تأكيد، إرسال
- ❌ عرض، قراءة، تصفح

### س: هل أحتاج لإضافة Demo Mode في كل مكون؟

**ج:** لا، فقط المكونات التي:
1. تحمل بيانات من API
2. تنفذ إجراءات (save, update, delete)
3. تعرض للزوار غير المسجلين

### س: كيف أعرف إذا كنت في Demo Mode؟

**ج:**
```typescript
const { isDemoMode } = useDemoMode();
console.log('Demo Mode:', isDemoMode);
```

### س: ماذا لو نسيت التحقق من isDemoMode؟

**ج:** الزائر قد يحاول تنفيذ إجراء حقيقي. لذلك:
1. Frontend: DemoActionModal يمنع التنفيذ
2. Backend: (TODO) يجب رفض الطلب

---

## مثال كامل: مكون معقد

```typescript
import React, { useState, useEffect } from 'react';
import { useDemoMode } from '../contexts/DemoModeContext';
import { useAuth } from '../contexts/AuthContext';
import { getDemoGreenTreesData } from '../services/demoDataService';
import DemoActionModal from './DemoActionModal';

interface ComplexComponentProps {
  farmId: string;
  onShowAuth?: (mode: 'login' | 'register') => void;
}

export default function ComplexComponent({
  farmId,
  onShowAuth
}: ComplexComponentProps) {
  const { user } = useAuth();
  const { isDemoMode, demoType } = useDemoMode();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDemoActionModal, setShowDemoActionModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [isDemoMode, farmId]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (isDemoMode) {
        // Demo: بيانات وهمية
        const demoData = demoType === 'green'
          ? getDemoGreenTreesData()
          : getDemoGoldenTreesData();

        setData(demoData);
        setLoading(false);
        return;
      }

      // Real: بيانات حقيقية
      const response = await fetch(`/api/data/${farmId}`);
      const realData = await response.json();
      setData(realData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newData: any) => {
    if (isDemoMode) {
      setShowDemoActionModal(true);
      return;
    }

    try {
      await fetch(`/api/data/${farmId}`, {
        method: 'PUT',
        body: JSON.stringify(newData)
      });
      alert('تم الحفظ بنجاح');
      loadData();
    } catch (error) {
      alert('خطأ في الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if (isDemoMode) {
      setShowDemoActionModal(true);
      return;
    }

    if (!confirm('هل أنت متأكد؟')) return;

    try {
      await fetch(`/api/data/${id}`, { method: 'DELETE' });
      alert('تم الحذف بنجاح');
      loadData();
    } catch (error) {
      alert('خطأ في الحذف');
    }
  };

  const getColor = () => {
    if (isDemoMode) {
      return demoType === 'green' ? '#3aa17e' : '#d4af37';
    }
    return user?.preferences?.color || '#3aa17e';
  };

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div>
      {/* Demo Badge */}
      {isDemoMode && (
        <div
          className="demo-badge"
          style={{ backgroundColor: getColor() }}
        >
          تجربة توضيحية
        </div>
      )}

      {/* Data Display */}
      <div>{/* عرض البيانات */}</div>

      {/* Actions */}
      <button onClick={() => handleSave(data)}>
        حفظ
      </button>
      <button onClick={() => handleDelete(data.id)}>
        حذف
      </button>

      {/* Demo Action Modal */}
      {showDemoActionModal && (
        <DemoActionModal
          onClose={() => setShowDemoActionModal(false)}
          onLogin={() => {
            setShowDemoActionModal(false);
            if (onShowAuth) onShowAuth('login');
          }}
          onRegister={() => {
            setShowDemoActionModal(false);
            if (onShowAuth) onShowAuth('register');
          }}
        />
      )}
    </div>
  );
}
```

---

## الخلاصة

Demo Mode سهل الاستخدام:

1. ✅ `const { isDemoMode } = useDemoMode()`
2. ✅ `if (isDemoMode) return demoData`
3. ✅ `if (isDemoMode) setShowDemoActionModal(true)`
4. ✅ `<DemoActionModal ... />`

**هذا كل شيء!** 🎉
