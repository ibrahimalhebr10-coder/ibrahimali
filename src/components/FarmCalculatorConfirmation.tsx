import { useState } from 'react';
import { CheckCircle, ArrowRight, ChevronRight, Leaf } from 'lucide-react';

interface FarmCalculatorConfirmationProps {
  calculatorData: {
    farmId?: string;
    farmName?: string;
    duration: number;
    trees: Array<{ treeType: any; quantity: number }>;
    totalPrice: number;
    freeDuration: number;
    totalDuration: number;
    contractId?: string;
    contractName?: string;
  };
  onComplete: () => void;
  onBack: () => void;
  onGoHome: () => void;
  onOpenPendingReservations?: () => void;
}

type Step = 'congratulations' | 'success';

export default function FarmCalculatorConfirmation({
  calculatorData,
  onComplete,
  onBack,
  onGoHome
}: FarmCalculatorConfirmationProps) {
  const [step, setStep] = useState<Step>('congratulations');

  const totalTrees = calculatorData.trees.reduce((sum, item) => sum + item.quantity, 0);

  const handleContinue = () => {
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-stone-50 to-white overflow-hidden animate-fade-in" dir="rtl">
      <div
        className="sticky top-0 z-10 px-4 py-3"
        style={{
          background: 'linear-gradient(to bottom, rgba(250,247,242,0.98) 0%, rgba(250,247,242,0.95) 100%)',
          borderBottom: '1px solid rgba(139,116,71,0.15)'
        }}
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-1 px-3 py-2 rounded-xl transition-all active:scale-95"
            style={{ background: 'rgba(93,78,55,0.08)' }}
          >
            <ChevronRight className="w-5 h-5" style={{ color: '#5D4E37' }} />
            <span className="text-sm font-medium" style={{ color: '#5D4E37' }}>رجوع</span>
          </button>

          <button
            onClick={onGoHome}
            className="flex items-center gap-2 transition-all active:scale-95"
          >
            <span className="text-lg font-bold" style={{ color: '#2F5233' }}>جود</span>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #3AA17E 0%, #2F5233 100%)',
                boxShadow: '0 2px 8px rgba(58,161,126,0.3)'
              }}
            >
              <Leaf className="w-5 h-5 text-white" />
            </div>
          </button>
        </div>
      </div>

      <div className="h-[calc(100%-60px)] overflow-y-auto">
        {step === 'congratulations' && (
          <div className="min-h-full flex flex-col p-6 pt-8">
            <div className="flex-1 flex flex-col items-center text-center space-y-6 max-w-lg mx-auto">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center animate-scale-in"
                style={{
                  background: 'linear-gradient(135deg, #3AA17E 0%, #2F5233 100%)',
                  boxShadow: '0 8px 24px rgba(58,161,126,0.3)'
                }}
              >
                <span className="text-5xl">🌿</span>
              </div>

              <h1
                className="text-3xl font-bold animate-fade-in-up"
                style={{ color: '#2F5233', animationDelay: '0.1s' }}
              >
                مبروك، تم احتساب مزرعتك بنجاح
              </h1>

              <div
                className="space-y-3 text-base leading-relaxed animate-fade-in-up"
                style={{ color: '#5D4E37', animationDelay: '0.2s' }}
              >
                <p className="font-medium">
                  هذا الحساب التقديري لتأسيس مزرعتك.
                </p>
                <p>
                  يمكنك الآن مراجعة التفاصيل والتواصل معنا لإكمال الإجراءات.
                </p>
              </div>

              <div
                className="w-full rounded-2xl p-6 space-y-4 animate-fade-in-up"
                style={{
                  background: 'linear-gradient(135deg, rgba(232,224,213,0.6) 0%, rgba(212,196,176,0.4) 100%)',
                  border: '2px solid rgba(139,116,71,0.3)',
                  animationDelay: '0.3s'
                }}
              >
                <h3 className="font-bold text-lg text-center" style={{ color: '#2F5233' }}>
                  ملخص مزرعتك
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span style={{ color: '#5D4E37' }}>مدة العقد</span>
                    <span className="font-bold" style={{ color: '#2F5233' }}>
                      {calculatorData.duration} {calculatorData.duration === 1 ? 'سنة' : 'سنوات'}
                    </span>
                  </div>

                  {calculatorData.freeDuration > 0 && (
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#5D4E37' }}>المدة المجانية</span>
                      <span className="font-bold" style={{ color: '#F59E0B' }}>
                        {calculatorData.freeDuration} {calculatorData.freeDuration === 1 ? 'سنة' : 'سنوات'}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span style={{ color: '#5D4E37' }}>إجمالي مدة الانتفاع</span>
                    <span className="font-bold" style={{ color: '#2F5233' }}>
                      {calculatorData.totalDuration} {calculatorData.totalDuration === 1 ? 'سنة' : 'سنوات'}
                    </span>
                  </div>

                  {calculatorData.trees.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span style={{ color: '#5D4E37' }}>
                        {item.treeType.name} {item.treeType.subtitle}
                      </span>
                      <span className="font-bold" style={{ color: '#2F5233' }}>
                        {item.quantity} شجرة
                      </span>
                    </div>
                  ))}

                  <div
                    className="pt-3 border-t-2 flex justify-between items-center"
                    style={{ borderColor: 'rgba(139,116,71,0.3)' }}
                  >
                    <span className="font-bold" style={{ color: '#2F5233' }}>إجمالي الأشجار</span>
                    <span className="font-bold text-xl" style={{ color: '#2F5233' }}>
                      {totalTrees} شجرة
                    </span>
                  </div>

                  <div
                    className="pt-3 border-t-2 flex justify-between items-center"
                    style={{ borderColor: 'rgba(139,116,71,0.3)' }}
                  >
                    <span className="font-bold" style={{ color: '#2F5233' }}>السعر الإجمالي</span>
                    <span className="font-bold text-xl" style={{ color: '#2F5233' }}>
                      {calculatorData.totalPrice.toLocaleString()} ر.س
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="space-y-3 animate-fade-in-up"
                style={{ animationDelay: '0.4s' }}
              >
                <p className="text-base leading-relaxed" style={{ color: '#5D4E37' }}>
                  لإكمال الحجز والتواصل معنا،<br />
                  يرجى التواصل عبر قنواتنا الرسمية.
                </p>
              </div>

              <button
                onClick={handleContinue}
                className="w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition-transform active:scale-[0.98] animate-fade-in-up"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F9A825 50%, #D4AF37 100%)',
                  boxShadow: '0 6px 20px rgba(212,175,55,0.5)',
                  animationDelay: '0.5s'
                }}
              >
                تم
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="min-h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-6">
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center mx-auto animate-scale-in"
                style={{
                  background: 'linear-gradient(135deg, #3AA17E 0%, #2F5233 100%)',
                  boxShadow: '0 8px 32px rgba(58,161,126,0.4)'
                }}
              >
                <CheckCircle className="w-16 h-16 text-white" />
              </div>

              <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="text-4xl mb-2">🎉</div>
                <h2 className="text-3xl font-bold" style={{ color: '#2F5233' }}>
                  شكراً لاهتمامك
                </h2>
                <p className="text-base leading-relaxed" style={{ color: '#5D4E37' }}>
                  تم احتساب مزرعتك بنجاح<br />
                  تواصل معنا لإكمال الإجراءات
                </p>
              </div>

              <div
                className="rounded-2xl p-5 animate-fade-in-up"
                style={{
                  background: 'linear-gradient(135deg, rgba(232,224,213,0.6) 0%, rgba(212,196,176,0.4) 100%)',
                  border: '2px solid rgba(139,116,71,0.3)',
                  animationDelay: '0.2s'
                }}
              >
                <p className="text-sm mb-2" style={{ color: '#5D4E37' }}>مجموع الأشجار</p>
                <p className="text-2xl font-bold" style={{ color: '#2F5233' }}>
                  {totalTrees} شجرة
                </p>
              </div>

              <button
                onClick={() => {
                  onComplete();
                }}
                className="w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2 animate-fade-in-up"
                style={{
                  background: 'linear-gradient(135deg, #2F5233 0%, #3AA17E 100%)',
                  boxShadow: '0 6px 20px rgba(58,161,126,0.4)',
                  animationDelay: '0.3s'
                }}
              >
                <span>العودة للرئيسية</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes fade-in-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
          animation-fill-mode: both;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
