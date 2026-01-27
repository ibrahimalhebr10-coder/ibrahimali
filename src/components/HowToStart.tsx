import { useState, useEffect } from 'react';
import { X, Leaf, Clock, CreditCard, MessageCircle, Check, ChevronLeft, ChevronRight, TreeDeciduous, User, FileText, Phone, UserCheck, Sparkles } from 'lucide-react';

interface HowToStartProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
}

const steps = [
  {
    number: 1,
    icon: TreeDeciduous,
    title: 'اختر مزرعتك',
    description: 'تصفح المزارع المتاحة واختر نوع الأشجار'
  },
  {
    number: 2,
    icon: Leaf,
    title: 'أسس مزرعتك',
    description: 'حدد عدد الأشجار ومدة الاستثمار'
  },
  {
    number: 3,
    icon: FileText,
    title: 'راجع الملخص',
    description: 'تأكد من تفاصيل مزرعتك قبل الحجز'
  },
  {
    number: 4,
    icon: Phone,
    title: 'بيانات التواصل',
    description: 'أدخل اسمك ورقم جوالك فقط'
  },
  {
    number: 5,
    icon: UserCheck,
    title: 'حسابك جاهز',
    description: 'تابع مزرعتك واستلم محصولك'
  }
];

function Step1Preview() {
  return (
    <div className="relative w-full">
      <div className="flex gap-2 justify-center">
        {[
          { name: 'زيتون', color: '#4A7C59', icon: '🫒' },
          { name: 'نخيل', color: '#8B7355', icon: '🌴' },
          { name: 'حمضيات', color: '#F5A623', icon: '🍊' }
        ].map((farm, i) => (
          <div
            key={i}
            className="w-16 rounded-xl overflow-hidden transition-all duration-300"
            style={{
              background: '#fff',
              boxShadow: i === 0 ? '0 4px 20px rgba(74, 124, 89, 0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
              transform: i === 0 ? 'scale(1.08)' : 'scale(1)',
              border: i === 0 ? '2px solid #4A7C59' : '1px solid #E5E7EB'
            }}
          >
            <div
              className="h-12 flex items-center justify-center text-xl"
              style={{ background: `${farm.color}15` }}
            >
              {farm.icon}
            </div>
            <div className="p-1.5 text-center">
              <span className="text-[9px] font-bold text-gray-700 block">{farm.name}</span>
              {i === 0 && (
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-[#4A7C59]" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center">
        <div className="px-3 py-1 rounded-full bg-[#4A7C59]/10 border border-[#4A7C59]/20">
          <span className="text-[10px] text-[#4A7C59] font-medium">اختر نوع المزرعة</span>
        </div>
      </div>
    </div>
  );
}

function Step2Preview() {
  return (
    <div className="w-full max-w-[220px] mx-auto">
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: '#fff',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}
      >
        <div
          className="h-16 relative flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #4A7C59 0%, #6B9B7A 100%)' }}
        >
          <TreeDeciduous className="w-8 h-8 text-white/40" />
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-[#D4AF37]">
            <span className="text-[8px] text-white font-bold">زيتون</span>
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500">عدد الأشجار</span>
            <div className="flex items-center gap-1">
              <button className="w-5 h-5 rounded bg-gray-100 text-gray-400 text-xs">-</button>
              <span className="text-xs font-bold text-[#2F5233] w-6 text-center">25</span>
              <button className="w-5 h-5 rounded bg-[#2F5233] text-white text-xs">+</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500">مدة الاستثمار</span>
            <div className="flex gap-1">
              {[3, 5, 7].map((y) => (
                <span
                  key={y}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                  style={{
                    background: y === 5 ? '#2F5233' : '#F3F4F6',
                    color: y === 5 ? '#fff' : '#6B7280'
                  }}
                >
                  {y} سنوات
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step3Preview() {
  return (
    <div className="w-full max-w-[200px] mx-auto">
      <div
        className="rounded-xl p-3"
        style={{
          background: '#fff',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}
      >
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-[#4A7C59]/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#4A7C59]" />
          </div>
          <span className="text-xs font-bold text-gray-800">ملخص مزرعتك</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between py-1">
            <span className="text-[10px] text-gray-500">نوع المزرعة</span>
            <span className="text-[10px] font-bold text-[#2F5233]">زيتون</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[10px] text-gray-500">عدد الأشجار</span>
            <span className="text-[10px] font-bold text-[#2F5233]">25 شجرة</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[10px] text-gray-500">المدة</span>
            <span className="text-[10px] font-bold text-[#2F5233]">5 سنوات</span>
          </div>
          <div
            className="flex items-center justify-between p-2 rounded-lg mt-1"
            style={{ background: 'linear-gradient(135deg, #2F5233 0%, #3D6B42 100%)' }}
          >
            <span className="text-[10px] text-white/80">الإجمالي</span>
            <span className="text-xs font-bold text-[#D4AF37]">12,500 ر.س</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step4Preview() {
  return (
    <div className="w-full max-w-[200px] mx-auto">
      <div
        className="rounded-xl p-3"
        style={{
          background: '#fff',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-[#2F5233]/10 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-[#2F5233]" />
          </div>
          <span className="text-xs font-bold text-gray-800">بيانات بسيطة</span>
        </div>

        <div className="space-y-2">
          <div className="p-2 rounded-lg border border-[#2F5233]/30 bg-[#2F5233]/5">
            <span className="text-[10px] text-gray-400 block mb-0.5">الاسم الكامل</span>
            <span className="text-xs text-gray-700">محمد أحمد</span>
          </div>
          <div className="p-2 rounded-lg border border-gray-200 bg-gray-50/50">
            <span className="text-[10px] text-gray-400 block mb-0.5">رقم الجوال</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-700 font-mono">05X XXX XXXX</span>
              <span className="text-[8px] px-1 py-0.5 rounded bg-gray-200 text-gray-500">966+</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#2F5233]">
            <Check className="w-3 h-3" />
            <span>فقط هذه البيانات مطلوبة!</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step5Preview() {
  return (
    <div className="w-full max-w-[200px] mx-auto">
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: '#fff',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}
      >
        <div
          className="p-3 text-center"
          style={{ background: 'linear-gradient(135deg, #2F5233 0%, #3D6B42 100%)' }}
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-1">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-[11px] font-bold text-white block">أهلاً محمد!</span>
          <span className="text-[9px] text-white/70">حسابك جاهز</span>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="text-center p-2 rounded-lg bg-[#2F5233]/5">
              <span className="text-[10px] font-bold text-[#2F5233] block">1</span>
              <span className="text-[8px] text-gray-500">مزرعة</span>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#D4AF37]/10">
              <span className="text-[10px] font-bold text-[#D4AF37] block">25</span>
              <span className="text-[8px] text-gray-500">شجرة</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1 text-[9px] text-[#2F5233]">
            <Sparkles className="w-3 h-3" />
            <span>ابدأ متابعة مزرعتك الآن</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const stepPreviews = [Step1Preview, Step2Preview, Step3Preview, Step4Preview, Step5Preview];

export default function HowToStart({ isOpen, onClose, onStart }: HowToStartProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isOpen || !isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, isAutoPlaying]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsAutoPlaying(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStart = () => {
    setIsStarting(true);
    setTimeout(() => {
      setIsStarting(false);
      onClose();
      onStart();
    }, 800);
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/966500000000', '_blank');
  };

  const goToStep = (index: number) => {
    setCurrentStep(index);
    setIsAutoPlaying(false);
  };

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % steps.length);
    setIsAutoPlaying(false);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
    setIsAutoPlaying(false);
  };

  const CurrentPreview = stepPreviews[currentStep];
  const currentStepData = steps[currentStep];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      dir="rtl"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden animate-scale-in"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAF8 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-32"
          style={{
            background: 'linear-gradient(135deg, #1E3A22 0%, #2F5233 50%, #3D6B42 100%)'
          }}
        />

        <div
          className="absolute top-0 left-0 right-0 h-32 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative p-5">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 hover:bg-white/20"
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div
              className="px-3 py-1 rounded-full flex items-center gap-1.5"
              style={{
                background: 'rgba(212, 175, 55, 0.2)',
                border: '1px solid rgba(212, 175, 55, 0.3)'
              }}
            >
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span className="text-[10px] text-[#D4AF37] font-bold">5 خطوات فقط</span>
            </div>
          </div>

          <div className="text-center mb-2">
            <h2 className="text-lg font-bold text-white mb-2">
              رحلتك لامتلاك مزرعة
            </h2>
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-white/90" />
                <span className="text-[11px] text-white/90 font-medium">أقل من دقيقتين</span>
              </div>
              <div className="w-px h-3 bg-white/20" />
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-white/90" />
                <span className="text-[11px] text-white/90 font-medium">بدون دفع مسبق</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-center justify-center gap-1 mb-4 -mt-1">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center"
              >
                <button
                  onClick={() => goToStep(idx)}
                  className="relative transition-all duration-300"
                  style={{
                    width: '28px',
                    height: '28px',
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-full transition-all duration-300 flex items-center justify-center"
                    style={{
                      background: currentStep === idx
                        ? 'linear-gradient(135deg, #D4AF37 0%, #C9A227 100%)'
                        : idx < currentStep
                          ? '#2F5233'
                          : '#E5E7EB',
                      transform: currentStep === idx ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: currentStep === idx ? '0 4px 12px rgba(212, 175, 55, 0.4)' : 'none'
                    }}
                  >
                    {idx < currentStep ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : (
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: currentStep === idx ? '#fff' : idx < currentStep ? '#fff' : '#9CA3AF' }}
                      >
                        {step.number}
                      </span>
                    )}
                  </div>
                </button>
                {idx < steps.length - 1 && (
                  <div
                    className="w-4 h-0.5 transition-all duration-300"
                    style={{
                      background: idx < currentStep ? '#2F5233' : '#E5E7EB'
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <div
            className="rounded-2xl p-4 mb-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #FAFCFA 0%, #F0F4F0 100%)',
              border: '1px solid #E0E8E0'
            }}
          >
            <div
              className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-30"
              style={{
                background: 'radial-gradient(circle, #2F5233 0%, transparent 70%)',
                transform: 'translate(30%, -30%)'
              }}
            />

            <div className="flex items-center justify-between mb-3 relative">
              <button
                onClick={nextStep}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <ChevronRight className="w-4 h-4 text-[#2F5233]" />
              </button>

              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                  style={{
                    background: 'linear-gradient(135deg, #2F5233 0%, #3D6B42 100%)',
                    boxShadow: '0 4px 12px rgba(47, 82, 51, 0.3)'
                  }}
                >
                  <currentStepData.icon className="w-5 h-5 text-white" />
                  <div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ background: '#D4AF37' }}
                  >
                    {currentStepData.number}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-800 block">{currentStepData.title}</span>
                  <span className="text-[10px] text-gray-500">{currentStepData.description}</span>
                </div>
              </div>

              <button
                onClick={prevStep}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4 text-[#2F5233]" />
              </button>
            </div>

            <div
              className="min-h-[165px] flex items-center justify-center py-3"
              key={currentStep}
              style={{
                animation: 'preview-slide-in 0.4s ease-out'
              }}
            >
              <CurrentPreview />
            </div>

            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ background: '#E5E7EB' }}
            >
              <div
                className="h-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                  background: 'linear-gradient(90deg, #2F5233 0%, #D4AF37 100%)'
                }}
              />
            </div>
          </div>

          <div className="relative">
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="w-full py-3.5 rounded-2xl font-bold text-base text-white transition-all duration-300 active:scale-[0.98] relative overflow-hidden"
              style={{
                background: isStarting
                  ? 'linear-gradient(135deg, #2F5233 0%, #3D6B42 100%)'
                  : 'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)',
                boxShadow: isStarting
                  ? '0 6px 20px rgba(47, 82, 51, 0.35)'
                  : '0 6px 20px rgba(212, 175, 55, 0.4)'
              }}
            >
              {!isStarting && (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                    animation: 'shimmer 2s infinite'
                  }}
                />
              )}
              {isStarting ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  جاري البدء...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  ابدأ رحلتك الآن
                  <Leaf className="w-4 h-4" />
                </span>
              )}
            </button>

            <div
              className="text-center mt-2 overflow-hidden transition-all duration-300"
              style={{
                maxHeight: isStarting ? '30px' : '0',
                opacity: isStarting ? 1 : 0
              }}
            >
              <p className="text-sm text-[#2F5233] font-medium flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                مزرعتك في انتظارك
              </p>
            </div>
          </div>

          <p className="text-center text-[11px] text-gray-400 mt-2.5">
            بدون التزام • يمكنك التصفح والاستكشاف أولاً
          </p>

          <button
            onClick={handleWhatsApp}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all hover:bg-[#25D366]/5 active:scale-[0.98]"
            style={{ border: '1px solid #E5E7EB' }}
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span className="text-xs text-gray-600">تحتاج مساعدة؟ تواصل معنا</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes preview-slide-in {
          from {
            opacity: 0;
            transform: translateX(-15px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
