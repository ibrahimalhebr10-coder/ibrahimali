import { Award, Calendar, Trees, Clock, Gift } from 'lucide-react';

interface TemporaryCertificateProps {
  farmName: string;
  treeCount: number;
  durationYears: number;
  bonusYears: number;
  reservationId: string;
  createdAt: string;
}

export default function TemporaryCertificate({
  farmName,
  treeCount,
  durationYears,
  bonusYears,
  reservationId,
  createdAt
}: TemporaryCertificateProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl border-4 border-[#D4AF37] shadow-2xl overflow-hidden">
      <div className="relative p-8">
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#D4AF37] via-[#B8942F] to-[#D4AF37]"></div>

        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#B8942F] rounded-full flex items-center justify-center shadow-lg">
              <Award className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-block px-4 py-2 bg-red-100 border-2 border-red-400 rounded-lg">
              <span className="text-sm font-bold text-red-700">شهادة استثمار مؤقتة</span>
            </div>
            <h2 className="text-2xl font-bold text-[#B8942F]">شهادة حجز استثماري</h2>
            <div className="inline-block px-4 py-1 bg-amber-100 border border-amber-300 rounded-full">
              <span className="text-xs font-bold text-amber-700">حجز غير مدفوع</span>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 space-y-4 border-2 border-[#D4AF37]/30">
            <div className="flex items-center justify-between py-3 border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-2 text-gray-600">
                <Trees className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-sm font-semibold">المزرعة</span>
              </div>
              <span className="text-base font-bold text-[#B8942F]">{farmName}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-2 text-gray-600">
                <Trees className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold">عدد الأشجار</span>
              </div>
              <span className="text-xl font-bold text-green-700">{treeCount} شجرة</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold">مدة الاستثمار</span>
              </div>
              <span className="text-base font-bold text-blue-700">{durationYears} سنوات</span>
            </div>

            {bonusYears > 0 && (
              <div className="flex items-center justify-between py-3 border-b border-[#D4AF37]/20">
                <div className="flex items-center gap-2 text-gray-600">
                  <Gift className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold">السنوات المجانية</span>
                </div>
                <span className="text-base font-bold text-green-700">+{bonusYears} سنوات</span>
              </div>
            )}

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-sm font-semibold">تاريخ الحجز</span>
              </div>
              <span className="text-sm font-bold text-gray-700">{formatDate(createdAt)}</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border-2 border-red-200">
            <p className="text-xs font-bold text-red-700 leading-relaxed">
              هذه شهادة مؤقتة غير قابلة للطباعة أو التحميل. سيتم إصدار شهادة رسمية بعد إتمام التسجيل والسداد.
            </p>
          </div>

          <div className="pt-4 border-t-2 border-[#D4AF37]/30">
            <p className="text-xs text-gray-500">رقم الحجز: {reservationId.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-[#D4AF37] via-[#B8942F] to-[#D4AF37]"></div>
      </div>
    </div>
  );
}
