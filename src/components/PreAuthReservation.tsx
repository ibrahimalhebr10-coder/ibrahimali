import { CheckCircle2, Sparkles, TreePine, Award, ArrowLeft, Shield } from 'lucide-react';

interface PreAuthReservationProps {
  farmName: string;
  totalTrees: number;
  totalPrice: number;
  contractName: string;
  onContinue: () => void;
}

export default function PreAuthReservation({
  farmName,
  totalTrees,
  totalPrice,
  contractName,
  onContinue
}: PreAuthReservationProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-fadeIn">
        {/* شريط النجاح العلوي */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500"></div>

        <div className="p-8 space-y-6">
          {/* أيقونة النجاح الكبيرة */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl shadow-green-300 mb-4 animate-bounce">
              <CheckCircle2 className="w-14 h-14 text-white" />
            </div>
          </div>

          {/* العنوان الرئيسي */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
              🌿 تم حجز أشجارك مبدئياً
            </h1>
            <div className="inline-block">
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-full border-2 border-green-300">
                <p className="text-sm font-bold text-green-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  حجز مؤقت ومحفوظ
                </p>
              </div>
            </div>
          </div>

          {/* الرسالة النفسية */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-base text-gray-800 leading-relaxed">
                  <span className="font-black text-green-700">أشجارك محفوظة الآن</span>، والخطوة التالية هي إنشاء حسابك لحفظ هذا الحجز باسمك بشكل دائم.
                </p>
              </div>
            </div>
          </div>

          {/* ملخص الحجز */}
          <div className="space-y-3">
            <h3 className="text-center text-sm font-bold text-gray-700 uppercase tracking-wide">ملخص حجزك المؤقت</h3>

            {/* المزرعة */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">المزرعة</p>
                    <p className="text-base font-black text-gray-900">{farmName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* العقد */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">العقد المختار</p>
                    <p className="text-base font-black text-gray-900">{contractName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* الأشجار */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <TreePine className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">عدد الأشجار</p>
                    <p className="text-base font-black text-gray-900">{totalTrees} شجرة</p>
                  </div>
                </div>
              </div>
            </div>

            {/* الإجمالي */}
            <div className="bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 rounded-2xl p-5 shadow-xl shadow-green-200">
              <div className="text-center">
                <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">الإجمالي المطلوب</p>
                <p className="text-4xl font-black text-white mb-1">{totalPrice.toLocaleString()}</p>
                <p className="text-sm font-bold text-white/90">ريال سعودي</p>
              </div>
            </div>
          </div>

          {/* ملاحظة هامة */}
          <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900 mb-1">ملاحظة هامة</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  حجزك محفوظ مؤقتاً في جلستك الحالية. لضمان عدم فقدان حجزك، يرجى إكمال إنشاء الحساب الآن.
                </p>
              </div>
            </div>
          </div>

          {/* زر المتابعة */}
          <button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 hover:from-green-700 hover:via-green-600 hover:to-emerald-700 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-green-300 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 text-lg group"
          >
            <span>إنشاء حسابي الآن</span>
            <ArrowLeft className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* نص تشجيعي */}
          <p className="text-center text-xs text-gray-500 leading-relaxed">
            خطوة واحدة فقط تفصلك عن امتلاك أشجارك 🌳
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
