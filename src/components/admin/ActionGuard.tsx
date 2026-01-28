import { ReactNode } from 'react';
import { usePermissions } from '../../contexts/PermissionsContext';
import { AlertTriangle, Lock } from 'lucide-react';

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
      const actionNames = actions.map(a => {
        const parts = a.split('.');
        const category = parts[0];
        const categoryLabels: Record<string, string> = {
          finance: 'المالية',
          operations: 'العمليات',
          maintenance: 'الصيانة',
          equipment: 'المعدات',
          supervision: 'الإشراف',
          messaging: 'المراسلة'
        };
        return categoryLabels[category] || category;
      }).filter((v, i, a) => a.indexOf(v) === i);

      return (
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-900 mb-2">
              ليس لديك صلاحية للوصول
            </h3>
            <p className="text-red-800 mb-4">
              هذا القسم يتطلب صلاحيات إدارة {actionNames.join(' أو ')}
            </p>
            <p className="text-sm text-red-700">
              يرجى التواصل مع المدير العام إذا كنت تحتاج هذه الصلاحية
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}
