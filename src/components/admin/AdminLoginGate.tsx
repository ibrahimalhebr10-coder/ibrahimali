import { useState } from 'react';
import { Crown, Lock, User, X, AlertCircle } from 'lucide-react';
import { adminSessionService } from '../../services/adminSessionService';

interface AdminLoginGateProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function AdminLoginGate({ onSuccess, onClose }: AdminLoginGateProps) {
  const [email, setEmail] = useState('ibrahimalhebr1@gmail.com');
  const [password, setPassword] = useState('2931');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await adminSessionService.signInAdmin(email, password);

      if (result.success && result.admin) {
        onSuccess();
      } else {
        setError(result.error || 'حدث خطأ أثناء تسجيل الدخول');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('حدث خطأ أثناء تسجيل الدخول');
      setLoading(false);
    }
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
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
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
      `}</style>
    </div>
  );
}
