import { X, User, Sprout, LogOut, CheckCircle, Clock, Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import WhatsAppButton from './WhatsAppButton';

interface AccountProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
  onOpenReservations: () => void;
}

export default function AccountProfile({ isOpen, onClose, onOpenAuth, onOpenReservations }: AccountProfileProps) {
  const { user, signOut, loading } = useAuth();

  if (!isOpen) return null;

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />
      <div
        className="fixed inset-x-0 bottom-0 bg-white z-50 rounded-t-3xl p-8"
        style={{
          animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))',
          maxHeight: '85vh',
          overflowY: 'auto'
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-darkgreen mx-auto"></div>
            <p className="text-sm text-gray-600 mt-4">جاري التحميل...</p>
          </div>
        ) : user ? (
          <>
            <div className="text-center mb-8">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'linear-gradient(145deg, #3AA17E 0%, #2F5233 100%)',
                  boxShadow: '0 8px 16px rgba(58,161,126,0.3)'
                }}
              >
                <User className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-darkgreen mb-2">أهلاً بك</h2>
              <p className="text-sm text-gray-600 break-all px-4">{user.email}</p>
            </div>

            <div className="space-y-4">
              <div
                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 text-center"
                style={{
                  border: '2px solid #3AA17E'
                }}
              >
                <Sprout className="w-16 h-16 text-darkgreen mx-auto mb-4" />
                <h3 className="text-xl font-bold text-darkgreen mb-3">حسابك جاهز</h3>
                <div className="space-y-2 text-right">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 flex-1">
                      تم إنشاء حسابك بنجاح
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 flex-1">
                      خدمات الحجز والاستثمار ستتوفر قريباً
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 flex-1">
                      يمكنك تصفح المزارع المتاحة الآن
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenReservations();
                }}
                className="w-full py-4 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(145deg, #3AA17E 0%, #2F5233 100%)',
                  boxShadow: '0 4px 16px rgba(58,161,126,0.3)'
                }}
              >
                <Clock className="w-5 h-5" />
                عرض حجوزاتي
              </button>

              <WhatsAppButton
                investorName={user.email?.split('@')[0] || 'مستثمر'}
                variant="secondary"
                size="large"
                className="w-full"
              />

              <button
                onClick={handleSignOut}
                className="w-full py-4 rounded-xl font-bold text-gray-700 border-2 border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                تسجيل الخروج
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 relative"
                style={{
                  background: 'linear-gradient(145deg, #3AA17E 0%, #2F5233 100%)',
                  boxShadow: '0 12px 24px rgba(58,161,126,0.4)'
                }}
              >
                <User className="w-14 h-14 text-white" />
                <div className="absolute -top-1 -right-1 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="w-6 h-6 text-yellow-900" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-darkgreen mb-3">مرحباً بك!</h2>
              <p className="text-base text-gray-600 leading-relaxed px-4">
                ابدأ رحلتك الاستثمارية معنا
              </p>
            </div>

            <div
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 mb-6"
              style={{
                border: '2px solid #3AA17E'
              }}
            >
              <div className="space-y-3 text-right">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 flex-1">
                    سجل دخولك بسهولة باستخدام رقم الجوال
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 flex-1">
                    احجز أشجارك في أفضل المزارع
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 flex-1">
                    تابع محصولك وعوائدك بكل شفافية
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="w-full py-5 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden group"
              style={{
                background: 'linear-gradient(145deg, #3AA17E 0%, #2F5233 100%)',
                boxShadow: '0 8px 24px rgba(58,161,126,0.4)'
              }}
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <span className="text-lg">ابدأ الآن</span>
              <ArrowLeft className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
            </button>

            <p className="text-xs text-center text-gray-500 mt-4 px-4">
              بالضغط على "ابدأ الآن" فإنك توافق على الشروط والأحكام
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
