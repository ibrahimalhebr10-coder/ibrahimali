import { useEffect, useState, ReactNode } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { Shield, AlertCircle } from 'lucide-react';

interface AdminRouteGuardProps {
  children: ReactNode;
  onUnauthorized?: () => void;
}

export default function AdminRouteGuard({ children, onUnauthorized }: AdminRouteGuardProps) {
  const { admin, isAdminAuthenticated, isLoading, checkAdminSession } = useAdmin();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    async function verifyAccess() {
      console.log('🛡️ AdminRouteGuard: Starting verification');
      setIsVerifying(true);
      await checkAdminSession();
      setIsVerifying(false);
      console.log('🛡️ AdminRouteGuard: Verification complete', {
        isAdminAuthenticated,
        isLoading,
        hasAdmin: !!admin
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

  return <>{children}</>;
}
