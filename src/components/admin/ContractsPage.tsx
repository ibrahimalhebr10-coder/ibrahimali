import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  TreePine,
  MapPin,
  Clock,
  Tag,
  MessageSquare
} from 'lucide-react';
import contractsService, { Contract, ContractStats, FarmWithContracts } from '../../services/contractsService';

const ContractsPage: React.FC = () => {
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [farmsWithContracts, setFarmsWithContracts] = useState<FarmWithContracts[]>([]);
  const [expandedFarms, setExpandedFarms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, farmsData] = await Promise.all([
        contractsService.getContractStats(),
        contractsService.getFarmsWithContracts()
      ]);
      setStats(statsData);
      setFarmsWithContracts(farmsData);
    } catch (error) {
      console.error('Error loading contracts data:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'needs_attention':
        return 'bg-orange-100 text-orange-700 border-orange-200';
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
      case 'needs_attention':
        return 'يحتاج انتباه';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل العقود...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">العقود</h2>
            <p className="text-sm text-gray-500">مركز مراقبة وإدارة حالة العقود</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                نشط
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.active || 0}
            </div>
            <div className="text-sm text-gray-600 mb-3">العقود النشطة</div>
            <div className="flex gap-2 text-xs">
              <div className="flex-1 bg-white rounded-lg p-2 border border-green-200">
                <div className="text-gray-500">زراعي</div>
                <div className="font-bold text-gray-900">{stats?.activeByType.agricultural || 0}</div>
              </div>
              <div className="flex-1 bg-white rounded-lg p-2 border border-green-200">
                <div className="text-gray-500">استثماري</div>
                <div className="font-bold text-gray-900">{stats?.activeByType.investment || 0}</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-300">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                انتباه
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.needsAttention || 0}
            </div>
            <div className="text-sm text-gray-600 mb-3">عقود تتطلب انتباه</div>
            <div className="bg-white rounded-lg p-2 border border-orange-200">
              <div className="text-xs text-orange-700">
                <span className="font-semibold">تنبيه:</span> عقود أقل من 6 أشهر
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="px-3 py-1 bg-gray-500 text-white text-xs font-bold rounded-full">
                مكتمل
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.completed || 0}
            </div>
            <div className="text-sm text-gray-600 mb-3">عقود مكتملة</div>
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="text-xs text-gray-600">
                للأرشفة والتقارير
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {farmsWithContracts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد عقود</h3>
            <p className="text-sm text-gray-600">لا توجد عقود نشطة أو مكتملة حالياً</p>
          </div>
        ) : (
          farmsWithContracts.map((farm) => (
            <div key={farm.farm_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggleFarm(farm.farm_id)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <TreePine className="w-6 h-6 text-white" />
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
                  <div className="flex gap-2">
                    {farm.active_count > 0 && (
                      <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {farm.active_count} نشط
                      </div>
                    )}
                    {farm.needs_attention_count > 0 && (
                      <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                        {farm.needs_attention_count} انتباه
                      </div>
                    )}
                    {farm.completed_count > 0 && (
                      <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        {farm.completed_count} مكتمل
                      </div>
                    )}
                  </div>
                  {expandedFarms.has(farm.farm_id) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {expandedFarms.has(farm.farm_id) && (
                <div className="border-t border-gray-100 p-6 bg-gray-50">
                  <div className="space-y-4">
                    {farm.contracts.map((contract) => {
                      const daysRemaining = contractsService.calculateDaysRemaining(contract.end_date);
                      const progress = contractsService.calculateProgress(contract.start_date, contract.end_date);

                      return (
                        <div
                          key={contract.id}
                          className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-green-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`
                                w-10 h-10 rounded-lg flex items-center justify-center
                                ${contract.contract_type === 'agricultural'
                                  ? 'bg-green-100'
                                  : 'bg-blue-100'
                                }
                              `}>
                                {contract.contract_type === 'agricultural' ? (
                                  <TreePine className={`w-5 h-5 ${contract.contract_type === 'agricultural' ? 'text-green-600' : 'text-blue-600'}`} />
                                ) : (
                                  <FileText className="w-5 h-5 text-blue-600" />
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900">
                                  {contract.contract_type === 'agricultural' ? 'عقد زراعي' : 'عقد استثماري'}
                                </div>
                                <div className="text-sm text-gray-500">#{contract.id.slice(0, 8)}</div>
                              </div>
                            </div>

                            <div className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${getStatusColor(contract.status)}`}>
                              {getStatusLabel(contract.status)}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4" />
                              <span>{contract.user_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <TreePine className="w-4 h-4" />
                              <span>{contract.tree_count} شجرة</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(contract.start_date).toLocaleDateString('ar-SA')}</span>
                            </div>
                          </div>

                          {contract.tree_types && contract.tree_types.length > 0 && (
                            <div className="mb-4">
                              <div className="text-xs text-gray-500 mb-2">أنواع الأشجار:</div>
                              <div className="flex flex-wrap gap-2">
                                {contract.tree_types.map((type, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs border border-green-200"
                                  >
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>المدة المتبقية</span>
                              </div>
                              <div className={`font-bold ${daysRemaining < 0 ? 'text-gray-600' : daysRemaining < 180 ? 'text-red-600' : 'text-gray-900'}`}>
                                {daysRemaining < 0 ? 'منتهي' : `${daysRemaining} يوم`}
                              </div>
                            </div>

                            <div className="relative">
                              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${getProgressColor(daysRemaining)}`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                ></div>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-white drop-shadow-lg">
                                  {Math.round(progress)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="text-xs text-gray-500 mb-2">إجراءات الإدارة:</div>
                            <div className="flex flex-wrap gap-2">
                              <button className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200 flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                يحتاج تواصل
                              </button>
                              <button className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors border border-green-200 flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                مرشح للتجديد
                              </button>
                              <button className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors border border-purple-200 flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                مرشح للتوسعة
                              </button>
                              <button className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors border border-gray-200 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                إضافة ملاحظة
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContractsPage;
