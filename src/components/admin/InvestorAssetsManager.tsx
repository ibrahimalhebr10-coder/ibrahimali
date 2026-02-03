import { useState, useEffect } from 'react';
import { TreePine, Plus, Trash2, Loader2, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface InvestorAsset {
  id: string;
  investor_id: string;
  tree_type: string;
  total_trees: number;
  active_contracts: number;
  asset_status: 'active' | 'expanding' | 'completed';
  investor_email?: string;
}

interface Investor {
  id: string;
  email: string;
}

const statusOptions = [
  { value: 'active', label: 'نشطة' },
  { value: 'expanding', label: 'في توسعة' },
  { value: 'completed', label: 'مكتملة' }
];

export default function InvestorAssetsManager() {
  const [assets, setAssets] = useState<InvestorAsset[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    investor_id: '',
    tree_type: '',
    total_trees: 1,
    active_contracts: 1,
    asset_status: 'active' as 'active' | 'expanding' | 'completed'
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [assetsRes, investorsRes] = await Promise.all([
        supabase
          .from('investor_assets_summary')
          .select(`
            *,
            user_profiles!investor_id (
              email
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('user_profiles')
          .select('id, email')
          .order('email')
      ]);

      if (assetsRes.error) throw assetsRes.error;
      if (investorsRes.error) throw investorsRes.error;

      const assetsWithEmail = (assetsRes.data || []).map(asset => ({
        ...asset,
        investor_email: asset.user_profiles?.email
      }));

      setAssets(assetsWithEmail);
      setInvestors(investorsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('investor_assets_summary')
        .insert([formData]);

      if (error) throw error;

      await loadData();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error adding asset:', error);
      alert('حدث خطأ في الإضافة');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;

    try {
      const { error } = await supabase
        .from('investor_assets_summary')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('حدث خطأ في الحذف');
    }
  }

  function resetForm() {
    setFormData({
      investor_id: '',
      tree_type: '',
      total_trees: 1,
      active_contracts: 1,
      asset_status: 'active'
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-darkgreen animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">إدارة أصول المستثمرين</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-darkgreen text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة أصل جديد
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المستثمر
              </label>
              <select
                value={formData.investor_id}
                onChange={(e) => setFormData({ ...formData, investor_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
                required
              >
                <option value="">اختر المستثمر</option>
                {investors.map(investor => (
                  <option key={investor.id} value={investor.id}>
                    {investor.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الشجرة
              </label>
              <input
                type="text"
                value={formData.tree_type}
                onChange={(e) => setFormData({ ...formData, tree_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                إجمالي الأشجار
              </label>
              <input
                type="number"
                min="1"
                value={formData.total_trees}
                onChange={(e) => setFormData({ ...formData, total_trees: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العقود النشطة
              </label>
              <input
                type="number"
                min="1"
                value={formData.active_contracts}
                onChange={(e) => setFormData({ ...formData, active_contracts: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                حالة الأصول
              </label>
              <select
                value={formData.asset_status}
                onChange={(e) => setFormData({ ...formData, asset_status: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
                required
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2 bg-darkgreen text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              حفظ
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {assets.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">لا توجد أصول مسجلة</p>
          </div>
        ) : (
          assets.map(asset => (
            <div key={asset.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <TreePine className="w-6 h-6 text-darkgreen" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-bold text-gray-900">{asset.tree_type}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        asset.asset_status === 'active' ? 'bg-green-100 text-green-700' :
                        asset.asset_status === 'expanding' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {statusOptions.find(s => s.value === asset.asset_status)?.label}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      <Users className="w-4 h-4 inline ml-1" />
                      {asset.investor_email}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">إجمالي الأشجار</div>
                        <div className="text-lg font-bold text-gray-900">{asset.total_trees}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">العقود النشطة</div>
                        <div className="text-lg font-bold text-gray-900">{asset.active_contracts}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(asset.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
