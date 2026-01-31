import { Download, Printer, X, Leaf, Sparkles } from 'lucide-react';
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
  farmLocation: string;
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
            name_ar,
            location
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
        farmLocation: reservation.farms?.location || 'المملكة العربية السعودية',
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
        background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 25%, #14b8a6 50%, #06b6d4 75%, #0ea5e9 100%)',
        backgroundImage: `
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.03) 10px,
            rgba(255,255,255,0.03) 20px
          ),
          radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)
        `
      }}
    >
      <div className="min-h-screen p-2 sm:p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-5xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 print:hidden">
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-all hover:scale-105 text-sm"
              >
                <Printer className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-700" />
                <span className="font-semibold text-cyan-700">طباعة</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyan-600 text-white rounded-lg shadow-lg hover:bg-cyan-700 transition-all hover:scale-105 text-sm"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-semibold">تحميل PDF</span>
              </button>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-50 transition-all hover:scale-110"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            )}
          </div>

          <div className="relative bg-gradient-to-br from-white via-cyan-50/30 to-white shadow-2xl" style={{
            border: '4px solid',
            borderImage: 'linear-gradient(135deg, #06b6d4, #0891b2, #0e7490, #0891b2, #06b6d4) 1',
            borderRadius: '12px'
          }}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: '12px' }}>
              <div className="absolute inset-0" style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '12px',
                margin: '12px'
              }}></div>

              <Sparkles className="absolute top-6 left-6 w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 opacity-60 animate-pulse" />
              <Sparkles className="absolute top-6 right-6 w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }} />

              <Leaf className="absolute top-8 left-12 w-6 h-6 sm:w-8 sm:h-8 text-lime-400 opacity-50" style={{ transform: 'rotate(-20deg)' }} />
              <Leaf className="absolute top-16 left-24 w-5 h-5 sm:w-6 sm:h-6 text-lime-300 opacity-40" style={{ transform: 'rotate(30deg)' }} />
              <Leaf className="absolute top-4 left-1/4 w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 opacity-35" />
              <Leaf className="absolute top-20 left-1/3 w-5 h-5 sm:w-7 sm:h-7 text-lime-500 opacity-45" style={{ transform: 'rotate(-45deg)' }} />
              <Leaf className="absolute top-12 right-16 w-4 h-4 sm:w-6 sm:h-6 text-lime-400 opacity-40" style={{ transform: 'rotate(45deg)' }} />
              <Leaf className="absolute top-6 right-1/4 w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 opacity-50" style={{ transform: 'rotate(-30deg)' }} />

              <Leaf className="absolute bottom-24 left-8 w-5 h-5 sm:w-7 sm:h-7 text-lime-400 opacity-45" style={{ transform: 'rotate(60deg)' }} />
              <Leaf className="absolute bottom-40 right-12 w-8 h-8 sm:w-12 sm:h-12 text-lime-500 opacity-50" style={{ transform: 'rotate(-15deg)' }} />
              <Leaf className="absolute bottom-32 right-32 w-6 h-6 sm:w-10 sm:h-10 text-lime-300 opacity-40" style={{ transform: 'rotate(90deg)' }} />
              <Leaf className="absolute bottom-36 right-52 w-5 h-5 sm:w-8 sm:h-8 text-yellow-400 opacity-35" style={{ transform: 'rotate(-60deg)' }} />
              <Leaf className="absolute bottom-48 right-24 w-4 h-4 sm:w-6 sm:h-6 text-lime-400 opacity-40" style={{ transform: 'rotate(120deg)' }} />
            </div>

            <div className="relative p-4 sm:p-6 md:p-12">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-8 sm:mb-10">
                <div className="flex-shrink-0">
                  <div className="relative w-28 h-28 sm:w-36 sm:h-36">
                    <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl">
                      <defs>
                        <linearGradient id="badge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#84cc16" />
                          <stop offset="50%" stopColor="#65a30d" />
                          <stop offset="100%" stopColor="#84cc16" />
                        </linearGradient>
                        <filter id="shadow">
                          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                        </filter>
                      </defs>

                      <circle cx="60" cy="60" r="54" fill="#fef3c7" stroke="url(#badge-gradient)" strokeWidth="5" filter="url(#shadow)"/>

                      {[...Array(20)].map((_, i) => {
                        const angle = (i * 18 - 90) * Math.PI / 180;
                        const x = 60 + 50 * Math.cos(angle);
                        const y = 60 + 50 * Math.sin(angle);
                        return (
                          <g key={i}>
                            <ellipse
                              cx={x}
                              cy={y}
                              rx="9"
                              ry="14"
                              fill="#a3e635"
                              opacity="0.9"
                              transform={`rotate(${i * 18}, ${x}, ${y})`}
                            />
                          </g>
                        );
                      })}

                      <circle cx="60" cy="60" r="42" fill="none" stroke="#84cc16" strokeWidth="2" opacity="0.3"/>
                      <circle cx="60" cy="60" r="36" fill="none" stroke="#65a30d" strokeWidth="1.5" opacity="0.2"/>

                      <text x="60" y="52" textAnchor="middle" fill="#65a30d" fontSize="12" fontWeight="bold">شهادة</text>
                      <text x="60" y="68" textAnchor="middle" fill="#65a30d" fontSize="10" fontWeight="bold">استثمار</text>
                      <text x="60" y="82" textAnchor="middle" fill="#84cc16" fontSize="8">زراعي</text>
                    </svg>
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-right">
                  <div className="inline-block">
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-cyan-600 via-cyan-700 to-cyan-600 bg-clip-text text-transparent" style={{
                      textShadow: '0 2px 10px rgba(6, 182, 212, 0.2)'
                    }}>
                      شهادة استثمار زراعي
                    </h1>
                    <div className="h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent rounded-full"></div>
                  </div>
                  <p className="text-base sm:text-lg md:text-2xl text-gray-600 mt-2 font-semibold">عقد أشجار مثمرة</p>
                </div>
              </div>

              <div className="text-center mb-8 bg-gradient-to-r from-transparent via-cyan-50 to-transparent py-6 rounded-lg">
                <p className="text-sm sm:text-base text-gray-600 mb-4 font-semibold">مُنحت هذه الشهادة إلى</p>
                <div className="relative inline-block">
                  <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-2 px-4" style={{
                    color: '#0891b2',
                    fontFamily: 'cursive',
                    textShadow: '2px 2px 4px rgba(6, 182, 212, 0.1)'
                  }}>
                    {contract.investorName}
                  </h2>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                </div>
              </div>

              <div className="mb-8 sm:mb-10 px-2 sm:px-4">
                <div className="text-center mb-6">
                  <p className="text-base sm:text-xl md:text-2xl text-cyan-700 font-bold">تقديراً لاستثماره المتميز</p>
                  <div className="h-1 w-32 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto mt-2"></div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-cyan-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <tbody>
                        <tr className="border-b border-cyan-100">
                          <td className="py-3 sm:py-4 px-3 sm:px-6 bg-gradient-to-r from-cyan-50 to-cyan-100 font-bold text-cyan-900 text-xs sm:text-sm md:text-base whitespace-nowrap">
                            نوع استثمار الأشجار
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6 text-gray-800 font-semibold text-xs sm:text-sm md:text-base">
                            {contract.treeTypes} ({contract.treeCount} شجرة)
                          </td>
                        </tr>

                        <tr className="border-b border-cyan-100">
                          <td className="py-3 sm:py-4 px-3 sm:px-6 bg-gradient-to-r from-cyan-50 to-cyan-100 font-bold text-cyan-900 text-xs sm:text-sm md:text-base whitespace-nowrap">
                            مدة العقد الأساسية
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6 text-gray-800 font-semibold text-xs sm:text-sm md:text-base">
                            {contract.durationYears} سنوات
                          </td>
                        </tr>

                        <tr className="border-b border-cyan-100 bg-amber-50/50">
                          <td className="py-3 sm:py-4 px-3 sm:px-6 bg-gradient-to-r from-amber-100 to-amber-200 font-bold text-amber-900 text-xs sm:text-sm md:text-base">
                            <div className="flex flex-col gap-1">
                              <span>السنوات المجانية</span>
                              <span className="text-xs font-normal text-amber-700 italic">
                                (مدة تشجيعية غير ملزمة)
                              </span>
                            </div>
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6 font-semibold text-xs sm:text-sm md:text-base">
                            <div className="flex flex-col gap-1">
                              <span className="text-amber-800 font-bold">{contract.bonusYears} سنة</span>
                              <span className="text-xs text-amber-600">
                                عند حدوث أي عائق في الاستمرار
                              </span>
                            </div>
                          </td>
                        </tr>

                        <tr className="border-b border-cyan-100">
                          <td className="py-3 sm:py-4 px-3 sm:px-6 bg-gradient-to-r from-cyan-50 to-cyan-100 font-bold text-cyan-900 text-xs sm:text-sm md:text-base whitespace-nowrap">
                            موقع الاستثمار
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6 text-gray-800 font-semibold text-xs sm:text-sm md:text-base">
                            {contract.farmLocation}
                          </td>
                        </tr>

                        <tr className="border-b border-cyan-100">
                          <td className="py-3 sm:py-4 px-3 sm:px-6 bg-gradient-to-r from-cyan-50 to-cyan-100 font-bold text-cyan-900 text-xs sm:text-sm md:text-base whitespace-nowrap">
                            اسم المزرعة
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6 text-gray-800 font-semibold text-xs sm:text-sm md:text-base">
                            {contract.farmName}
                          </td>
                        </tr>

                        <tr className="border-b border-cyan-100">
                          <td className="py-3 sm:py-4 px-3 sm:px-6 bg-gradient-to-r from-cyan-50 to-cyan-100 font-bold text-cyan-900 text-xs sm:text-sm md:text-base whitespace-nowrap">
                            تاريخ بداية العقد
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6 text-gray-800 font-semibold text-xs sm:text-sm md:text-base">
                            {formatDate(contract.startDate)}
                          </td>
                        </tr>

                        <tr className="border-b border-cyan-100">
                          <td className="py-3 sm:py-4 px-3 sm:px-6 bg-gradient-to-r from-cyan-50 to-cyan-100 font-bold text-cyan-900 text-xs sm:text-sm md:text-base whitespace-nowrap">
                            تاريخ نهاية العقد
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6 font-semibold text-xs sm:text-sm md:text-base">
                            <div className="flex flex-col gap-1">
                              <span className="text-gray-800">{formatDate(contract.endDate)}</span>
                              <span className="text-xs text-gray-600">
                                (بعد {contract.totalYears} سنة شاملة المدة التشجيعية)
                              </span>
                            </div>
                          </td>
                        </tr>

                        <tr className="bg-gradient-to-r from-cyan-100 to-cyan-200">
                          <td className="py-4 sm:py-5 px-3 sm:px-6 font-bold text-cyan-900 text-sm sm:text-base md:text-lg whitespace-nowrap">
                            القيمة الاستثمارية
                          </td>
                          <td className="py-4 sm:py-5 px-3 sm:px-6 font-bold text-cyan-800 text-base sm:text-lg md:text-xl">
                            {contract.totalPrice.toLocaleString()} ريال سعودي
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="relative mb-10 sm:mb-14 mt-10 sm:mt-14" style={{ height: '100px' }}>
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="line-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0891b2" stopOpacity="0.3"/>
                      <stop offset="50%" stopColor="#0891b2" stopOpacity="1"/>
                      <stop offset="100%" stopColor="#0891b2" stopOpacity="0.3"/>
                    </linearGradient>
                    <linearGradient id="line-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.2"/>
                      <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.6"/>
                      <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.2"/>
                    </linearGradient>
                    <linearGradient id="line-gradient-3" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.2"/>
                      <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.5"/>
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.2"/>
                    </linearGradient>
                  </defs>

                  <path
                    d="M 0,60 Q 100,20 200,40 T 400,35 T 600,45 T 800,40 T 1000,50 T 1200,45 T 1400,40"
                    stroke="url(#line-gradient-1)"
                    strokeWidth="3"
                    fill="none"
                  />
                  <circle cx="10%" cy="45" r="5" fill="#0891b2" opacity="0.8">
                    <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="30%" cy="30" r="4" fill="#06b6d4" opacity="0.7">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="50%" cy="40" r="5" fill="#0891b2" opacity="0.8">
                    <animate attributeName="opacity" values="0.8;1;0.8" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="70%" cy="35" r="4" fill="#06b6d4" opacity="0.7">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="2.8s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="90%" cy="42" r="5" fill="#0891b2" opacity="0.8">
                    <animate attributeName="opacity" values="0.8;1;0.8" dur="2.3s" repeatCount="indefinite" />
                  </circle>

                  <path
                    d="M 0,45 Q 120,55 240,35 T 480,50 T 720,40 T 960,45 T 1200,35 T 1440,50"
                    stroke="url(#line-gradient-2)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <circle cx="15%" cy="52" r="3" fill="#cbd5e1" opacity="0.6" />
                  <circle cx="40%" cy="38" r="3" fill="#94a3b8" opacity="0.6" />
                  <circle cx="65%" cy="48" r="3" fill="#cbd5e1" opacity="0.6" />
                  <circle cx="85%" cy="40" r="3" fill="#94a3b8" opacity="0.6" />

                  <path
                    d="M 0,75 Q 80,55 160,70 T 320,60 T 480,75 T 640,65 T 800,70 T 960,75 T 1120,65 T 1280,70 T 1440,75"
                    stroke="url(#line-gradient-3)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <circle cx="20%" cy="73" r="4" fill="#fbbf24" opacity="0.5" />
                  <circle cx="55%" cy="65" r="3" fill="#fbbf24" opacity="0.5" />
                  <circle cx="80%" cy="71" r="4" fill="#f59e0b" opacity="0.5" />
                </svg>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-8 sm:gap-12 px-4 sm:px-12 mb-8">
                <div className="text-center flex-1">
                  <div className="mb-4">
                    <svg className="w-32 h-20 sm:w-40 sm:h-24 mx-auto" viewBox="0 0 160 80">
                      <path
                        d="M 10,50 Q 30,20 50,40 T 90,35 Q 110,25 130,45 T 150,40"
                        stroke="#0891b2"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.8"
                      />
                    </svg>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-semibold">المدير التنفيذي</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(contract.createdAt)}</p>
                </div>

                <div className="flex-shrink-0">
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                    <svg viewBox="0 0 120 120" className="w-full h-full">
                      <defs>
                        <linearGradient id="stamp-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0ea5e9" />
                          <stop offset="50%" stopColor="#0891b2" />
                          <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>
                        <filter id="stamp-shadow">
                          <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.4"/>
                        </filter>
                      </defs>

                      <circle cx="60" cy="60" r="55" fill="none" stroke="url(#stamp-gradient)" strokeWidth="8" opacity="0.3" filter="url(#stamp-shadow)"/>
                      <circle cx="60" cy="60" r="50" fill="none" stroke="url(#stamp-gradient)" strokeWidth="6" opacity="0.5"/>
                      <circle cx="60" cy="60" r="45" fill="none" stroke="url(#stamp-gradient)" strokeWidth="4" opacity="0.7"/>

                      {[...Array(24)].map((_, i) => {
                        const angle = (i * 15) * Math.PI / 180;
                        const x1 = 60 + 40 * Math.cos(angle);
                        const y1 = 60 + 40 * Math.sin(angle);
                        const x2 = 60 + 48 * Math.cos(angle);
                        const y2 = 60 + 48 * Math.sin(angle);
                        return (
                          <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#0891b2"
                            strokeWidth="2"
                            opacity="0.6"
                          />
                        );
                      })}

                      <circle cx="60" cy="60" r="38" fill="url(#stamp-gradient)" opacity="0.1"/>

                      <text x="60" y="52" textAnchor="middle" fill="#0891b2" fontSize="14" fontWeight="bold">حصص</text>
                      <text x="60" y="70" textAnchor="middle" fill="#0891b2" fontSize="14" fontWeight="bold">زراعية</text>

                      <circle cx="60" cy="60" r="33" fill="none" stroke="#0891b2" strokeWidth="1" strokeDasharray="2,2" opacity="0.4"/>
                    </svg>
                  </div>
                </div>

                <div className="text-center flex-1">
                  <div className="mb-4">
                    <svg className="w-32 h-20 sm:w-40 sm:h-24 mx-auto" viewBox="0 0 160 80">
                      <path
                        d="M 10,40 Q 25,25 40,38 T 70,42 Q 90,30 110,45 T 150,35"
                        stroke="#0891b2"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.8"
                      />
                    </svg>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-semibold">المدير المالي</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(contract.createdAt)}</p>
                </div>
              </div>

              <div className="text-center pt-6 border-t-2 border-cyan-200">
                <div className="inline-block bg-gradient-to-r from-cyan-50 via-cyan-100 to-cyan-50 px-6 py-3 rounded-full shadow-lg">
                  <p className="text-xs sm:text-sm text-cyan-800 font-semibold">
                    رقم الشهادة: <span className="font-bold text-cyan-900">{contract.contractNumber}</span>
                  </p>
                  <p className="text-xs text-cyan-600 mt-1">
                    تاريخ الإصدار: {formatDate(contract.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-2 bg-gradient-to-r from-cyan-500 via-cyan-600 to-cyan-500"></div>
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

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
