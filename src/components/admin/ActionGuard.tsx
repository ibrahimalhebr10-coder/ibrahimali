import { ReactNode } from 'react';
import { usePermissions } from '../../contexts/PermissionsContext';
import { AlertTriangle } from 'lucide-react';

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
