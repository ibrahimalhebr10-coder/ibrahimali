import { useState } from 'react';
import { Gift, Sparkles, CheckCircle, X, AlertCircle } from 'lucide-react';
import { influencerMarketingService } from '../services/influencerMarketingService';

interface InfluencerCodeInputProps {
  onCodeEntered: (code: string) => void;
  featuredColor?: string;
}

export default function InfluencerCodeInput({ onCodeEntered, featuredColor = '#FFD700' }: InfluencerCodeInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showCongrats, setShowCongrats] = useState(false);
  const [enteredName, setEnteredName] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasEnteredCode, setHasEnteredCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const result = await influencerMarketingService.verifyInfluencerCode(inputValue.trim());

      if (!result.isValid) {
        setErrorMessage(result.message);
        setIsVerifying(false);
        return;
      }

      const code = inputValue.trim();
      setEnteredName(code);
      setHasEnteredCode(true);

      sessionStorage.setItem('influencer_code', code);
      sessionStorage.setItem('influencer_activated_at', new Date().toISOString());

      setIsAnimating(true);
      setShowCongrats(true);

      setTimeout(() => {
        onCodeEntered(code);
        setIsAnimating(false);
      }, 500);
    } catch (err) {
      console.error('خطأ في التحقق من الكود:', err);
      setErrorMessage('حدث خطأ أثناء التحقق من الكود، يرجى المحاولة مرة أخرى');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCloseCongrats = () => {
    setShowCongrats(false);
  };

  const handleReset = () => {
    setInputValue('');
    setEnteredName('');
    setHasEnteredCode(false);
    setErrorMessage(null);
    sessionStorage.removeItem('influencer_code');
    sessionStorage.removeItem('influencer_activated_at');
    sessionStorage.removeItem('featured_package_active');
  };

  return (
    <>
      <div className="w-full bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center animate-pulse">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800">
              هل لديك كود من شريك المسيرة؟
            </h3>
            <p className="text-sm text-slate-600">
              {hasEnteredCode
                ? `تم تفعيل الكود: ${enteredName}`
                : 'أدخل الكود للحصول على باقة مميزة بمزايا إضافية'
              }
            </p>
          </div>
          {hasEnteredCode && (
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-white border-2 border-amber-300 rounded-lg hover:bg-amber-50 transition-colors text-amber-700 font-medium text-sm flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              مسح
            </button>
          )}
        </div>

        {!hasEnteredCode && (
          <>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="مثال: احمد_المزارع"
                className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white text-slate-800 placeholder-slate-400 font-medium ${
                  errorMessage
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-amber-200 focus:border-amber-500'
                }`}
                dir="rtl"
                disabled={isVerifying}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isVerifying}
                className={`px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 flex items-center gap-2 ${
                  inputValue.trim() && !isVerifying
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>جاري التحقق...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    إدخال
                  </>
                )}
              </button>
            </form>

            {errorMessage && (
              <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-shake">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-sm font-medium text-red-700">{errorMessage}</span>
              </div>
            )}

            {!errorMessage && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>يمكنك إدخال الكود في أي وقت</span>
              </div>
            )}
          </>
        )}

        {hasEnteredCode && (
          <div className="flex items-center gap-2 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-700 font-medium">
              تم تفعيل الباقة المميزة! تحقق من العرض أدناه
            </span>
          </div>
        )}
      </div>

      {showCongrats && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div
            className={`bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all duration-500 ${
              isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
            }`}
            style={{
              animation: isAnimating ? 'none' : 'bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            }}
          >
            <div
              className="p-8 text-center relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${featuredColor}15 0%, ${featuredColor}30 100%)`
              }}
            >
              <button
                onClick={handleCloseCongrats}
                className="absolute top-4 left-4 p-2 hover:bg-white/50 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>

              <div className="relative z-10">
                <div className="inline-block mb-6 relative">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center shadow-xl animate-pulse"
                    style={{ backgroundColor: featuredColor }}
                  >
                    <Gift className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <Sparkles className="w-5 h-5" style={{ color: featuredColor }} />
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-slate-800 mb-3 animate-bounce">
                  مبروووك! 🎉
                </h2>

                <div
                  className="inline-block px-6 py-3 rounded-full text-white font-bold text-lg mb-4 shadow-lg"
                  style={{ backgroundColor: featuredColor }}
                >
                  {enteredName}
                </div>

                <p className="text-xl text-slate-700 mb-6 leading-relaxed">
                  تم فتح باقة مميزة خصيصاً لك!
                  <br />
                  <span className="font-bold" style={{ color: featuredColor }}>
                    احصل على 6 أشهر إضافية مجاناً
                  </span>
                </p>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: `${featuredColor}40` }}></div>
                    <Sparkles className="w-6 h-6" style={{ color: featuredColor }} />
                    <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: `${featuredColor}40` }}></div>
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">مزايا الباقة المميزة:</h3>
                  <ul className="text-right space-y-2 text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: featuredColor }} />
                      <span>6 أشهر إضافية على مدة العقد</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: featuredColor }} />
                      <span>نفس السعر بدون زيادة</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: featuredColor }} />
                      <span>أولوية في الخدمات</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleCloseCongrats}
                  className="px-8 py-4 rounded-xl text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${featuredColor} 0%, ${adjustColor(featuredColor, -20)} 100%)`
                  }}
                >
                  ابدأ الحجز الآن
                </button>
              </div>

              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30" style={{ backgroundColor: featuredColor }}></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ backgroundColor: featuredColor }}></div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(5px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </>
  );
}

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
