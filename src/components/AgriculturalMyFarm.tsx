import { useState } from 'react';
import { Sprout, Flower2, Apple, Wheat, Gift, Heart, HandHeart, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface VisitorOverlayProps {
  onClose: () => void;
  onBookNow: () => void;
  onRegister: () => void;
}

function VisitorOverlay({ onClose, onBookNow, onRegister }: VisitorOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
            <Sprout className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            أعجبتك رحلتك الزراعية؟
          </h2>

          <p className="text-gray-600 mb-8 leading-relaxed">
            احجز شجرتك الآن وابدأ رحلتك الخاصة معنا
          </p>

          <div className="space-y-3">
            <button
              onClick={onBookNow}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Sprout className="w-5 h-5" />
              احجز الآن
            </button>

            <button
              onClick={onRegister}
              className="w-full py-4 px-6 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              إنشاء حساب
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgriculturalMyFarm() {
  const { user } = useAuth();
  const isVisitor = !user;
  const [showOverlay, setShowOverlay] = useState(false);

  const handleActionClick = () => {
    if (isVisitor) {
      setShowOverlay(true);
    } else {
    }
  };

  const handleBookNow = () => {
    setShowOverlay(false);
    window.location.href = '/';
  };

  const handleRegister = () => {
    setShowOverlay(false);
  };

  const stages = [
    { icon: Sprout, label: 'النمو', color: 'text-green-500', bgColor: 'bg-green-50' },
    { icon: Flower2, label: 'الإزهار', color: 'text-pink-500', bgColor: 'bg-pink-50' },
    { icon: Apple, label: 'الثمار', color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { icon: Wheat, label: 'الحصاد', color: 'text-amber-500', bgColor: 'bg-amber-50' }
  ];

  const harvestOptions = [
    { icon: Gift, label: 'استلام', description: 'استلم محصولك بنفسك', color: 'from-blue-500 to-cyan-500' },
    { icon: Heart, label: 'إهداء', description: 'أهدِ محصولك لمن تحب', color: 'from-rose-500 to-pink-500' },
    { icon: HandHeart, label: 'صدقة', description: 'تبرع بمحصولك للمحتاجين', color: 'from-purple-500 to-violet-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {showOverlay && (
        <VisitorOverlay
          onClose={() => setShowOverlay(false)}
          onBookNow={handleBookNow}
          onRegister={handleRegister}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 pb-32 space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md mb-4">
            <Sprout className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600">محصولي الزراعي</span>
          </div>

          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            مزرعتي
          </h1>

          <p className="text-lg text-gray-600">
            رحلة هادئة مع الطبيعة… من الشجرة إلى المحصول
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">أشجاري</h2>
            {isVisitor && (
              <span className="text-xs text-gray-400 px-3 py-1 bg-gray-50 rounded-full">
                مثال توضيحي
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((tree) => (
              <div
                key={tree}
                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 text-center border border-green-100"
              >
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <Sprout className="w-8 h-8 text-white" />
                </div>
                <p className="font-bold text-gray-800">شجرة زيتون</p>
                <p className="text-sm text-gray-500">#{tree}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-green-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">رحلة الموسم</h2>

          <div className="flex items-center justify-between mb-6">
            {stages.map((stage, index) => {
              const StageIcon = stage.icon;
              const isActive = index === 0;

              return (
                <div key={index} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-full ${isActive ? stage.bgColor : 'bg-gray-50'} flex items-center justify-center border-2 ${isActive ? 'border-green-500' : 'border-gray-200'} transition-all`}>
                      <StageIcon className={`w-8 h-8 ${isActive ? stage.color : 'text-gray-300'}`} />
                    </div>
                    <p className={`text-sm font-medium mt-2 ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                      {stage.label}
                    </p>
                  </div>

                  {index < stages.length - 1 && (
                    <div className={`w-12 h-1 ${index === 0 ? 'bg-green-500' : 'bg-gray-200'} mx-2`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
            <p className="text-gray-700 text-center leading-relaxed">
              نحن الآن في <span className="font-bold text-green-600">مرحلة النمو</span>… أشجارك تكبر بعناية فريقنا
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-amber-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">وقت المحصول</h2>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100 text-center">
            <Wheat className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <p className="text-lg font-semibold text-gray-800 mb-2">
              يقترب موسم الحصاد
            </p>
            <p className="text-gray-600">
              خلال الأشهر القادمة سيكون محصولك جاهزاً
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100">
          <h2 className="text-xl font-bold text-gray-800 mb-2">ماذا تريد بمحصولك؟</h2>
          <p className="text-gray-600 mb-6">اختر كيف تريد الاستفادة من محصولك</p>

          <div className="grid gap-4">
            {harvestOptions.map((option) => {
              const OptionIcon = option.icon;

              return (
                <button
                  key={option.label}
                  onClick={handleActionClick}
                  className="group w-full bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-200 hover:border-transparent hover:shadow-xl transition-all text-right"
                  style={{
                    background: 'linear-gradient(to bottom right, rgb(249 250 251), white)'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <OptionIcon className="w-7 h-7 text-white" />
                    </div>

                    <div className="flex-1">
                      <p className="font-bold text-lg text-gray-800 mb-1">{option.label}</p>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>

                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {isVisitor && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl shadow-xl p-8 text-center text-white">
            <Sprout className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">
              جاهز لتبدأ رحلتك الزراعية؟
            </h3>
            <p className="text-green-50 mb-6">
              احجز أشجارك الآن واستمتع بتجربة حقيقية
            </p>
            <button
              onClick={handleBookNow}
              className="px-8 py-4 bg-white text-green-600 rounded-xl font-bold hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              احجز شجرتك الآن
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
