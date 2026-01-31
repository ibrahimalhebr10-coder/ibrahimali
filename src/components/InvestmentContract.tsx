import { Award, Calendar, Trees, Clock, DollarSign, FileText, Download, Printer, X, Shield, Stamp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface InvestmentContractProps {
  reservationId: string;
  investorName?: string;
  onClose?: () => void;
}

interface ContractData {
  id: string;
  contractNumber: string;
  investorName: string;
  farmName: string;
  treeTypes: string;
  treeCount: number;
  durationYears: number;
  bonusYears: number;
  totalYears: number;
  totalPrice: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  status: string;
}

export default function InvestmentContract({
  reservationId,
  investorName,
  onClose
}: InvestmentContractProps) {
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContractData();
  }, [reservationId]);

  const loadContractData = async () => {
    try {
      const { data: reservation, error } = await supabase
        .from('reservations')
        .select(`
          id,
          contract_name,
          total_trees,
          duration_years,
          bonus_years,
          total_price,
          created_at,
          status,
          tree_details,
          user_id,
          farms!fk_reservations_farm_id(
            name_ar
          )
        `)
        .eq('id', reservationId)
        .single();

      if (error) throw error;

      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', reservation.user_id)
        .single();

      const totalYears = reservation.duration_years + (reservation.bonus_years || 0);
      const startDate = new Date(reservation.created_at);
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + totalYears);

      let treeTypesText = 'أشجار مثمرة';
      if (reservation.tree_details && Array.isArray(reservation.tree_details)) {
        const types = reservation.tree_details.map((td: any) => td.variety_name_ar || td.name);
        treeTypesText = types.join(' و ');
      }

      setContract({
        id: reservation.id,
        contractNumber: reservation.contract_name || reservation.id.slice(0, 8).toUpperCase(),
        investorName: investorName || userData?.full_name || userData?.email?.split('@')[0] || 'المستثمر',
        farmName: reservation.farms?.name_ar || 'المزرعة',
        treeTypes: treeTypesText,
        treeCount: reservation.total_trees,
        durationYears: reservation.duration_years,
        bonusYears: reservation.bonus_years || 0,
        totalYears,
        totalPrice: reservation.total_price,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        createdAt: reservation.created_at,
        status: reservation.status
      });
    } catch (error) {
      console.error('Error loading contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('سيتم إضافة وظيفة تحميل PDF قريباً');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#D4AF37] mx-auto"></div>
          <p className="text-sm text-gray-600 mt-4">جاري تحميل العقد...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-red-50 via-pink-50 to-red-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 text-center max-w-md">
          <p className="text-lg text-red-700 mb-4">عذراً، لم يتم العثور على العقد</p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              رجوع
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-6 print:hidden">
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-5 h-5 text-gray-700" />
                <span className="text-sm font-semibold text-gray-700">طباعة</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-white rounded-lg shadow-lg hover:bg-[#B8942F] transition-colors"
              >
                <Download className="w-5 h-5" />
                <span className="text-sm font-semibold">تحميل PDF</span>
              </button>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>

          {/* Contract Document */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-[#D4AF37]">
            {/* Golden Header Bar */}
            <div className="h-4 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37]"></div>

            <div className="p-8 md:p-12">
              {/* Logo & Header */}
              <div className="text-center mb-8 pb-6 border-b-2 border-[#D4AF37]/30">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#D4AF37] to-[#B8942F] rounded-full flex items-center justify-center shadow-xl">
                      <Trees className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-[#B8942F] mb-2">
                  عقد استثمار أشجار مثمرة
                </h1>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Stamp className="w-5 h-5 text-[#D4AF37]" />
                  <p className="text-sm text-gray-600">عقد استثماري رسمي ومصدّق</p>
                </div>
              </div>

              {/* Contract Number */}
              <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#B8942F]/10 rounded-xl p-4 mb-8 border-2 border-[#D4AF37]/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#D4AF37]" />
                    <span className="text-sm font-semibold text-gray-700">رقم العقد</span>
                  </div>
                  <span className="text-xl font-bold text-[#B8942F] tracking-wider">{contract.contractNumber}</span>
                </div>
              </div>

              {/* Contract Details Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Investor Name */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-semibold text-gray-600">اسم المستثمر</span>
                  </div>
                  <p className="text-lg font-bold text-blue-900">{contract.investorName}</p>
                </div>

                {/* Farm Name */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Trees className="w-5 h-5 text-green-600" />
                    <span className="text-xs font-semibold text-gray-600">اسم المزرعة</span>
                  </div>
                  <p className="text-lg font-bold text-green-900">{contract.farmName}</p>
                </div>

                {/* Tree Types */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 border-2 border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Trees className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-semibold text-gray-600">نوع الأشجار</span>
                  </div>
                  <p className="text-lg font-bold text-amber-900">{contract.treeTypes}</p>
                </div>

                {/* Tree Count */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border-2 border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Trees className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-semibold text-gray-600">عدد الأشجار المستثمر فيها</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-900">{contract.treeCount} شجرة</p>
                </div>

                {/* Duration */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span className="text-xs font-semibold text-gray-600">مدة الاستثمار</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-purple-900">{contract.durationYears} سنوات</p>
                    {contract.bonusYears > 0 && (
                      <span className="text-sm font-bold text-green-600">+ {contract.bonusYears} سنوات مجانية</span>
                    )}
                  </div>
                </div>

                {/* Total Amount */}
                <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#B8942F]/20 rounded-xl p-5 border-2 border-[#D4AF37]">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-[#B8942F]" />
                    <span className="text-xs font-semibold text-gray-600">المبلغ المدفوع</span>
                  </div>
                  <p className="text-2xl font-bold text-[#B8942F]">{contract.totalPrice.toLocaleString()} ريال</p>
                </div>
              </div>

              {/* Dates Section */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 mb-8 border-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <span>تواريخ العقد</span>
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">تاريخ التفعيل</p>
                    <p className="text-sm font-bold text-gray-800">{formatDate(contract.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">تاريخ بدء العقد</p>
                    <p className="text-sm font-bold text-gray-800">{formatDate(contract.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">تاريخ انتهاء العقد</p>
                    <p className="text-sm font-bold text-gray-800">{formatDate(contract.endDate)}</p>
                  </div>
                </div>
              </div>

              {/* Legal Text */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 border-2 border-slate-200">
                <p className="text-xs text-center text-gray-700 leading-relaxed">
                  هذا عقد استثمار أشجار مثمرة صادر من المنصة ويثبت مشاركة المستثمر في الاستثمار الزراعي.
                  <br />
                  العقد ساري المفعول ومصدّق إلكترونياً من تاريخ التفعيل وحتى تاريخ انتهاء المدة المحددة.
                </p>
              </div>

              {/* Digital Stamp & Signature */}
              <div className="mt-8 pt-6 border-t-2 border-[#D4AF37]/30">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#B8942F] rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                      <Stamp className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-xs text-gray-600">ختم المنصة الإلكتروني</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                      <Shield className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-xs text-gray-600">التوقيع الرقمي</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  تم إصدار هذا العقد بتاريخ {formatDate(contract.createdAt)}
                </p>
              </div>
            </div>

            {/* Golden Footer Bar */}
            <div className="h-4 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
