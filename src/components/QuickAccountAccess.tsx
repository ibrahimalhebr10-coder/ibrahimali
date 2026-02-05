import { LogIn, UserPlus, Sprout, ArrowRight, X, Zap } from 'lucide-react';

interface QuickAccountAccessProps {
  onExistingUser: () => void;
  onNewUser: () => void;
  onClose: () => void;
}

export default function QuickAccountAccess({ onExistingUser, onNewUser, onClose }: QuickAccountAccessProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{
        background: 'linear-gradient(135deg, rgba(47,82,51,0.97) 0%, rgba(58,161,126,0.95) 100%)',
        backdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
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
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div
        className="w-full max-w-md"
        style={{
          animation: 'slideUp 0.4s ease-out 0.1s both'
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-95 backdrop-blur-sm border border-white/20"
          aria-label="إغلاق"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        <div className="bg-white rounded-3xl p-8 shadow-2xl space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg" style={{
                background: 'linear-gradient(135deg, #2F5233 0%, #3AA17E 100%)'
              }}>
                <Sprout className="w-10 h-10 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-black" style={{ color: '#2F5233' }}>
              مرحبًا بك
            </h2>

            <p className="text-lg text-gray-600 font-medium">
              هل لديك حساب بالفعل؟
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2 relative">
              <div className="absolute -top-3 right-4 z-10">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full shadow-lg animate-pulse" style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                }}>
                  <Zap className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-bold text-white">دخول سريع</span>
                </div>
              </div>

              <button
                onClick={onExistingUser}
                className="group w-full py-5 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between px-6 overflow-hidden relative"
                style={{
                  background: 'linear-gradient(135deg, #2F5233 0%, #3AA17E 100%)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>

                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <LogIn className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">نعم، لدي حساب</div>
                    <div className="text-white/70 text-xs font-normal">دخول مباشر بدون لفة</div>
                  </div>
                </div>

                <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform relative z-10" />
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">أو</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={onNewUser}
                className="group w-full py-5 rounded-2xl font-bold text-lg border-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between px-6 bg-white hover:bg-gray-50"
                style={{
                  borderColor: '#3AA17E',
                  color: '#3AA17E'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#3AA17E20' }}>
                    <UserPlus className="w-5 h-5" style={{ color: '#3AA17E' }} />
                  </div>
                  <div className="text-right">
                    <div className="font-bold" style={{ color: '#3AA17E' }}>لا، عميل جديد</div>
                    <div className="text-xs font-normal text-gray-500">تعرف على المنصة أولاً</div>
                  </div>
                </div>

                <ArrowRight className="w-5 h-5 opacity-60 group-hover:translate-x-1 transition-transform" style={{ color: '#3AA17E' }} />
              </button>
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              اختر الخيار المناسب للدخول إلى حسابك
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
