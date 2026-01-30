import { CheckCircle2, TreePine, MapPin, Calendar, FileText, LogIn, Sparkles } from 'lucide-react';
import { useState } from 'react';
import TemporaryCertificate from './TemporaryCertificate';

interface PaymentSuccessScreenProps {
  reservationId: string;
  farmName: string;
  treeCount: number;
  durationYears: number;
  bonusYears: number;
  totalPrice: number;
  investmentNumber: string;
  onGoToAccount: () => void;
}

export default function PaymentSuccessScreen({
  reservationId,
  farmName,
  treeCount,
  durationYears,
  bonusYears,
  totalPrice,
  investmentNumber,
  onGoToAccount
}: PaymentSuccessScreenProps) {
  const [showCertificate, setShowCertificate] = useState(false);

  if (showCertificate) {
    return (
      <TemporaryCertificate
        reservationId={reservationId}
        onClose={() => setShowCertificate(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-6">
          {/* Success Header */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-green-300/50 space-y-6">
            {/* Success Icon and Message */}
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                  <CheckCircle2 className="w-16 h-16 text-white" strokeWidth={3} />
                </div>
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-bold text-green-800">
                  🎉 تم تفعيل استثمار أشجارك بنجاح
                </h1>
                <p className="text-xl font-bold text-[#B8942F]">
                  استثمارك أصبح نشطًا وتم ربطه بحسابك
                </p>
                <p className="text-gray-600 text-lg">
                  هذه لحظة انتصار نفسي - استثمارك محمي ومُفعّل رسميًا
                </p>
              </div>
            </div>

            {/* Investment Summary */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 space-y-4">
              <h2 className="text-xl font-bold text-green-800 text-center mb-4">
                ملخص استثمارك
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tree Count */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TreePine className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm text-gray-600">عدد الأشجار</p>
                      <p className="text-2xl font-bold text-green-700">{treeCount}</p>
                    </div>
                  </div>
                </div>

                {/* Farm Name */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-[#B8942F]" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm text-gray-600">اسم المزرعة</p>
                      <p className="text-lg font-bold text-gray-800">{farmName}</p>
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm text-gray-600">مدة الاستثمار</p>
                      <p className="text-lg font-bold text-gray-800">
                        {durationYears} سنوات
                        {bonusYears > 0 && (
                          <span className="text-sm text-green-600 mr-1">
                            + {bonusYears} مجانًا
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Investment Number */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm text-gray-600">رقم الاستثمار</p>
                      <p className="text-sm font-bold text-gray-800 font-mono">
                        #{investmentNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Amount */}
              <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8942F] rounded-xl p-4 text-white mt-4">
                <div className="flex items-center justify-between">
                  <div className="text-right flex-1">
                    <p className="text-sm opacity-90">المبلغ المدفوع</p>
                    <p className="text-3xl font-bold">{totalPrice.toLocaleString()} ريال</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate Section */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-[#D4AF37]/30 text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#B8942F] rounded-full flex items-center justify-center mx-auto shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#B8942F]">
                  شهادة استثمارك أصبحت رسمية
                </h3>
                <p className="text-sm text-gray-600">
                  يمكنك الآن عرض شهادتك وتحميلها وطباعتها
                </p>
              </div>
              <button
                onClick={() => setShowCertificate(true)}
                className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#B8942F] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                <span>عرض الشهادة</span>
              </button>
            </div>

            {/* Go to Account Button */}
            <button
              onClick={onGoToAccount}
              className="w-full py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
            >
              <LogIn className="w-6 h-6" />
              <span>ادخل إلى حسابي</span>
            </button>

            {/* Footer Message */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 leading-relaxed">
                ✔ دفعت وتم التفعيل فورًا • ✔ العملية نظيفة • ✔ استلم استثمارك رسميًا
              </p>
              <p className="text-xs text-green-600 mt-2 font-bold">
                الحساب جاهز • لا يوجد انتظار • هذه لحظة تثبيت الثقة
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white/80 rounded-xl p-4 shadow-lg backdrop-blur-sm border border-green-200">
            <p className="text-center text-sm text-gray-700">
              <span className="font-bold text-green-700">مبروك!</span> أصبحت الآن مستثمرًا زراعيًا معنا. استثمارك نشط ومُفعّل في نظامنا.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
