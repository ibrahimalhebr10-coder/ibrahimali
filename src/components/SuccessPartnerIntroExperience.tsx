import { useState, useEffect } from 'react';
import { Sparkles, Users, Coins, Gift, TrendingUp, Zap, ArrowLeft, CheckCircle, Star, Handshake, Target, Award, DollarSign, Share2, Rocket } from 'lucide-react';

interface SuccessPartnerIntroExperienceProps {
  isOpen: boolean;
  onContinue: () => void;
}

export default function SuccessPartnerIntroExperience({ isOpen, onContinue }: SuccessPartnerIntroExperienceProps) {
  const [step, setStep] = useState(0);
  const [animatedNumbers, setAnimatedNumbers] = useState({ clients: 0, earnings: 0, impact: 0 });
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (step === 2) {
      const timer1 = setInterval(() => {
        setAnimatedNumbers(prev => ({
          clients: Math.min(prev.clients + 1, 10),
          earnings: Math.min(prev.earnings + 50, 500),
          impact: Math.min(prev.impact + 10, 100)
        }));
      }, 50);
      return () => clearInterval(timer1);
    }
  }, [step]);

  useEffect(() => {
    if (step === 3) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  }, [step]);

  if (!isOpen) return null;

  const steps = [
    {
      icon: Sparkles,
      title: "مرحباً يا شريك النجاح!",
      subtitle: "أنت على وشك الانضمام لفريق مميز",
      content: (
        <div className="space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-300 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative text-center space-y-4">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl animate-bounce-slow">
                <Handshake className="w-16 h-16 text-white" strokeWidth={2} />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-black text-gray-800">
                  اكسب مع كل شخص تدعوه
                </p>
                <p className="text-lg text-gray-600">
                  دخل إضافي بدون أي استثمار منك
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-8">
            <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-amber-200">
              <div className="text-3xl font-black text-amber-600 mb-1">0</div>
              <div className="text-xs text-gray-600 font-bold">تكلفة البداية</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-green-200">
              <div className="text-3xl font-black text-green-600 mb-1">∞</div>
              <div className="text-xs text-gray-600 font-bold">إمكانيات الربح</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-blue-200">
              <div className="text-3xl font-black text-blue-600 mb-1">5</div>
              <div className="text-xs text-gray-600 font-bold">دقائق للبدء</div>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: Target,
      title: "كيف يعمل البرنامج؟",
      subtitle: "بسيطة جداً، 3 خطوات فقط",
      content: (
        <div className="space-y-4">
          <div className="relative">
            {[
              { icon: Share2, title: "شارك رابطك", desc: "كل شخص تشاركه يحصل على كود خاص بك", color: "from-blue-500 to-cyan-500" },
              { icon: Users, title: "أصدقاؤك يستثمرون", desc: "عندما يحجزون أشجار باستخدام كودك", color: "from-green-500 to-emerald-500" },
              { icon: DollarSign, title: "أنت تكسب", desc: "تحصل على عمولة من كل حجز", color: "from-amber-500 to-orange-500" }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="relative">
                  {index < 2 && (
                    <div className="absolute left-8 top-16 w-0.5 h-12 bg-gradient-to-b from-gray-300 to-transparent"></div>
                  )}
                  <div className="flex items-start gap-4 bg-white rounded-2xl p-4 shadow-lg border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 hover:scale-[1.02]">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-gray-800 text-white text-xs font-black flex items-center justify-center">
                          {index + 1}
                        </div>
                        <h4 className="text-lg font-black text-gray-800">{item.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )
    },
    {
      icon: TrendingUp,
      title: "شاهد دخلك يتزايد",
      subtitle: "مثال حي على قوة البرنامج",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 border-2 border-green-200">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 mb-2">إذا دعوت 10 أصدقاء فقط</p>
              <p className="text-xs text-gray-500">كل واحد حجز 5 أشجار بسعر 1000 ريال</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
                <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-black text-blue-600 mb-1">{animatedNumbers.clients}</div>
                <div className="text-xs text-gray-600 font-bold">عملاء</div>
              </div>

              <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
                <Coins className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-black text-green-600 mb-1">{animatedNumbers.earnings}</div>
                <div className="text-xs text-gray-600 font-bold">ريال عمولة</div>
              </div>

              <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-3xl font-black text-purple-600 mb-1">{animatedNumbers.impact}%</div>
                <div className="text-xs text-gray-600 font-bold">نمو</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-center shadow-xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-white" />
              <p className="text-white font-black text-sm">ومع كل عميل جديد</p>
            </div>
            <p className="text-white text-2xl font-black">دخلك يتضاعف!</p>
          </div>

          <div className="space-y-2">
            {[
              { count: "20 عميل", earnings: "1,000 ريال" },
              { count: "50 عميل", earnings: "2,500 ريال" },
              { count: "100 عميل", earnings: "5,000 ريال" }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded-xl p-3 shadow border border-gray-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-bold text-gray-700">{item.count}</span>
                </div>
                <div className="text-green-600 font-black">{item.earnings}</div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      icon: Gift,
      title: "مميزات رهيبة بانتظارك",
      subtitle: "ليس فقط المال، بل أكثر!",
      content: (
        <div className="space-y-4">
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-50">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                >
                  {['🎉', '✨', '🌟', '💰', '🎊'][Math.floor(Math.random() * 5)]}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Award, title: "لوحة تحكم خاصة", desc: "تتبع أرباحك لحظياً", color: "from-purple-500 to-pink-500" },
              { icon: Target, title: "أهداف وتحديات", desc: "كل إنجاز له مكافأة", color: "from-blue-500 to-cyan-500" },
              { icon: Star, title: "مستويات VIP", desc: "كلما نجحت، زادت مزاياك", color: "from-amber-500 to-yellow-500" },
              { icon: Rocket, title: "دعم مستمر", desc: "فريقنا معك في كل خطوة", color: "from-green-500 to-emerald-500" }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="bg-white rounded-2xl p-4 shadow-lg border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 hover:scale-105">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 shadow-md`}>
                    <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <h4 className="text-sm font-black text-gray-800 mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-600 leading-tight">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-center shadow-2xl">
            <Sparkles className="w-10 h-10 text-white mx-auto mb-3 animate-pulse" />
            <p className="text-white text-xl font-black mb-2">جاهز للبداية؟</p>
            <p className="text-white/90 text-sm">سجّل الآن واحصل على كودك الخاص</p>
          </div>
        </div>
      )
    }
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-auto">
      <div className="min-h-screen relative flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-gray-600">خطوة {step + 1} من {steps.length}</div>
              <div className="text-sm font-bold text-gray-600">{Math.round(((step + 1) / steps.length) * 100)}%</div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ease-out"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
                                    radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)`
                }}></div>
              </div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 border-2 border-white/40 shadow-xl">
                  <Icon className="w-10 h-10 text-white" strokeWidth={2} />
                </div>
                <h2 className="text-3xl font-black text-white mb-2 drop-shadow-lg">{currentStep.title}</h2>
                <p className="text-white/90 text-lg font-semibold drop-shadow-md">{currentStep.subtitle}</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-8">
              <div className="animate-fadeIn">
                {currentStep.content}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="flex gap-3">
                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-3 rounded-xl font-bold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    رجوع
                  </button>
                )}
                {step < steps.length - 1 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    className="flex-1 px-6 py-4 rounded-xl font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>التالي</span>
                    <ArrowLeft className="w-5 h-5" strokeWidth={3} />
                  </button>
                ) : (
                  <button
                    onClick={onContinue}
                    className="flex-1 px-6 py-4 rounded-xl font-black text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-2 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>
                    <Rocket className="w-5 h-5 relative" strokeWidth={3} />
                    <span className="relative">ابدأ رحلتك الآن</span>
                    <ArrowLeft className="w-5 h-5 relative" strokeWidth={3} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Skip Button */}
          <button
            onClick={onContinue}
            className="mt-4 mx-auto block text-gray-500 hover:text-gray-700 text-sm font-bold transition-colors underline"
          >
            تخطي المقدمة
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotateZ(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotateZ(720deg); opacity: 0; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}
