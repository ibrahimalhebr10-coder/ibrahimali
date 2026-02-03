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
  MessageSquare,
  Filter,
  Search,
  RefreshCw,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import contractsService, { Contract, ContractStats, FarmWithContracts } from '../../services/contractsService';

const ContractsPage: React.FC = () => {
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [farmsWithContracts, setFarmsWithContracts] = useState<FarmWithContracts[]>([]);
  const [filteredFarms, setFilteredFarms] = useState<FarmWithContracts[]>([]);
  const [expandedFarms, setExpandedFarms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'needs_attention' | 'completed'>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterContracts();
  }, [searchTerm, filterStatus, farmsWithContracts]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, farmsData] = await Promise.all([
        contractsService.getContractStats(),
        contractsService.getFarmsWithContracts()
      ]);
      setStats(statsData);
      setFarmsWithContracts(farmsData);
      setFilteredFarms(farmsData);
    } catch (error) {
      console.error('Error loading contracts data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filterContracts = () => {
    let filtered = [...farmsWithContracts];

    if (searchTerm) {
      filtered = filtered.map(farm => ({
        ...farm,
        contracts: farm.contracts.filter(contract =>
          contract.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.farm_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.id.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(farm => farm.contracts.length > 0);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.map(farm => ({
        ...farm,
        contracts: farm.contracts.filter(contract => contract.status === filterStatus)
      })).filter(farm => farm.contracts.length > 0);
    }

    setFilteredFarms(filtered);
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

  const getTotalContracts = () => {
    return farmsWithContracts.reduce((sum, farm) => sum + farm.total_contracts, 0);
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">مركز العقود</h2>
              <p className="text-sm text-gray-500">مراقبة وإدارة حالة العقود المرتبطة بالحجوزات</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-sm">
                نشط
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.active || 0}
            </div>
            <div className="text-sm text-gray-600 mb-3 font-medium">العقود النشطة</div>
            <div className="flex gap-2 text-xs">
              <div className="flex-1 bg-white rounded-lg p-2.5 border border-green-200 shadow-sm">
                <div className="flex items-center gap-1 text-gray-500 mb-1">
                  <TreePine className="w-3 h-3" />
                  <span>زراعي</span>
                </div>
                <div className="font-bold text-gray-900 text-lg">{stats?.activeByType.agricultural || 0}</div>
              </div>
              <div className="flex-1 bg-white rounded-lg p-2.5 border border-green-200 shadow-sm">
                <div className="flex items-center gap-1 text-gray-500 mb-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>استثماري</span>
                </div>
                <div className="font-bold text-gray-900 text-lg">{stats?.activeByType.investment || 0}</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-300 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow-sm animate-pulse">
                انتباه
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.needsAttention || 0}
            </div>
            <div className="text-sm text-gray-600 mb-3 font-medium">عقود تتطلب انتباه</div>
            <div className="bg-white rounded-lg p-2.5 border border-orange-200 shadow-sm">
              <div className="text-xs text-orange-700 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span><span className="font-semibold">تنبيه:</span> عقود أقل من 6 أشهر</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center shadow-md">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="px-3 py-1 bg-gray-500 text-white text-xs font-bold rounded-full shadow-sm">
                مكتمل
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.completed || 0}
            </div>
            <div className="text-sm text-gray-600 mb-3 font-medium">عقود مكتملة</div>
            <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
              <div className="text-xs text-gray-600 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>للأرشفة والتقارير</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <div className="font-semibold text-blue-900 mb-1">إجمالي العقود في النظام</div>
              <div className="text-2xl font-bold text-blue-700">{getTotalContracts()} عقد</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="البحث عن عقد أو عميل أو مزرعة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-right transition-all"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                filterStatus === 'all'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              الكل
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                filterStatus === 'active'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              نشط
            </button>
            <button
              onClick={() => setFilterStatus('needs_attention')}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                filterStatus === 'needs_attention'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
              }`}
            >
              انتباه
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                filterStatus === 'completed'
                  ? 'bg-gray-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              مكتمل
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredFarms.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'لا توجد نتائج' : 'لا توجد عقود'}
            </h3>
            <p className="text-sm text-gray-600">
              {searchTerm || filterStatus !== 'all'
                ? 'حاول تعديل البحث أو الفلتر'
                : 'لا توجد عقود نشطة أو مكتملة حالياً'}
            </p>
          </div>
        ) : (
          filteredFarms.map((farm) => (
            <div key={farm.farm_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <button
                onClick={() => toggleFarm(farm.farm_id)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
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
                  <div className="flex gap-2">
                    {farm.active_count > 0 && (
                      <div className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold border border-green-200 shadow-sm">
                        {farm.active_count} نشط
                      </div>
                    )}
                    {farm.needs_attention_count > 0 && (
                      <div className="px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-bold border border-orange-200 shadow-sm animate-pulse">
                        {farm.needs_attention_count} انتباه
                      </div>
                    )}
                    {farm.completed_count > 0 && (
                      <div className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-bold border border-gray-200 shadow-sm">
                        {farm.completed_count} مكتمل
                      </div>
                    )}
                  </div>
                  <div className="mr-2">
                    {expandedFarms.has(farm.farm_id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>

              {expandedFarms.has(farm.farm_id) && (
                <div className="border-t border-gray-100 p-6 bg-gradient-to-br from-gray-50 to-white">
                  <div className="space-y-4">
                    {farm.contracts.map((contract) => {
                      const daysRemaining = contractsService.calculateDaysRemaining(contract.end_date);
                      const progress = contractsService.calculateProgress(contract.start_date, contract.end_date);

                      return (
                        <div
                          key={contract.id}
                          className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-green-300 transition-all shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`
                                w-12 h-12 rounded-xl flex items-center justify-center shadow-md
                                ${contract.contract_type === 'agricultural'
                                  ? 'bg-gradient-to-br from-green-400 to-green-600'
                                  : 'bg-gradient-to-br from-blue-400 to-blue-600'
                                }
                              `}>
                                {contract.contract_type === 'agricultural' ? (
                                  <TreePine className="w-6 h-6 text-white" />
                                ) : (
                                  <TrendingUp className="w-6 h-6 text-white" />
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

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">العميل</div>
                                <div className="font-semibold text-gray-900">{contract.user_name}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <TreePine className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">عدد الأشجار</div>
                                <div className="font-semibold text-gray-900">{contract.tree_count} شجرة</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <Calendar className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">تاريخ البداية</div>
                                <div className="font-semibold text-gray-900">{new Date(contract.start_date).toLocaleDateString('ar-SA')}</div>
                              </div>
                            </div>
                          </div>

                          {contract.tree_types && contract.tree_types.length > 0 && (
                            <div className="mb-5">
                              <div className="text-xs text-gray-500 mb-2 font-semibold">أنواع الأشجار:</div>
                              <div className="flex flex-wrap gap-2">
                                {contract.tree_types.map((type, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-200 shadow-sm"
                                  >
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 mb-4 border border-gray-200">
                            <div className="flex items-center justify-between text-sm mb-3">
                              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <span>المدة المتبقية</span>
                              </div>
                              <div className={`font-bold text-lg ${daysRemaining < 0 ? 'text-gray-600' : daysRemaining < 180 ? 'text-red-600' : daysRemaining < 365 ? 'text-orange-600' : 'text-green-600'}`}>
                                {daysRemaining < 0 ? 'منتهي' : `${daysRemaining} يوم`}
                              </div>
                            </div>

                            <div className="relative">
                              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                <div
                                  className={`h-full transition-all duration-500 ${getProgressColor(daysRemaining)}`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                ></div>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                  {Math.round(progress)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t-2 border-gray-200">
                            <div className="text-xs text-gray-500 mb-3 font-semibold flex items-center gap-2">
                              <Tag className="w-4 h-4" />
                              إجراءات الإدارة:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all border border-blue-200 flex items-center gap-1.5 shadow-sm hover:shadow">
                                <Tag className="w-3.5 h-3.5" />
                                يحتاج تواصل
                              </button>
                              <button className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100 transition-all border border-green-200 flex items-center gap-1.5 shadow-sm hover:shadow">
                                <RefreshCw className="w-3.5 h-3.5" />
                                مرشح للتجديد
                              </button>
                              <button className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-all border border-purple-200 flex items-center gap-1.5 shadow-sm hover:shadow">
                                <TrendingUp className="w-3.5 h-3.5" />
                                مرشح للتوسعة
                              </button>
                              <button className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-100 transition-all border border-gray-200 flex items-center gap-1.5 shadow-sm hover:shadow">
                                <MessageSquare className="w-3.5 h-3.5" />
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
