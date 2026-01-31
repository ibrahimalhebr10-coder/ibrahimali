import { Calendar, Trees, Clock, DollarSign, FileText, Download, Printer, X, Shield, Stamp, Leaf, Wheat } from 'lucide-react';
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

      let treeTypesText = 'أشجار زيتون';
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
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: '#8B7355' }}>
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-4xl w-full">
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
                <X className="w-5 h-5 text-gray-700" />
              </button>
            )}
          </div>

          <div className="relative bg-gradient-to-br from-[#F5F1E8] via-[#F8F5ED] to-[#F5F1E8] shadow-2xl" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.03\' /%3E%3C/svg%3E")',
          }}>
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
              <div className="absolute top-8 left-8 opacity-40">
                <Trees className="w-32 h-32 text-green-800" strokeWidth={0.5} />
              </div>
              <div className="absolute top-8 right-8 opacity-40">
                <Trees className="w-32 h-32 text-green-800" strokeWidth={0.5} />
              </div>
              <div className="absolute top-1/4 left-4 opacity-30">
                <Leaf className="w-20 h-20 text-green-700" strokeWidth={0.5} />
              </div>
              <div className="absolute top-1/4 right-4 opacity-30">
                <Wheat className="w-20 h-20 text-amber-700" strokeWidth={0.5} />
              </div>
              <div className="absolute bottom-32 left-4 opacity-30">
                <Wheat className="w-24 h-24 text-amber-700" strokeWidth={0.5} />
              </div>
              <div className="absolute bottom-32 right-4 opacity-30">
                <Leaf className="w-24 h-24 text-green-700" strokeWidth={0.5} />
              </div>
            </div>

            <div className="relative border-8 border-[#D4AF37]" style={{ borderImage: 'linear-gradient(135deg, #D4AF37, #B8942F, #D4AF37) 1' }}>
              <div className="bg-gradient-to-r from-green-900 via-green-800 to-green-900 py-6 px-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white text-center tracking-wide">
                  عقد استثمار أشجار مثمرة
                </h1>
              </div>

              <div className="p-8 md:p-12 relative">
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-700 to-green-900 rounded-full flex items-center justify-center shadow-xl relative">
                      <Trees className="w-14 h-14 text-white" />
                      <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37] opacity-50"></div>
                    </div>
                  </div>
                  <p className="text-lg text-green-800 font-semibold mb-2">استثمر أشجارك</p>
                  <div className="w-32 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-6"></div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: '#B8942F' }}>
                    شهادة استثمار رسمية
                  </h2>
                  <p className="text-base text-gray-700 mb-2">هذا العقد صادر باسم:</p>
                  <h3 className="text-4xl md:text-5xl font-bold" style={{ color: '#8B4513' }}>
                    {contract.investorName}
                  </h3>
                </div>

                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-8"></div>

                <div className="bg-white/60 backdrop-blur-sm rounded-lg border-4 border-[#D4AF37] overflow-hidden mb-8 shadow-lg">
                  <div className="divide-y-2 divide-[#D4AF37]/30">
                    <div className="grid grid-cols-2">
                      <div className="p-4 text-right bg-gradient-to-l from-amber-50/50 to-transparent">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-semibold text-gray-700">رقم العقد</span>
                          <Leaf className="w-5 h-5 text-green-700" />
                        </div>
                      </div>
                      <div className="p-4 text-left border-r-2 border-[#D4AF37]/30">
                        <p className="text-lg font-bold" style={{ color: '#B8942F' }}>{contract.contractNumber}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2">
                      <div className="p-4 text-right bg-gradient-to-l from-amber-50/50 to-transparent">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-semibold text-gray-700">نوع الأشجار</span>
                          <Leaf className="w-5 h-5 text-green-700" />
                        </div>
                      </div>
                      <div className="p-4 text-left border-r-2 border-[#D4AF37]/30">
                        <p className="text-lg font-bold text-gray-800">{contract.treeTypes}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2">
                      <div className="p-4 text-right bg-gradient-to-l from-amber-50/50 to-transparent">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-semibold text-gray-700">عدد الأشجار</span>
                          <Leaf className="w-5 h-5 text-green-700" />
                        </div>
                      </div>
                      <div className="p-4 text-left border-r-2 border-[#D4AF37]/30">
                        <p className="text-lg font-bold text-gray-800">{contract.farmName}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2">
                      <div className="p-4 text-right bg-gradient-to-l from-amber-50/50 to-transparent">
                        <span className="text-sm font-semibold text-gray-700">مدة الاستثمار :</span>
                      </div>
                      <div className="p-4 text-left border-r-2 border-[#D4AF37]/30">
                        <p className="text-lg font-bold text-gray-800">
                          {contract.durationYears} سنوات
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2">
                      <div className="p-4 text-right bg-gradient-to-l from-amber-50/50 to-transparent">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-semibold text-gray-700">تاريخ {formatDate(contract.endDate)}</span>
                        </div>
                      </div>
                      <div className="p-4 text-left border-r-2 border-[#D4AF37]/30">
                        <p className="text-base font-bold text-gray-800">{formatDate(contract.startDate)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2">
                      <div className="p-4 text-right bg-gradient-to-l from-[#D4AF37]/20 to-transparent">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-base font-bold text-gray-800">المبلغ المدفوع :</span>
                        </div>
                      </div>
                      <div className="p-4 text-left border-r-2 border-[#D4AF37]/30 bg-gradient-to-r from-[#D4AF37]/10 to-transparent">
                        <p className="text-2xl font-bold" style={{ color: '#B8942F' }}>
                          {contract.totalPrice.toLocaleString()} ريال
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mb-10">
                  <p className="text-sm text-gray-800 leading-relaxed max-w-2xl mx-auto">
                    هذا عقد استثمار أشجار مثمرة صادر من المنصة ويثبت مشاركة المستثمر في الاستثمار الزراعي
                  </p>
                </div>

                <div className="flex items-center justify-between mb-8">
                  <div className="text-center flex-1">
                    <div className="mb-3">
                      <div className="w-32 h-16 mx-auto border-b-2 border-gray-400"></div>
                    </div>
                    <p className="text-sm text-gray-700 font-semibold">المدير التنفيذي</p>
                  </div>

                  <div className="flex-shrink-0 mx-4">
                    <div className="relative w-28 h-28">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37] to-[#B8942F] rounded-full"></div>
                      <div className="absolute inset-1 bg-gradient-to-br from-[#F5F1E8] to-[#F8F5ED] rounded-full flex items-center justify-center">
                        <div className="text-center">
                          <Trees className="w-10 h-10 mx-auto mb-1 text-green-800" />
                          <p className="text-xs font-bold text-green-900">استثمر أشجارك</p>
                        </div>
                      </div>
                      <Stamp className="absolute -bottom-2 -right-2 w-10 h-10 text-red-600 opacity-80" />
                    </div>
                  </div>

                  <div className="text-center flex-1">
                    <div className="mb-3">
                      <div className="w-32 h-16 mx-auto border-b-2 border-gray-400"></div>
                    </div>
                    <p className="text-sm text-gray-700 font-semibold">المدير الشرعي</p>
                  </div>
                </div>

                <div className="text-center pt-6 border-t-2 border-[#D4AF37]/30">
                  <p className="text-xs text-gray-600">
                    صدر بتاريخ {formatDate(contract.createdAt)}
                  </p>
                </div>
              </div>

              <div className="h-3 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37]"></div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background-color: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
