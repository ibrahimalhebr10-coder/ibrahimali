import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Users, TreePine, TrendingUp, Handshake } from 'lucide-react';

interface SuccessPartnerOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function SuccessPartnerOnboarding({ isOpen, onClose, onComplete }: SuccessPartnerOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      icon: Sparkles,
      title: 'المعنى',
      headline: 'أنت لا تبيع',
      subheadline: 'أنت تفتح طريقًا لغيرك لامتلاك أشجاره',
      description: 'دورك ليس تجاريًا ولا يحتاج منك أي جهد مبيعات. أنت ببساطة تشارك تجربتك الحقيقية مع من تثق بهم، وتفتح لهم باب البداية.',
      gradient: 'from-emerald-500/20 to-teal-500/20',
      iconBg: 'from-emerald-500/20 to-teal-500/15'
    },
    {
      icon: Users,
      title: 'الدور',
      headline: 'أي شخص يدخل بسببك',
      subheadline: 'يُسجَّل أثره باسمك',
      description: 'كل من يبدأ رحلته من خلال كلمتك، يصبح جزءًا من أثرك الإيجابي. سنربط نجاحه برحلتك بشكل دائم في نظامنا.',
      gradient: 'from-teal-500/20 to-cyan-500/20',
      iconBg: 'from-teal-500/20 to-cyan-500/15'
    },
    {
      icon: TreePine,
      title: 'الأثر',
      headline: 'الأشجار التي تُزرع بسببك',
      subheadline: 'تبقى مرتبطة باسمك',
      description: 'كل شجرة تُزرع بفضل تأثيرك تحمل بصمتك. هذا ليس مجرد رقم، بل إرث حقيقي يكبر مع الزمن.',
      gradient: 'from-cyan-500/20 to-blue-500/20',
      iconBg: 'from-cyan-500/20 to-blue-500/15'
    },
    {
      icon: TrendingUp,
      title: 'الاحتساب',
      headline: 'سياسة المكافأة مرنة',
      subheadline: 'وتُحدَّد حسب مرحلة نمو المنصة',
      description: 'نحن نكافئك بأشجار حقيقية، ونظام المكافآت يتطور معنا. قد تختلف القيمة من وقت لآخر حسب نمو المنصة، لكن الأثر يبقى ثابتًا.',
      gradient: 'from-blue-500/20 to-emerald-500/20',
      iconBg: 'from-blue-500/20 to-emerald-500/15',
      isLast: true
    }
  ];

  const currentSlide = slides[currentStep];
  const Icon = currentSlide.icon;

  const handleNext = () => {
    if (currentStep < slides.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-hidden">
      <div className="h-full relative" style={{
        background: 'linear-gradient(135deg, rgba(250, 252, 251, 1) 0%, rgba(245, 250, 247, 1) 50%, rgba(248, 252, 250, 1) 100%)'
      }}>
        <div className={`absolute inset-0 opacity-30 pointer-events-none transition-all duration-700 bg-gradient-to-br ${currentSlide.gradient}`}></div>

        <div className="sticky top-0 z-10 backdrop-blur-xl border-b border-emerald-200/50" style={{
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 252, 251, 0.95) 100%)'
        }}>
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{
                background: 'linear-gradient(145deg, rgba(239, 246, 255, 0.95) 0%, rgba(229, 242, 251, 0.9) 100%)',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
                border: '2px solid rgba(16, 185, 129, 0.2)'
              }}
            >
              <X className="w-5 h-5 text-emerald-700" strokeWidth={2.5} />
            </button>

            <div className="flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className="transition-all duration-300"
                  style={{
                    width: index === currentStep ? '32px' : '8px',
                    height: '8px',
                    borderRadius: '999px',
                    background: index === currentStep
                      ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                      : 'rgba(16, 185, 129, 0.2)',
                    boxShadow: index === currentStep
                      ? '0 2px 8px rgba(16, 185, 129, 0.3)'
                      : 'none'
                  }}
                />
              ))}
            </div>

            <div className="w-10 h-10"></div>
          </div>
        </div>

        <div className="h-full flex items-center justify-center px-4 pb-32 pt-8">
          <div className="max-w-2xl w-full space-y-8 animate-fadeIn">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-200 rounded-full blur-3xl opacity-40 animate-pulse"></div>
                <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-700 bg-gradient-to-br ${currentSlide.iconBg}`} style={{
                  border: '3px solid rgba(16, 185, 129, 0.4)'
                }}>
                  <Icon className="w-16 h-16 text-emerald-700" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="inline-block px-4 py-1.5 rounded-full mb-4" style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.08) 100%)',
                border: '2px solid rgba(16, 185, 129, 0.25)'
              }}>
                <span className="text-sm font-black text-emerald-700 tracking-wide">{currentSlide.title}</span>
              </div>

              <h2 className="text-3xl lg:text-4xl font-black text-emerald-900 leading-tight">
                {currentSlide.headline}
              </h2>
              <p className="text-2xl lg:text-3xl font-bold text-emerald-700 leading-tight">
                {currentSlide.subheadline}
              </p>
            </div>

            <div className="rounded-3xl p-8 lg:p-10" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(247, 254, 251, 0.9) 100%)',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              border: '2px solid rgba(16, 185, 129, 0.2)'
            }}>
              <p className="text-lg lg:text-xl text-emerald-800/90 leading-relaxed text-center">
                {currentSlide.description}
              </p>
            </div>

            {currentSlide.isLast && (
              <div className="rounded-2xl p-6" style={{
                background: 'linear-gradient(135deg, rgba(255, 251, 235, 0.8) 0%, rgba(254, 249, 231, 0.7) 100%)',
                border: '2px solid rgba(251, 191, 36, 0.3)'
              }}>
                <p className="text-base lg:text-lg text-amber-900/80 leading-relaxed text-center">
                  <span className="font-bold">ملاحظة:</span> لا نذكر أرقامًا ثابتة لأننا نؤمن بالمرونة. هدفنا أن يكون أثرك دائمًا، وأن تنمو مكافأتك مع نمو المنصة.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t border-emerald-200/50 z-20" style={{
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 252, 251, 0.95) 100%)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
          <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
            {currentSlide.isLast ? (
              <button
                onClick={handleComplete}
                className="w-full rounded-2xl py-4 px-6 font-black text-white text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
                  border: '2px solid rgba(5, 150, 105, 0.5)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="relative flex items-center justify-center gap-3">
                  <Handshake className="w-6 h-6" strokeWidth={2.5} />
                  <span>أرغب أن أكون شريك نجاح</span>
                </div>
              </button>
            ) : (
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(247, 254, 251, 0.85) 100%)',
                      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.2)',
                      border: '2px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <ChevronRight className="w-6 h-6 text-emerald-700" strokeWidth={2.5} />
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex-1 rounded-2xl py-4 px-6 font-black text-white text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
                    border: '2px solid rgba(5, 150, 105, 0.5)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>
                  <div className="relative flex items-center justify-center gap-3">
                    <span>التالي</span>
                    <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" strokeWidth={3} />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
