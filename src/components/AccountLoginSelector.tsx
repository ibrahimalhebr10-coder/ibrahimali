import { LogIn, UserPlus } from 'lucide-react';

interface AccountLoginSelectorProps {
  onLogin: () => void;
  onRegister: () => void;
  onClose: () => void;
}

export default function AccountLoginSelector({ onLogin, onRegister, onClose }: AccountLoginSelectorProps) {
  return (
    <div className="fixed inset-0 z-[60000] bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl p-8 animate-fadeIn" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(236, 253, 245, 0.95) 100%)',
          boxShadow: '0 20px 60px rgba(16, 185, 129, 0.2)',
          border: '2px solid rgba(16, 185, 129, 0.2)'
        }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <span className="text-3xl">🌿</span>
            </div>
            <h2 className="text-3xl font-black text-emerald-900 mb-2">
              مرحباً بك
            </h2>
            <p className="text-emerald-700 font-semibold">
              اختر طريقة الدخول المناسبة لك
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-4">
            <button
              onClick={onLogin}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <LogIn className="w-5 h-5 text-white" />
              <span className="text-white font-black text-lg">الدخول إلى حسابي</span>
            </button>

            <button
              onClick={onRegister}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.08) 100%)',
                border: '2px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              <UserPlus className="w-5 h-5 text-emerald-700" />
              <span className="text-emerald-900 font-black text-lg">إنشاء حساب جديد</span>
            </button>
          </div>

          {/* Close Link */}
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="text-sm text-emerald-700 hover:text-emerald-900 font-semibold transition-colors"
            >
              العودة للصفحة الرئيسية
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
