import React, { useState, useEffect } from 'react';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  TreePine,
  MapPin,
  Clock,
  Award,
  Leaf
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Contract {
  id: string;
  farm_id: string;
  farm_name: string;
  contract_type: 'agricultural' | 'investment';
  number_of_trees: number;
  tree_types: string[];
  contract_start_date: string;
  contract_end_date: string;
  status: string;
}

interface FarmWithMyContracts {
  farm_id: string;
  farm_name: string;
  location: string;
  contracts_count: number;
  contracts: Contract[];
}

const MyContracts: React.FC = () => {
  const { user } = useAuth();
  const [farmsWithContracts, setFarmsWithContracts] = useState<FarmWithMyContracts[]>([]);
  const [expandedFarms, setExpandedFarms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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
        .select(`
          id,
          farm_id,
          contract_type,
          number_of_trees,
          tree_types,
          contract_start_date,
          contract_end_date,
          status,
          farms (
            id,
            name,
            location
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'completed', 'waiting_for_payment']);

      if (error) throw error;

      const farmMap = new Map<string, FarmWithMyContracts>();

      reservations?.forEach((reservation: any) => {
        const farm = reservation.farms;
        if (!farm) return;

        const farmId = farm.id;

        if (!farmMap.has(farmId)) {
          farmMap.set(farmId, {
            farm_id: farmId,
            farm_name: farm.name,
            location: farm.location || 'غير محدد',
            contracts_count: 0,
            contracts: []
          });
        }

        const farmData = farmMap.get(farmId)!;
        farmData.contracts_count++;
        farmData.contracts.push({
          id: reservation.id,
          farm_id: farmId,
          farm_name: farm.name,
          contract_type: reservation.contract_type || 'agricultural',
          number_of_trees: reservation.number_of_trees || 0,
          tree_types: reservation.tree_types || [],
          contract_start_date: reservation.contract_start_date,
          contract_end_date: reservation.contract_end_date,
          status: reservation.status
        });
      });

      setFarmsWithContracts(Array.from(farmMap.values()));
    } catch (error) {
      console.error('Error loading my contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFarm = (farmId: string) => {
    const newExpanded = new Set(expandedFarms);
    if (newExpanded.has(farmId)) {
      newExpanded.delete(farmId);
    } else {
      newExpanded.add(farmId);
    }
    setExpandedFarms(newExpanded);
  };

  const calculateDaysRemaining = (endDate: string): number => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateProgress = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();

    const progress = (elapsed / totalDuration) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'waiting_for_payment':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'waiting_for_payment':
        return 'بانتظار الدفع';
      case 'completed':
        return 'مكتمل';
      default:
        return status;
    }
  };

  const getProgressColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return 'bg-gray-500';
    if (daysRemaining < 180) return 'bg-red-500';
    if (daysRemaining < 365) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getTotalContracts = () => {
    return farmsWithContracts.reduce((sum, farm) => sum + farm.contracts_count, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل عقودي...</p>
        </div>
      </div>
    );
  }

  if (farmsWithContracts.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد عقود بعد</h3>
        <p className="text-sm text-gray-600 mb-6">
          عندما تحجز أشجارك، ستظهر عقودك هنا
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">عقودي</h3>
              <p className="text-sm text-green-700">جميع عقودك في مكان واحد</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-700">{getTotalContracts()}</div>
            <div className="text-xs text-green-600 font-medium">عقد نشط</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {farmsWithContracts.map((farm) => (
          <div
            key={farm.farm_id}
            className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:border-green-300"
          >
            <button
              onClick={() => toggleFarm(farm.farm_id)}
              className="w-full p-6 flex items-center justify-between hover:bg-gradient-to-r hover:from-green-50 hover:to-transparent transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TreePine className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold text-gray-900">{farm.farm_name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{farm.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="px-6 py-2.5 bg-green-100 text-green-700 rounded-full font-bold border-2 border-green-200 shadow-sm">
                  {farm.contracts_count} {farm.contracts_count === 1 ? 'عقد' : 'عقود'}
                </div>
                <div>
                  {expandedFarms.has(farm.farm_id) ? (
                    <ChevronUp className="w-6 h-6 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>
            </button>

            {expandedFarms.has(farm.farm_id) && (
              <div className="border-t-2 border-gray-100 p-6 bg-gradient-to-br from-gray-50 to-white">
                <div className="space-y-4">
                  {farm.contracts.map((contract) => {
                    const daysRemaining = calculateDaysRemaining(contract.contract_end_date);
                    const progress = calculateProgress(contract.contract_start_date, contract.contract_end_date);

                    return (
                      <div
                        key={contract.id}
                        className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-green-300 transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-12 h-12 rounded-xl flex items-center justify-center shadow-md
                              ${contract.contract_type === 'agricultural'
                                ? 'bg-gradient-to-br from-green-400 to-green-600'
                                : 'bg-gradient-to-br from-blue-400 to-blue-600'
                              }
                            `}>
                              {contract.contract_type === 'agricultural' ? (
                                <Leaf className="w-6 h-6 text-white" />
                              ) : (
                                <Award className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-lg">
                                {contract.contract_type === 'agricultural' ? 'عقد زراعي' : 'عقد استثماري'}
                              </div>
                              <div className="text-sm text-gray-500 font-mono">#{contract.id.slice(0, 8)}</div>
                            </div>
                          </div>

                          <div className={`px-4 py-2 rounded-full text-sm font-bold border-2 shadow-sm ${getStatusColor(contract.status)}`}>
                            {getStatusLabel(contract.status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-5 bg-gradient-to-br from-gray-50 to-green-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-green-200">
                              <TreePine className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">عدد الأشجار</div>
                              <div className="font-bold text-gray-900 text-lg">{contract.number_of_trees}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-blue-200">
                              <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">تاريخ البداية</div>
                              <div className="font-bold text-gray-900">
                                {new Date(contract.contract_start_date).toLocaleDateString('ar-SA')}
                              </div>
                            </div>
                          </div>
                        </div>

                        {contract.tree_types && contract.tree_types.length > 0 && (
                          <div className="mb-5">
                            <div className="text-xs text-gray-600 mb-2 font-bold flex items-center gap-2">
                              <Leaf className="w-4 h-4 text-green-600" />
                              أنواع أشجاري:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {contract.tree_types.map((type, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-lg text-xs font-bold border-2 border-green-200 shadow-sm"
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {contract.status === 'active' && (
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                            <div className="flex items-center justify-between text-sm mb-3">
                              <div className="flex items-center gap-2 text-gray-700 font-bold">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <span>المدة المتبقية</span>
                              </div>
                              <div className={`font-bold text-lg ${
                                daysRemaining < 0
                                  ? 'text-gray-600'
                                  : daysRemaining < 180
                                  ? 'text-red-600'
                                  : daysRemaining < 365
                                  ? 'text-orange-600'
                                  : 'text-green-600'
                              }`}>
                                {daysRemaining < 0 ? 'منتهي' : `${daysRemaining} يوم`}
                              </div>
                            </div>

                            <div className="relative">
                              <div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden shadow-inner border-2 border-gray-300">
                                <div
                                  className={`h-full transition-all duration-500 ${getProgressColor(daysRemaining)}`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                ></div>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                                  {Math.round(progress)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyContracts;
