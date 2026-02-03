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
  TrendingUp
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
          created_at: reservation.created_at
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

  const getContractTypeBadge = (contractName: string | null) => {
    if (!contractName) {
      return { label: 'عقد زراعي', color: 'from-green-500 to-emerald-600' };
    }
    if (contractName.toLowerCase().includes('investment') || contractName.toLowerCase().includes('استثماري')) {
      return { label: 'عقد استثماري', color: 'from-amber-500 to-yellow-600' };
    }
    return { label: 'عقد زراعي', color: 'from-green-500 to-emerald-600' };
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
      <div className="p-6">
        <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد عقود بعد</h3>
          <p className="text-sm text-gray-600">ابدأ رحلتك بحجز أشجارك الأولى</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div
        className="rounded-3xl p-6 text-center shadow-xl border-2"
        style={{
          background: `linear-gradient(135deg, ${isAgriculturalMode ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.1)'} 0%, ${isAgriculturalMode ? 'rgba(5,150,105,0.15)' : 'rgba(245,158,11,0.15)'} 100%)`,
          borderColor: isAgriculturalMode ? 'rgba(16,185,129,0.3)' : 'rgba(251,191,36,0.3)'
        }}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <FileText className={`w-8 h-8 text-${primaryColor}-600`} strokeWidth={2.5} />
          <h2 className={`text-3xl font-black text-${primaryColor}-800`}>عقودي</h2>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Award className={`w-5 h-5 text-${primaryColor}-600`} />
          <p className={`text-lg font-bold text-${primaryColor}-700`}>
            {totalContracts} {totalContracts === 1 ? 'عقد' : 'عقود'}
          </p>
        </div>
        <p className="text-sm text-gray-600 mt-2">جميع عقودك في مكان واحد</p>
      </div>

      <div className="space-y-3">
        {farmsWithContracts.map((farm) => {
          const isExpanded = expandedFarms.has(farm.farm_id);

          return (
            <div key={farm.farm_id} className="space-y-2">
              <button
                onClick={() => toggleFarmExpansion(farm.farm_id)}
                className="w-full rounded-2xl p-4 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${isAgriculturalMode ? 'rgba(16,185,129,0.15)' : 'rgba(251,191,36,0.15)'} 0%, ${isAgriculturalMode ? 'rgba(5,150,105,0.2)' : 'rgba(245,158,11,0.2)'} 100%)`,
                  border: `2px solid ${isAgriculturalMode ? 'rgba(16,185,129,0.4)' : 'rgba(251,191,36,0.4)'}`
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center shadow-md`}
                    >
                      <TreePine className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="text-right">
                      <h3 className={`text-lg font-black text-${primaryColor}-800`}>
                        {farm.farm_name}
                      </h3>
                      <p className="text-sm text-gray-600 font-semibold">
                        {farm.contracts_count} {farm.contracts_count === 1 ? 'عقد' : 'عقود'}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  >
                    <ChevronDown className={`w-5 h-5 text-${primaryColor}-600`} strokeWidth={3} />
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="space-y-3 pr-4 animate-fadeIn">
                  {farm.contracts.map((contract, index) => {
                    const badge = getContractTypeBadge(contract.contract_name);
                    const statusBadge = getStatusBadge(contract.status);
                    const StatusIcon = statusBadge.icon;
                    const progress = calculateProgress(contract.contract_start_date, contract.duration_years);
                    const daysRemaining = calculateDaysRemaining(
                      contract.contract_start_date,
                      contract.duration_years,
                      contract.bonus_years
                    );
                    const treeTypesList = parseTreeTypes(contract.tree_types);

                    return (
                      <div
                        key={contract.id}
                        className="rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200 bg-white transition-all hover:shadow-xl"
                      >
                        <div
                          className={`bg-gradient-to-r ${badge.color} p-3 flex items-center justify-between`}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-white" strokeWidth={2.5} />
                            <span className="text-base font-black text-white">{badge.label}</span>
                          </div>
                          <div className={`px-3 py-1 rounded-full ${statusBadge.color} flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" strokeWidth={2.5} />
                            <span className="text-xs font-bold">{statusBadge.label}</span>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 font-semibold">
                              #{contract.id.substring(0, 8).toUpperCase()}
                            </span>
                            {contract.contract_start_date && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Calendar className="w-3 h-3" />
                                <span className="font-semibold">
                                  {new Date(contract.contract_start_date).toLocaleDateString('ar-SA')}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3 border border-green-200">
                            <TreePine className="w-5 h-5 text-green-600" strokeWidth={2.5} />
                            <span className="text-2xl font-black text-green-700">{contract.total_trees}</span>
                            <span className="text-sm font-bold text-green-600">شجرة</span>
                          </div>

                          {treeTypesList.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {treeTypesList.slice(0, 3).map((treeType, idx) => {
                                const TreeIcon = getTreeIcon(treeType);
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300"
                                  >
                                    <TreeIcon className="w-3 h-3 text-green-700" strokeWidth={2.5} />
                                    <span className="text-xs font-bold text-green-800">{treeType}</span>
                                  </div>
                                );
                              })}
                              {treeTypesList.length > 3 && (
                                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-300">
                                  <span className="text-xs font-bold text-gray-700">
                                    +{treeTypesList.length - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {contract.contract_start_date && contract.duration_years && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-blue-600" />
                                  <span className="font-bold text-blue-700">
                                    {contract.duration_years} سنوات
                                    {contract.bonus_years && contract.bonus_years > 0 && (
                                      <span className="text-green-600 mr-1">
                                        + {contract.bonus_years} مجانًا
                                      </span>
                                    )}
                                  </span>
                                </div>
                                {daysRemaining !== null && (
                                  <span className="font-bold text-gray-600">{daysRemaining} يوم متبقي</span>
                                )}
                              </div>

                              <div className="space-y-1">
                                <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 rounded-full"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <p className="text-xs font-bold text-center text-gray-600">
                                  {progress.toFixed(0)}% مكتمل
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyContracts;
