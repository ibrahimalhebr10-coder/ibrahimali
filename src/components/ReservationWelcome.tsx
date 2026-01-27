import { Sparkles, ArrowLeft, TreePine } from 'lucide-react';

interface ReservationWelcomeProps {
  farmName: string;
  totalTrees: number;
  totalPrice: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function ReservationWelcome({
  farmName,
  totalTrees,
  totalPrice,
  onContinue,
  onBack
}: ReservationWelcomeProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-scale-in">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-black mb-2">مبارك عليك!</h2>
            <p className="text-green-50 text-lg">أنت على بُعد خطوة واحدة من تأمين استثمارك</p>
          </div>
        </div>

        <div className="p-8">
          <div className="space-y-4 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <TreePine className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">ملخص حجزك</h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">المزرعة:</span>
                  <span className="font-bold text-gray-900">{farmName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">عدد الأشجار:</span>
                  <span className="font-bold text-green-600">{totalTrees} شجرة</span>
                </div>
                <div className="h-px bg-green-200 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">الإجمالي:</span>
                  <span className="text-2xl font-black text-green-700">{totalPrice.toLocaleString()} ر.س</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-blue-900 leading-relaxed">
                <span className="font-bold">لإتمام حجزك:</span> سنحتاج منك إنشاء حساب سريع باستخدام رقم جوالك.
                لن يتم خصم أي مبلغ الآن، وسيظل حجزك محفوظاً حتى تُكمل عملية السداد لاحقاً.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              رجوع
            </button>
            <button
              onClick={onContinue}
              className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
            >
              متابعة الحجز
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
