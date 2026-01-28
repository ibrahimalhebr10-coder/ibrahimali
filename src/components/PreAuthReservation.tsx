import { CheckCircle2, Sparkles, TreePine, Award, ArrowLeft } from 'lucide-react';

interface PreAuthReservationProps {
  farmName: string;
  totalTrees: number;
  totalPrice: number;
  contractName: string;
  onContinue: () => void;
  onGoBack?: () => void;
}

export default function PreAuthReservation({
  farmName,
  totalTrees,
  totalPrice,
  contractName,
  onContinue,
  onGoBack
}: PreAuthReservationProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 z-[100] flex items-center justify-center p-3">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden animate-fadeIn max-h-[95vh] flex flex-col">
        {/* شريط النجاح العلوي */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500"></div>

        {/* المحتوى القابل للتمرير */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* أيقونة النجاح */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg mb-2">
              <CheckCircle2 className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-xl font-black text-green-700 mb-1">
              تم حجز أشجارك مبدئياً
            </h1>
            <div className="inline-flex items-center gap-1.5 bg-green-100 px-3 py-1 rounded-full border border-green-300">
              <Sparkles className="w-3.5 h-3.5 text-green-700" />
              <p className="text-xs font-bold text-green-800">حجز مؤقت ومحفوظ</p>
            </div>
          </div>

          {/* الرسالة التوضيحية */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
            <p className="text-sm text-gray-700 text-center leading-relaxed">
              <span className="font-bold text-green-700">أشجارك محفوظة الآن</span>، أكمل إنشاء حسابك لحفظ الحجز بشكل دائم
            </p>
          </div>

          {/* ملخص الحجز المدمج */}
          <div className="space-y-2.5">
            <h3 className="text-center text-xs font-bold text-gray-600 uppercase tracking-wide">ملخص حجزك</h3>

            {/* صف واحد للمزرعة والعقد */}
            <div className="grid grid-cols-2 gap-2">
              {/* المزرعة */}
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium">المزرعة</p>
                </div>
                <p className="text-xs font-black text-gray-900 leading-tight break-words">{farmName}</p>
              </div>

              {/* العقد */}
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium">العقد</p>
                </div>
                <p className="text-xs font-black text-gray-900 leading-tight break-words">{contractName}</p>
              </div>
            </div>

            {/* الأشجار */}
            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <TreePine className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-medium">عدد الأشجار</p>
                    <p className="text-base font-black text-gray-900">{totalTrees} شجرة</p>
                  </div>
                </div>
              </div>
            </div>

            {/* الإجمالي */}
            <div className="bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 rounded-xl p-4 shadow-lg">
              <div className="text-center">
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-0.5">الإجمالي المطلوب</p>
                <p className="text-3xl font-black text-white mb-0.5">{(totalPrice || 0).toLocaleString()}</p>
                <p className="text-xs font-bold text-white/90">ريال سعودي</p>
              </div>
            </div>
          </div>

          {/* ملاحظة مختصرة */}
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  لضمان عدم فقدان حجزك، يرجى إكمال إنشاء الحساب الآن
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* منطقة الزر الثابتة في الأسفل */}
        <div className="p-4 bg-white border-t border-gray-100 space-y-2">
          {/* زر المتابعة */}
          <button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 hover:from-green-700 hover:via-green-600 hover:to-emerald-700 text-white font-black py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 text-base group"
          >
            <span>إنشاء حسابي الآن</span>
            <ArrowLeft className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* زر الرجوع */}
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 flex items-center justify-center gap-2 text-sm group"
            >
              <ArrowLeft className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
              <span>تعديل الحجز</span>
            </button>
          )}

          {/* نص تشجيعي */}
          <p className="text-center text-[11px] text-gray-500">
            خطوة واحدة فقط تفصلك عن امتلاك أشجارك
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
