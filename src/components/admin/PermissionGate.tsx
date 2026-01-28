import { ReactNode } from 'react';
import { usePermissions } from '../../contexts/PermissionsContext';
import { Lock } from 'lucide-react';

interface PermissionGateProps {
  permissions: string | string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showLocked?: boolean;
  children: ReactNode;
}

export default function PermissionGate({
  permissions,
  requireAll = false,
  fallback,
  showLocked = false,
  children
}: PermissionGateProps) {
  const { isAuthorized, loading } = usePermissions();

  if (loading) {
    return null;
  }

  const authorized = isAuthorized(permissions, requireAll);

  if (!authorized) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showLocked) {
      return (
        <div className="flex items-center justify-center p-8 text-gray-400">
          <div className="text-center">
            <Lock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">لا تملك صلاحية الوصول لهذا القسم</p>
          </div>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}
