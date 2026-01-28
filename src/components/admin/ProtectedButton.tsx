import { ButtonHTMLAttributes, ReactNode } from 'react';
import { usePermissions } from '../../contexts/PermissionsContext';
import { Lock } from 'lucide-react';

interface ProtectedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  permissions: string | string[];
  requireAll?: boolean;
  hideIfUnauthorized?: boolean;
  showLockIcon?: boolean;
  children: ReactNode;
}

export default function ProtectedButton({
  permissions,
  requireAll = false,
  hideIfUnauthorized = false,
  showLockIcon = true,
  children,
  ...buttonProps
}: ProtectedButtonProps) {
  const { isAuthorized, loading } = usePermissions();

  if (loading) {
    return null;
  }

  const authorized = isAuthorized(permissions, requireAll);

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
