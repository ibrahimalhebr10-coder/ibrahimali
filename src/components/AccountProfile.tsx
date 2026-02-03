import { X, User, LogOut, Sparkles, Sprout, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import IdentityManager from './IdentityManager';

interface AccountProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
  onOpenReservations: () => void;
  onStartInvestment?: () => void;
}

type AppMode = 'agricultural' | 'investment';

export default function AccountProfile({ isOpen, onClose, onOpenAuth, onStartInvestment }: AccountProfileProps) {
  const { user, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>('agricultural');

  useEffect(() => {
    const savedMode = localStorage.getItem('appMode');
    if (savedMode === 'agricultural' || savedMode === 'investment') {
      setAppMode(savedMode);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const isFarmer = appMode === 'agricultural';
  const isInvestor = appMode === 'investment';

  const identityConfig = {
    agricultural: {
      label: 'مزارع',
      color: '#3aa17e',
      gradient: 'linear-gradient(135deg, #3aa17e 0%, #2f8266 100%)',
      icon: Sprout,
      description: 'أنت في رحلة زراعية',
      buttonText: 'تابع مزرعتي',
      buttonAction: () => {
        console.log('Navigate to Agricultural Journey');
      }
    },
    investment: {
      label: 'مستثمر',
      color: '#d4af37',
      gradient: 'linear-gradient(135deg, #d4af37 0%, #b8942f 100%)',
      icon: TrendingUp,
      description: 'أنت في رحلة استثمارية',
      buttonText: 'تابع استثماري',
      buttonAction: () => {
        onClose();
        onStartInvestment?.();
      }
    }
  };

  const config = identityConfig[appMode];
  const IdentityIcon = config.icon;

  if (!user) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-md z-50"
          onClick={onClose}
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl transform transition-all scale-100">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="text-center mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-xl relative">
                <User className="w-12 h-12 text-white" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles className="w-5 h-5 text-yellow-900" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">مرحباً بك</h2>
              <p className="text-gray-600">
                {isFarmer ? 'انضم لآلاف المزارعين الناجحين' : 'انضم لآلاف المستثمرين الناجحين'}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">1</span>
                </div>
                <p className="text-sm text-gray-700 text-right flex-1">سجل الدخول بسهولة</p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">2</span>
                </div>
                <p className="text-sm text-gray-700 text-right flex-1">
                  {isFarmer ? 'احجز أشجارك الزراعية' : 'احجز أشجارك المثمرة'}
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">3</span>
                </div>
                <p className="text-sm text-gray-700 text-right flex-1">
                  {isFarmer ? 'راقب مزرعتك تنمو' : 'راقب استثمارك ينمو'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>ابدأ الآن</span>
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-slate-50 via-white to-green-50">
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              <h1 className="text-xl font-bold text-gray-900">حسابي</h1>

              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg"
              >
                <User className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {showProfileMenu && (
          <div className="absolute top-16 left-4 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 z-30 min-w-[200px]">
            <div className="p-3 border-b border-gray-100">
              <p className="font-bold text-gray-900 text-sm text-right">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-500 text-right">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full p-3 flex items-center gap-2 hover:bg-red-50 rounded-xl transition-colors text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-bold flex-1 text-right">تسجيل الخروج</span>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pb-8">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="space-y-6">
              <div
                className="rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden"
                style={{ background: config.gradient }}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16"></div>

                <div className="relative z-10 text-center">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
                    style={{ background: 'rgba(255,255,255,0.2)' }}
                  >
                    <IdentityIcon className="w-12 h-12 text-white" />
                  </div>

                  <div
                    className="inline-block px-6 py-2 rounded-full mb-4"
                    style={{ background: 'rgba(255,255,255,0.2)' }}
                  >
                    <span className="text-lg font-bold">
                      {config.label}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold mb-2">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </h2>

                  <p className="text-sm opacity-90 mb-6">
                    {config.description}
                  </p>

                  <button
                    onClick={config.buttonAction}
                    className="w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{
                      background: 'rgba(255,255,255,0.95)',
                      color: config.color
                    }}
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>{config.buttonText}</span>
                  </button>
                </div>
              </div>

              <IdentityManager />

              <div className="text-center text-gray-500 text-sm">
                <p>المزيد من المزايا قريباً</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
