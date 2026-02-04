import React, { useState, useEffect } from 'react';
import { Droplets, Scissors, Leaf, Bug, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Operation {
  id: string;
  farm_id: string;
  operation_type: 'ري' | 'تقليم' | 'تسميد' | 'مكافحة آفات';
  operation_date: string;
  description: string;
  total_cost: number;
  cost_per_tree: number;
  created_at: string;
}

interface InvestorAsset {
  farm_id: string;
  tree_quantity: number;
  farm_name: string;
}

interface OperationWithCost extends Operation {
  investor_cost: number;
}

const OperatingCostsTab: React.FC = () => {
  const [operations, setOperations] = useState<OperationWithCost[]>([]);
  const [investorAssets, setInvestorAssets] = useState<InvestorAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  useEffect(() => {
    loadInvestorData();
  }, []);

  const loadInvestorData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!userProfile) return;

    const { data: assets } = await supabase
      .from('investment_agricultural_assets')
      .select(`
        farm_id,
        quantity,
        farms:farm_id (
          name_ar
        )
      `)
      .eq('user_id', userProfile.id);

    if (assets) {
      const formattedAssets = assets.map((asset: any) => ({
        farm_id: asset.farm_id,
        tree_quantity: asset.quantity,
        farm_name: asset.farms?.name_ar || 'مزرعة',
      }));
      setInvestorAssets(formattedAssets);

      const farmIds = formattedAssets.map(a => a.farm_id);
      if (farmIds.length > 0) {
        await loadOperations(farmIds, formattedAssets);
      }
    }

    setLoading(false);
  };

  const loadOperations = async (farmIds: string[], assets: InvestorAsset[]) => {
    const { data } = await supabase
      .from('agricultural_operations')
      .select('*')
      .in('farm_id', farmIds)
      .order('operation_date', { ascending: false });

    if (data) {
      const operationsWithCost = data.map((op: Operation) => {
        const asset = assets.find(a => a.farm_id === op.farm_id);
        const investorCost = asset ? op.cost_per_tree * asset.tree_quantity : 0;

        return {
          ...op,
          investor_cost: investorCost,
        };
      });
      setOperations(operationsWithCost);
    }
  };

  const getOperationIcon = (type: Operation['operation_type']) => {
    const icons = {
      'ري': Droplets,
      'تقليم': Scissors,
      'تسميد': Leaf,
      'مكافحة آفات': Bug,
    };
    return icons[type];
  };

  const getOperationColor = (type: Operation['operation_type']) => {
    const colors = {
      'ري': 'bg-blue-100 text-blue-700',
      'تقليم': 'bg-amber-100 text-amber-700',
      'تسميد': 'bg-green-100 text-green-700',
      'مكافحة آفات': 'bg-red-100 text-red-700',
    };
    return colors[type];
  };

  const filteredOperations = operations.filter(op => {
    if (selectedPeriod === 'all') return true;

    const operationDate = new Date(op.operation_date);
    const now = new Date();

    if (selectedPeriod === 'month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      return operationDate >= monthAgo;
    }

    if (selectedPeriod === 'quarter') {
      const quarterAgo = new Date(now.setMonth(now.getMonth() - 3));
      return operationDate >= quarterAgo;
    }

    if (selectedPeriod === 'year') {
      const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
      return operationDate >= yearAgo;
    }

    return true;
  });

  const totalInvestorCost = filteredOperations.reduce((sum, op) => sum + op.investor_cost, 0);
  const totalTrees = investorAssets.reduce((sum, asset) => sum + asset.tree_quantity, 0);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">جاري التحميل...</p>
      </div>
    );
  }

  if (investorAssets.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">ليس لديك أصول استثمارية حاليًا</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-darkgreen">تكاليف التشغيل</h2>
        <p className="text-gray-600 text-sm mt-1">تكاليف العمليات الزراعية المحسوبة حسب عدد أشجارك</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-6 border border-blue-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-blue-900 font-medium">إجمالي الأشجار</p>
          </div>
          <p className="text-3xl font-bold text-blue-700">{totalTrees.toLocaleString('ar-SA')}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-green-900 font-medium">إجمالي التكاليف</p>
          </div>
          <p className="text-3xl font-bold text-green-700">{totalInvestorCost.toLocaleString('ar-SA')} ريال</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-amber-900 font-medium">عدد العمليات</p>
          </div>
          <p className="text-3xl font-bold text-amber-700">{filteredOperations.length}</p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">الفترة الزمنية</label>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">جميع الفترات</option>
          <option value="month">آخر شهر</option>
          <option value="quarter">آخر 3 أشهر</option>
          <option value="year">آخر سنة</option>
        </select>
      </div>

      {/* Operations List */}
      {filteredOperations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Droplets className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">لا توجد عمليات تشغيل في هذه الفترة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOperations.map((operation) => {
            const OperationIcon = getOperationIcon(operation.operation_type);
            const asset = investorAssets.find(a => a.farm_id === operation.farm_id);

            return (
              <div key={operation.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getOperationColor(operation.operation_type)}`}>
                    <OperationIcon className="w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{operation.operation_type}</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {asset?.farm_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(operation.operation_date).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-3">{operation.description}</p>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-xs text-green-700 mb-0.5">نصيبك من التكلفة</p>
                            <p className="text-lg font-bold text-green-900">
                              {operation.investor_cost.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال
                            </p>
                          </div>
                        </div>

                        <div className="text-left">
                          <p className="text-xs text-green-700 mb-0.5">عدد أشجارك</p>
                          <p className="text-sm font-medium text-green-800">{asset?.tree_quantity} شجرة</p>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-green-200">
                        <p className="text-xs text-green-600">
                          الحساب: {asset?.tree_quantity} شجرة × {operation.cost_per_tree.toFixed(2)} ريال/شجرة
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>ملاحظة:</strong> التكاليف المعروضة هي نصيبك المحسوب بناءً على عدد الأشجار التي تملكها في كل مزرعة. يتم حساب التكلفة تلقائيًا: عدد أشجارك × تكلفة الشجرة الواحدة للعملية.
        </p>
      </div>
    </div>
  );
};

export default OperatingCostsTab;
