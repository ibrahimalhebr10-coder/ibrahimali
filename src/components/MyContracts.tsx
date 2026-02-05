import { useState, useEffect } from 'react';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  TreePine,
  Clock,
  Award,
  Leaf,
  Grape,
  Apple,
  Wheat,
  Sparkles,
  TrendingUp,
  MapPin,
  CalendarCheck,
  Hash,
  Shield,
  Scroll
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ContractCountdown from './ContractCountdown';

interface Contract {
  id: string;
  farm_id: string;
  farm_name: string;
  contract_name: string | null;
  total_trees: number;
  tree_types: string | null;
  contract_start_date: string | null;
  duration_years: number | null;
  bonus_years: number | null;
  status: string;
  created_at: string;
  path_type: 'agricultural' | 'investment';
}

interface FarmWithContracts {
  farm_id: string;
  farm_name: string;
  contracts_count: number;
  contracts: Contract[];
}

const MyContracts: React.FC = () => {
  const { user, identity } = useAuth();
  const [farmsWithContracts, setFarmsWithContracts] = useState<FarmWithContracts[]>([]);
  const [expandedFarms, setExpandedFarms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [totalContracts, setTotalContracts] = useState(0);

  useEffect(() => {
    if (user) {
      loadMyContracts();
    }
  }, [user]);

  const loadMyContracts = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'completed'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const farmMap = new Map<string, FarmWithContracts>();

      reservations?.forEach((reservation: any) => {
        const farmId = reservation.farm_id;
        const farmName = reservation.farm_name;

        if (!farmMap.has(farmId)) {
          farmMap.set(farmId, {
            farm_id: farmId,
            farm_name: farmName,
            contracts_count: 0,
            contracts: []
          });
        }

        const farmData = farmMap.get(farmId)!;
        farmData.contracts_count++;

        const pathType = reservation.path_type || 'agricultural';
        console.log(`📋 [MyContracts] Reservation ${reservation.id}: path_type = "${pathType}" → ${pathType === 'investment' ? 'أشجاري الذهبية 🌟' : 'أشجاري الخضراء 🌿'}`);

        farmData.contracts.push({
          id: reservation.id,
          farm_id: farmId,
          farm_name: farmName,
          contract_name: reservation.contract_name,
          total_trees: reservation.total_trees,
          tree_types: reservation.tree_types,
          contract_start_date: reservation.contract_start_date,
          duration_years: reservation.duration_years,
          bonus_years: reservation.bonus_years,
          status: reservation.status,
          created_at: reservation.created_at,
          path_type: pathType
        });
      });

      const farmsArray = Array.from(farmMap.values());
      setFarmsWithContracts(farmsArray);
      setTotalContracts(reservations?.length || 0);
    } catch (error: any) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFarmExpansion = (farmId: string) => {
    const newExpanded = new Set(expandedFarms);
    if (newExpanded.has(farmId)) {
      newExpanded.delete(farmId);
    } else {
      newExpanded.add(farmId);
    }
    setExpandedFarms(newExpanded);
  };

  const getTreeIcon = (treeType: string) => {
    const type = treeType.toLowerCase();
    if (type.includes('نخيل') || type.includes('palm')) return Wheat;
    if (type.includes('زيتون') || type.includes('olive')) return Leaf;
    if (type.includes('عنب') || type.includes('grape')) return Grape;
    if (type.includes('تفاح') || type.includes('apple')) return Apple;
    return TreePine;
  };

  const getContractTypeBadge = (pathType: 'agricultural' | 'investment') => {
    if (pathType === 'investment') {
      return {
        label: 'عقد أشجاري الذهبية',
        color: 'from-amber-500 to-yellow-600',
        icon: TrendingUp
      };
    }
    return {
      label: 'عقد أشجاري الخضراء',
      color: 'from-green-500 to-emerald-600',
      icon: Sparkles
    };
  };

  const getStatusBadge = (status: string) => {
    if (status === 'confirmed' || status === 'completed') {
      return { label: 'نشط', icon: Sparkles, color: 'text-green-600 bg-green-100' };
    }
    return { label: status, icon: Clock, color: 'text-gray-600 bg-gray-100' };
  };

  const calculateProgress = (startDate: string | null, durationYears: number | null) => {
    if (!startDate || !durationYears) return 0;

    const start = new Date(startDate);
    const now = new Date();
    const totalDuration = durationYears * 365 * 24 * 60 * 60 * 1000;
    const elapsed = now.getTime() - start.getTime();
    const progress = Math.min((elapsed / totalDuration) * 100, 100);

    return Math.max(0, progress);
  };

  const calculateDaysRemaining = (startDate: string | null, durationYears: number | null, bonusYears: number | null) => {
    if (!startDate || !durationYears) return null;

    const totalYears = durationYears + (bonusYears || 0);
    const start = new Date(startDate);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + totalYears);

    const now = new Date();
    const remaining = end.getTime() - now.getTime();
    const daysRemaining = Math.ceil(remaining / (24 * 60 * 60 * 1000));

    return Math.max(0, daysRemaining);
  };

  const parseTreeTypes = (treeTypes: string | null): string[] => {
    if (!treeTypes) return [];
    return treeTypes.split(',').map(t => t.trim()).filter(t => t.length > 0);
  };

  const isAgriculturalMode = identity === 'agricultural';
  const primaryColor = isAgriculturalMode ? 'green' : 'amber';
  const gradientFrom = isAgriculturalMode ? 'from-green-500' : 'from-amber-500';
  const gradientTo = isAgriculturalMode ? 'to-emerald-600' : 'to-yellow-600';

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center gap-3 py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-green-200 border-t-green-600"></div>
          <p className="text-sm text-gray-600 font-semibold">جاري تحميل العقود...</p>
        </div>
      </div>
    );
  }

  if (totalContracts === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 border-2 border-gray-200 text-center shadow-lg">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Scroll className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">لا توجد عقود بعد</h3>
          <p className="text-sm text-gray-600 mb-4">ابدأ رحلتك بحجز أشجارك الأولى</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border-2 border-gray-300">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-bold text-gray-600">ستظهر عقودك هنا بعد الحجز</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {farmsWithContracts.map((farm) => (
          <div key={farm.farm_id} className="space-y-4">
            {farm.contracts.map((contract) => {
              const badge = getContractTypeBadge(contract.path_type);
              const statusBadge = getStatusBadge(contract.status);
              const StatusIcon = statusBadge.icon;
              const ContractIcon = badge.icon;
              const treeTypesList = parseTreeTypes(contract.tree_types);
              const isAgriculturalContract = contract.path_type === 'agricultural';

              console.log(`🎨 [MyContracts] Rendering contract ${contract.id}: path_type="${contract.path_type}" → badge="${badge.label}"`);

              return (
                <div
                  key={contract.id}
                  className="rounded-3xl overflow-hidden shadow-2xl border-4 bg-white transition-all hover:shadow-3xl"
                  style={{
                    borderImage: `linear-gradient(135deg, ${isAgriculturalContract ? '#10b981' : '#f59e0b'} 0%, ${isAgriculturalContract ? '#059669' : '#d97706'} 100%) 1`,
                    borderImageSlice: 1
                  }}
                >
                  <div
                    className="relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${isAgriculturalContract ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)'} 0%, ${isAgriculturalContract ? 'rgba(5,150,105,0.12)' : 'rgba(217,119,6,0.12)'} 100%)`
                    }}
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
                      <Scroll className="w-full h-full" strokeWidth={0.5} />
                    </div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 opacity-5">
                      <Shield className="w-full h-full" strokeWidth={0.5} />
                    </div>

                    <div className="relative z-10 p-6 space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-xl`}
                            >
                              <ContractIcon className="w-8 h-8 text-white" strokeWidth={2.5} />
                            </div>
                            <div>
                              <h2 className="text-2xl font-black mb-1" style={{ color: isAgriculturalContract ? '#059669' : '#d97706' }}>
                                {badge.label}
                              </h2>
                              <div className="flex items-center gap-2">
                                <div className={`px-3 py-1 rounded-full ${statusBadge.color} flex items-center gap-1 shadow-md`}>
                                  <StatusIcon className="w-4 h-4" strokeWidth={2.5} />
                                  <span className="text-sm font-bold">{statusBadge.label}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border-2 border-gray-200 shadow-md">
                          <div className="flex items-center gap-2 mb-2">
                            <Hash className="w-5 h-5 text-gray-600" />
                            <span className="text-sm font-bold text-gray-600">رقم العقد</span>
                          </div>
                          <p className="text-lg font-black text-gray-900 font-mono">
                            {contract.id.substring(0, 8).toUpperCase()}
                          </p>
                        </div>

                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border-2 border-gray-200 shadow-md">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-5 h-5 text-gray-600" />
                            <span className="text-sm font-bold text-gray-600">المزرعة</span>
                          </div>
                          <p className="text-lg font-black text-gray-900">
                            {farm.farm_name}
                          </p>
                        </div>
                      </div>

                      <div
                        className="rounded-2xl p-5 shadow-lg border-2"
                        style={{
                          background: isAgriculturalContract ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.2) 100%)' : 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.2) 100%)',
                          borderColor: isAgriculturalContract ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <TreePine className={`w-6 h-6 ${isAgriculturalContract ? 'text-green-700' : 'text-amber-700'}`} strokeWidth={2.5} />
                          <span className="text-sm font-bold text-gray-700">الأشجار المتعاقد عليها</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className={`text-5xl font-black ${isAgriculturalContract ? 'text-green-700' : 'text-amber-700'}`}>{contract.total_trees}</span>
                          <span className={`text-xl font-bold ${isAgriculturalContract ? 'text-green-600' : 'text-amber-600'}`}>شجرة</span>
                        </div>
                        {treeTypesList.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {treeTypesList.map((treeType, idx) => {
                              const TreeIcon = getTreeIcon(treeType);
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 shadow-sm"
                                  style={{
                                    borderColor: isAgriculturalContract ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'
                                  }}
                                >
                                  <TreeIcon className={`w-4 h-4 ${isAgriculturalContract ? 'text-green-700' : 'text-amber-700'}`} strokeWidth={2.5} />
                                  <span className={`text-sm font-bold ${isAgriculturalContract ? 'text-green-800' : 'text-amber-800'}`}>{treeType}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {contract.contract_start_date && contract.duration_years && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border-2 border-gray-200 shadow-md">
                            <div className="flex items-center gap-2 mb-2">
                              <CalendarCheck className="w-5 h-5 text-blue-600" />
                              <span className="text-sm font-bold text-gray-600">تاريخ البدء</span>
                            </div>
                            <p className="text-base font-black text-gray-900">
                              {new Date(contract.contract_start_date).toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>

                          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border-2 border-gray-200 shadow-md">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-5 h-5 text-purple-600" />
                              <span className="text-sm font-bold text-gray-600">مدة الإيجار</span>
                            </div>
                            <p className="text-base font-black text-gray-900">
                              {contract.duration_years} سنوات
                              {contract.bonus_years && contract.bonus_years > 0 && (
                                <span className="text-green-600 text-sm mr-2">
                                  + {contract.bonus_years} مجانًا
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {contract.contract_start_date && contract.duration_years && (
                        <>
                          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

                          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-1 shadow-2xl">
                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-4">
                                <div
                                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-lg`}
                                >
                                  <Clock className="w-5 h-5 text-white" strokeWidth={2.5} />
                                </div>
                                <h3 className="text-lg font-black text-gray-800">العداد الزمني للعقد</h3>
                              </div>
                              <ContractCountdown
                                contractStartDate={contract.contract_start_date}
                                durationYears={contract.duration_years}
                                bonusYears={contract.bonus_years || 0}
                                status={contract.status}
                                userType={isAgriculturalContract ? 'farmer' : 'investor'}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      <div className="flex items-center justify-center gap-2 pt-4">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <p className="text-xs text-gray-500 font-bold">هذه وثيقة رسمية محفوظة إلكترونياً</p>
                        <Shield className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyContracts;
