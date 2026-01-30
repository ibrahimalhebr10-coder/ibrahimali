import { CheckCircle2, TrendingUp, ArrowLeft } from 'lucide-react';

interface InvestorWelcomeScreenProps {
  investorName: string;
  onGoToAccount: () => void;
}

export default function InvestorWelcomeScreen({ investorName, onGoToAccount }: InvestorWelcomeScreenProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50/98 via-emerald-50/95 to-teal-50/98 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="max-w-lg w-full space-y-6">
          <div className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-green-300/50 space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <CheckCircle2 className="w-14 h-14 text-white" />
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-green-800">
                  مرحبًا بك في حساب المستثمر
                </h1>
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
                  <p className="text-xl font-bold text-[#B8942F]">{investorName}</p>
                </div>
                <p className="text-lg font-semibold text-green-700">
                  استثمار أشجارك أصبح نشطًا
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 space-y-4 border-2 border-green-200">
              <div className="text-center space-y-3">
                <p className="text-base text-gray-700 leading-relaxed">
                  تم تفعيل حسابك الاستثماري بنجاح وربط استثمار أشجارك به
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-green-700 font-semibold bg-green-100 rounded-lg py-2 px-4">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حسابك جاهز للاستخدام الآن</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-[#D4AF37]/30 space-y-3">
              <h3 className="text-lg font-bold text-[#B8942F] text-center">
                ماذا بعد؟
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>متابعة حالة استثمارك ومراحل نمو أشجارك</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>استقبال تحديثات دورية عن المزرعة</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>مراقبة العوائد المتوقعة</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>إدارة حسابك وبياناتك الشخصية</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onGoToAccount}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>ادخل إلى حسابي</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
