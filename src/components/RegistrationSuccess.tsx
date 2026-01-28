import { CheckCircle2, Sparkles, ArrowLeft, TreePine } from 'lucide-react';

interface RegistrationSuccessProps {
  onClose: () => void;
}

export default function RegistrationSuccess({ onClose }: RegistrationSuccessProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
        <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-4 animate-bounce">
              <CheckCircle2 className="w-14 h-14 text-white" />
            </div>
            <h2 className="text-3xl font-black mb-2">
              مبروك! تم إنشاء حسابك بنجاح
            </h2>
            <p className="text-green-50 text-lg">
              حجزك الآن محفوظ باسمك في النظام
            </p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <TreePine className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-green-800 mb-2">ما التالي؟</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                    <p className="flex-1">حجزك الآن في حالة <span className="font-bold text-green-700">قيد المراجعة</span></p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                    <p className="flex-1">سيتم مراجعة حجزك من قبل الإدارة</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                    <p className="flex-1">عند الموافقة، ستتمكن من إتمام عملية الدفع</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                    <p className="flex-1">يمكنك متابعة حجزك من صفحة <span className="font-bold text-green-700">حسابي</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900 mb-1">نصيحة</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  سنرسل لك إشعاراً عندما يتم مراجعة حجزك. تأكد من التحقق من رسائلك بانتظام.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 hover:from-green-700 hover:via-green-600 hover:to-emerald-700 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-green-300 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 text-lg group"
          >
            <span>عرض حجوزاتي</span>
            <ArrowLeft className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
