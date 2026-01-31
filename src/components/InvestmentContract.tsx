import { Download, Printer, X, Leaf } from 'lucide-react';
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
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-400 via-cyan-500 to-teal-500 z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto"></div>
          <p className="text-sm text-white mt-4">جاري تحميل الشهادة...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-red-50 via-pink-50 to-red-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 text-center max-w-md">
          <p className="text-lg text-red-700 mb-4">عذراً، لم يتم العثور على الشهادة</p>
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
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{
        background: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 50%, #14b8a6 100%)',
        backgroundImage: `
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.05) 10px,
            rgba(255,255,255,0.05) 20px
          )
        `
      }}
    >
      <div className="min-h-screen p-2 sm:p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-5xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 print:hidden">
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <Printer className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                <span className="font-semibold text-gray-700">طباعة</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                <span className="font-semibold text-gray-700">تحميل PDF</span>
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

          <div className="relative bg-white shadow-2xl" style={{
            border: '3px solid #22d3ee',
            borderRadius: '8px'
          }}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: '8px' }}>
              <div className="absolute inset-0" style={{
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                margin: '8px'
              }}></div>

              <Leaf className="absolute top-4 left-4 w-6 h-6 sm:w-8 sm:h-8 text-lime-400 opacity-60" style={{ transform: 'rotate(-20deg)' }} />
              <Leaf className="absolute top-8 left-16 w-5 h-5 sm:w-6 sm:h-6 text-lime-300 opacity-50" style={{ transform: 'rotate(30deg)' }} />
              <Leaf className="absolute top-2 left-1/4 w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 opacity-40" />
              <Leaf className="absolute top-12 left-1/3 w-5 h-5 sm:w-7 sm:h-7 text-lime-500 opacity-50" style={{ transform: 'rotate(-45deg)' }} />
              <Leaf className="absolute top-6 right-8 w-4 h-4 sm:w-6 sm:h-6 text-lime-400 opacity-50" style={{ transform: 'rotate(45deg)' }} />
              <Leaf className="absolute top-3 right-1/4 w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 opacity-60" style={{ transform: 'rotate(-30deg)' }} />

              <Leaf className="absolute bottom-20 left-6 w-5 h-5 sm:w-7 sm:h-7 text-lime-400 opacity-50" style={{ transform: 'rotate(60deg)' }} />
              <Leaf className="absolute bottom-32 right-8 w-8 h-8 sm:w-12 sm:h-12 text-lime-500 opacity-60" style={{ transform: 'rotate(-15deg)' }} />
              <Leaf className="absolute bottom-24 right-24 w-6 h-6 sm:w-10 sm:h-10 text-lime-300 opacity-50" style={{ transform: 'rotate(90deg)' }} />
              <Leaf className="absolute bottom-28 right-48 w-5 h-5 sm:w-8 sm:h-8 text-yellow-400 opacity-40" style={{ transform: 'rotate(-60deg)' }} />
              <Leaf className="absolute bottom-40 right-16 w-4 h-4 sm:w-6 sm:h-6 text-lime-400 opacity-50" style={{ transform: 'rotate(120deg)' }} />
            </div>

            <div className="relative p-4 sm:p-6 md:p-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="flex-shrink-0 mx-auto sm:mx-0">
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <defs>
                        <pattern id="leaves-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                          <circle cx="50" cy="50" r="45" fill="#fef3c7" />
                        </pattern>
                      </defs>
                      <circle cx="50" cy="50" r="48" fill="url(#leaves-pattern)" stroke="#84cc16" strokeWidth="4"/>
                      {[...Array(16)].map((_, i) => {
                        const angle = (i * 22.5 - 90) * Math.PI / 180;
                        const x1 = 50 + 35 * Math.cos(angle);
                        const y1 = 50 + 35 * Math.sin(angle);
                        const x2 = 50 + 48 * Math.cos(angle);
                        const y2 = 50 + 48 * Math.sin(angle);
                        return (
                          <g key={i}>
                            <ellipse
                              cx={x2}
                              cy={y2}
                              rx="8"
                              ry="12"
                              fill="#a3e635"
                              transform={`rotate(${i * 22.5}, ${x2}, ${y2})`}
                            />
                          </g>
                        );
                      })}
                      <text x="50" y="45" textAnchor="middle" fill="#65a30d" fontSize="10" fontWeight="bold">شهادة</text>
                      <text x="50" y="60" textAnchor="middle" fill="#65a30d" fontSize="8" fontWeight="bold">استثمار</text>
                    </svg>
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-right">
                  <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-2" style={{ color: '#0e7490' }}>
                    شهادة استثمار
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-gray-600">عقد أشجار مثمرة</p>
                </div>
              </div>

              <div className="text-center mb-6">
                <p className="text-sm sm:text-base text-gray-600 mb-3">مُنحت إلى</p>
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6" style={{
                  color: '#0891b2',
                  fontFamily: 'cursive'
                }}>
                  {contract.investorName}
                </h2>
              </div>

              <div className="text-center mb-6 sm:mb-8">
                <p className="text-base sm:text-lg md:text-xl text-gray-700 font-semibold mb-3">تقديراً لاستثماره في</p>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                  <span className="font-bold text-gray-800">{contract.treeCount}</span> شجرة من نوع{' '}
                  <span className="font-bold text-gray-800">{contract.treeTypes}</span> في{' '}
                  <span className="font-bold text-gray-800">{contract.farmName}</span>
                  <br className="hidden sm:block" />
                  بقيمة استثمارية قدرها{' '}
                  <span className="font-bold text-gray-800">{contract.totalPrice.toLocaleString()} ريال</span>{' '}
                  لمدة <span className="font-bold text-gray-800">{contract.durationYears} سنوات</span>
                  <br className="hidden sm:block" />
                  من تاريخ <span className="text-gray-700">{formatDate(contract.startDate)}</span>{' '}
                  إلى <span className="text-gray-700">{formatDate(contract.endDate)}</span>
                </p>
              </div>

              <div className="relative mb-8 sm:mb-12 mt-8 sm:mt-12" style={{ height: '80px' }}>
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <path
                    d="M 0,60 Q 100,20 200,40 T 400,35 T 600,45 T 800,40 T 1000,50 T 1200,45 T 1400,40"
                    stroke="#0891b2"
                    strokeWidth="2"
                    fill="none"
                  />
                  <circle cx="10%" cy="45" r="4" fill="#0891b2" />
                  <circle cx="30%" cy="30" r="3" fill="#06b6d4" />
                  <circle cx="50%" cy="40" r="4" fill="#0891b2" />
                  <circle cx="70%" cy="35" r="3" fill="#06b6d4" />
                  <circle cx="90%" cy="42" r="4" fill="#0891b2" />

                  <path
                    d="M 0,45 Q 120,55 240,35 T 480,50 T 720,40 T 960,45 T 1200,35 T 1440,50"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    fill="none"
                    opacity="0.6"
                  />
                  <circle cx="15%" cy="52" r="3" fill="#cbd5e1" opacity="0.6" />
                  <circle cx="40%" cy="38" r="2" fill="#94a3b8" opacity="0.6" />
                  <circle cx="65%" cy="48" r="3" fill="#cbd5e1" opacity="0.6" />
                  <circle cx="85%" cy="40" r="2" fill="#94a3b8" opacity="0.6" />

                  <path
                    d="M 0,70 Q 80,50 160,65 T 320,55 T 480,70 T 640,60 T 800,65 T 960,70 T 1120,60 T 1280,65 T 1440,70"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    fill="none"
                    opacity="0.5"
                  />
                  <circle cx="20%" cy="68" r="3" fill="#f59e0b" opacity="0.5" />
                  <circle cx="55%" cy="60" r="2" fill="#fbbf24" opacity="0.5" />
                  <circle cx="80%" cy="66" r="3" fill="#f59e0b" opacity="0.5" />
                </svg>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8 px-4 sm:px-8">
                <div className="text-center flex-1">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 opacity-20 mb-3"></div>
                    <p className="text-xs sm:text-sm text-gray-600 font-semibold">التوقيع / التاريخ</p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">رقم الشهادة</p>
                  <p className="text-base sm:text-lg font-bold text-cyan-700">{contract.contractNumber}</p>
                </div>

                <div className="text-center flex-1">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 opacity-20 mb-3"></div>
                    <p className="text-xs sm:text-sm text-gray-600 font-semibold">التوقيع / التاريخ</p>
                  </div>
                </div>
              </div>

              <div className="text-center mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs sm:text-sm text-gray-500">
                  صدر بتاريخ {formatDate(contract.createdAt)}
                </p>
              </div>
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
