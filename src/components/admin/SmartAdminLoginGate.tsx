import { useState, useEffect } from 'react';
import {
  Crown,
  Lock,
  User,
  X,
  AlertCircle,
  Check,
  Shield,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { adminSessionService } from '../../services/adminSessionService';
import { permissionsService, AdminPermission, AdminRole } from '../../services/permissionsService';

interface SmartAdminLoginGateProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function SmartAdminLoginGate({ onSuccess, onClose }: SmartAdminLoginGateProps) {
  const [email, setEmail] = useState('ibrahimalhebr1@gmail.com');
  const [password, setPassword] = useState('2931');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'login' | 'loading' | 'welcome'>('login');
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [showPermissions, setShowPermissions] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await adminSessionService.signInAdmin(email, password);

      if (!result.success || !result.admin) {
        setError(result.error || 'حدث خطأ أثناء تسجيل الدخول');
        setLoading(false);
        return;
      }

      setStep('loading');

      const [role, perms] = await Promise.all([
        result.admin.role_id 
          ? permissionsService.getRoleById(result.admin.role_id)
          : null,
        permissionsService.getAdminPermissions(result.admin.id, false)
      ]);

      setAdminRole(role);
      setPermissions(perms);

      await new Promise(resolve => setTimeout(resolve, 1000));

      setStep('welcome');

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error('Login error:', err);
      setError('حدث خطأ أثناء تسجيل الدخول');
      setLoading(false);
      setStep('login');
    }
  }

  const permissionsByCategory = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, AdminPermission[]>);

  const categoryNames: Record<string, string> = {
    dashboard: 'لوحة التحكم',
    farms: 'المزارع',
    reservations: 'الحجوزات',
    finance: 'المالية',
    users: 'المستخدمين',
    messages: 'الرسائل',
    admins: 'الإداريين',
    settings: 'الإعدادات',
    logs: 'السجلات'
  };

  if (step === 'loading') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(47,82,51,0.98) 100%)',
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full" style={{
              background: 'linear-gradient(145deg, rgba(255,215,0,0.2), rgba(255,215,0,0.1))',
              border: '2px solid rgba(255, 215, 0, 0.5)',
              boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <Crown className="w-12 h-12 text-yellow-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">جاري تحميل البيانات</h3>
          <p className="text-white/60">يتم تحميل الصلاحيات والإعدادات...</p>
          <div className="mt-6 flex justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'welcome') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(47,82,51,0.98) 100%)',
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        <div
          className="w-full max-w-2xl p-8 rounded-3xl"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 215, 0, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            animation: 'slideUp 0.4s ease-out'
          }}
        >
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{
              background: 'linear-gradient(145deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))',
              border: '2px solid rgba(34, 197, 94, 0.5)',
              boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)',
              animation: 'scaleIn 0.5s ease-out'
            }}>
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">مرحباً بك</h2>
            {adminRole && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg" style={{
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)'
              }}>
                <Shield className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-300 font-semibold">{adminRole.role_name_ar}</span>
              </div>
            )}
          </div>

          {permissions.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowPermissions(!showPermissions)}
                className="w-full flex items-center justify-between p-4 rounded-xl transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <span className="text-white font-semibold">
                  صلاحياتك ({permissions.length} صلاحية)
                </span>
                {showPermissions ? (
                  <ChevronUp className="w-5 h-5 text-white/60" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/60" />
                )}
              </button>

              {showPermissions && (
                <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category}>
                      <h4 className="text-sm font-bold text-yellow-400 mb-2">
                        {categoryNames[category] || category}
                      </h4>
                      <div className="space-y-1">
                        {perms.map(perm => (
                          <div
                            key={perm.id}
                            className="flex items-center gap-2 p-2 rounded-lg"
                            style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}
                          >
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <span className="text-sm text-white/80">{perm.permission_name_ar}</span>
                            {perm.is_critical && (
                              <span className="mr-auto px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-300 border border-red-500/30">
                                حساسة
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="text-center">
            <p className="text-white/60 mb-4">جاري تحويلك إلى لوحة التحكم...</p>
            <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(47,82,51,0.98) 100%)',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <button
        onClick={onClose}
        className="absolute top-6 left-6 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-white/10"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '2px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <X className="w-5 h-5 text-white" />
      </button>

      <div
        className="w-full max-w-md p-8 rounded-3xl"
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(255, 215, 0, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          animation: 'slideUp 0.4s ease-out'
        }}
      >
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, rgba(255,215,0,0.2), rgba(255,215,0,0.1))',
              border: '2px solid rgba(255, 215, 0, 0.5)',
              boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)'
            }}
          >
            <Crown className="w-10 h-10 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">الدخول إلى غرفة التحكم</h2>
          <p className="text-sm text-white/60">تسجيل الدخول للوحة الإدارة</p>
          <div className="mt-3 px-4 py-2 rounded-lg" style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <p className="text-xs text-blue-300">وضع التطوير: البيانات معبأة مسبقاً</p>
          </div>
        </div>

        {error && (
          <div
            className="mb-6 p-4 rounded-xl flex items-start gap-3"
            style={{
              background: 'rgba(244, 67, 54, 0.1)',
              border: '2px solid rgba(244, 67, 54, 0.3)'
            }}
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <User className="w-5 h-5 text-white/40" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-12 py-4 rounded-xl text-right transition-all duration-300"
                placeholder="admin@example.com"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                  e.target.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Lock className="w-5 h-5 text-white/40" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-12 py-4 rounded-xl text-right transition-all duration-300"
                placeholder="••••••••"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                  e.target.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-gray-900 transition-all duration-300 hover:shadow-2xl active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            style={{
              background: 'linear-gradient(145deg, #FFD700, #FFA500)',
              border: '2px solid rgba(255, 215, 0, 0.5)',
              boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)'
            }}
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Crown className="w-5 h-5" />
                <span>دخول لوحة الإدارة</span>
              </>
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
