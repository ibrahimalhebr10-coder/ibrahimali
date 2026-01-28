import { useEffect, useState, ReactNode } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { Shield, AlertCircle, UserX } from 'lucide-react';
import { permissionsService } from '../../services/permissionsService';

interface AdminRouteGuardProps {
  children: ReactNode;
  onUnauthorized?: () => void;
}

export default function AdminRouteGuard({ children, onUnauthorized }: AdminRouteGuardProps) {
  const { admin, isAdminAuthenticated, isLoading, checkAdminSession } = useAdmin();
  const [isVerifying, setIsVerifying] = useState(true);
  const [roleCheck, setRoleCheck] = useState<{ hasRole: boolean; roleActive: boolean }>({ hasRole: false, roleActive: false });

  useEffect(() => {
    async function verifyAccess() {
      console.log('🛡️ AdminRouteGuard: Starting verification');
      setIsVerifying(true);
      await checkAdminSession();

      if (admin) {
        const adminWithRole = await permissionsService.getCurrentAdminWithRole();
        if (adminWithRole && adminWithRole.role) {
          setRoleCheck({ hasRole: true, roleActive: true });
          console.log('✅ AdminRouteGuard: Role verified', adminWithRole.role.role_name_ar);
        } else {
          setRoleCheck({ hasRole: false, roleActive: false });
          console.log('❌ AdminRouteGuard: No role or inactive role');
        }
      }

      setIsVerifying(false);
      console.log('🛡️ AdminRouteGuard: Verification complete', {
        isAdminAuthenticated,
        isLoading,
        hasAdmin: !!admin,
        roleCheck
      });

      if (!isAdminAuthenticated && !isLoading) {
        console.log('❌ AdminRouteGuard: Calling onUnauthorized');
        onUnauthorized?.();
      }
    }

    verifyAccess();
  }, []);

  useEffect(() => {
    console.log('🛡️ AdminRouteGuard: Auth state changed', {
      isAdminAuthenticated,
      isLoading,
      hasAdmin: !!admin
    });
    if (!isLoading && !isAdminAuthenticated) {
      console.log('❌ AdminRouteGuard: Not authenticated, calling onUnauthorized');
      onUnauthorized?.();
    }
  }, [isAdminAuthenticated, isLoading]);

  if (isLoading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-green-900">
        <div className="text-center">
          <Shield className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white text-lg">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!isAdminAuthenticated || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-red-900">
        <div className="text-center p-8 bg-white/10 rounded-2xl backdrop-blur-lg">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">غير مصرح</h2>
          <p className="text-white/70">ليس لديك صلاحيات الوصول لهذه الصفحة</p>
        </div>
      </div>
    );
  }

  if (!roleCheck.hasRole || !roleCheck.roleActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-amber-900">
        <div className="text-center p-8 bg-white/10 rounded-2xl backdrop-blur-lg max-w-md">
          <UserX className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">لا يوجد دور محدد</h2>
          <p className="text-white/70 mb-4">
            لا يمكنك الوصول للوحة الإدارة بدون دور فعّال. يرجى التواصل مع المدير العام لتعيين دور لحسابك.
          </p>
          <p className="text-white/50 text-sm">
            حسابك: {admin.email}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
