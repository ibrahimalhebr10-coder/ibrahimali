import { X, Sprout, TreePine, Droplets, Sun, Calendar, TrendingUp, Leaf, Eye, User } from 'lucide-react';

interface MyHarvestIntroProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export default function MyHarvestIntro({ isOpen, onClose, onOpenAuth }: MyHarvestIntroProps) {
  if (!isOpen) return null;

  const features = [
    {
      icon: <TreePine className="w-6 h-6" />,
      title: 'متابعة أشجارك',
      description: 'راقب نمو أشجارك وتطورها'
    },
    {
      icon: <Droplets className="w-6 h-6" />,
      title: 'جدول الري',
      description: 'تابع مواعيد الري والصيانة'
    },
    {
      icon: <Sun className="w-6 h-6" />,
      title: 'تقارير الموسم',
      description: 'تقارير دورية عن حالة المزرعة'
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'مواعيد الحصاد',
      description: 'معرفة مواعيد الحصاد المتوقعة'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'عوائدك المالية',
      description: 'متابعة العوائد والأرباح'
    },
    {
      icon: <Leaf className="w-6 h-6" />,
      title: 'شهادات صحية',
      description: 'شهادات فحص وجودة المحصول'
    }
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />

      <div
        className="fixed inset-x-0 bottom-0 bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-50 z-50 max-h-[90vh] overflow-y-auto rounded-t-3xl"
        style={{
          animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 py-5 flex items-center justify-between backdrop-blur-lg border-b border-emerald-200/30"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">محصولي</h2>
              <p className="text-xs text-white/80">تابع استثمارك الزراعي</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                  <Eye className="w-16 h-16 text-emerald-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 border-4 border-slate-50 flex items-center justify-center">
                  <TreePine className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 leading-snug">
                راقب استثمارك في كل لحظة
              </h3>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-lg mx-auto">
                بعد إتمام حجزك، ستتمكن من متابعة كل تفاصيل محصولك من هنا
              </p>
            </div>

            {/* Features Grid */}
            <div className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
                      {feature.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base sm:text-lg text-gray-800 mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-sm sm:text-base text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                  <User className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-800 mb-1">
                    ابدأ رحلتك الاستثمارية
                  </h4>
                  <p className="text-sm text-gray-600">
                    سجل دخولك لتتمكن من الحجز ومتابعة محصولك
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="w-full px-6 py-4 rounded-xl font-bold text-lg text-white transition-all hover:shadow-lg active:scale-95"
                style={{
                  background: 'linear-gradient(to right, #059669, #047857)'
                }}
              >
                <span className="flex items-center gap-2 justify-center">
                  <User className="w-5 h-5" />
                  سجل دخول أو أنشئ حساب
                </span>
              </button>
            </div>
          </div>
        </div>
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
