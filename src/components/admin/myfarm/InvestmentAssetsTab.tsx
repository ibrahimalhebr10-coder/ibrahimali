import React, { useState, useEffect } from 'react';
import { Plus, TreePine, Building2, FileText, Edit2, Trash2, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface InvestmentAsset {
  id: string;
  user_id: string;
  farm_id: string;
  contract_id: string | null;
  tree_type: string;
  quantity: number;
  acquisition_date: string;
  notes: string | null;
  created_at: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface Farm {
  id: string;
  name: string;
}

interface Contract {
  id: string;
  reference_number: string;
}

const InvestmentAssetsTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [assets, setAssets] = useState<InvestmentAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    farm_id: '',
    contract_id: '',
    tree_type: '',
    quantity: 0,
    acquisition_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    loadUsers();
    loadFarms();
    loadContracts();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadAssets();
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .order('full_name');
    if (data) setUsers(data);
  };

  const loadFarms = async () => {
    const { data } = await supabase
      .from('farms')
      .select('id, name')
      .order('name');
    if (data) setFarms(data);
  };

  const loadContracts = async () => {
    const { data } = await supabase
      .from('reservations')
      .select('id, reference_number')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (data) setContracts(data);
  };

  const loadAssets = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    const { data } = await supabase
      .from('investment_agricultural_assets')
      .select('*')
      .eq('user_id', selectedUserId)
      .order('created_at', { ascending: false });

    if (data) setAssets(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    const payload = {
      ...formData,
      user_id: selectedUserId,
      contract_id: formData.contract_id || null,
    };

    if (editingId) {
      await supabase
        .from('investment_agricultural_assets')
        .update(payload)
        .eq('id', editingId);
    } else {
      await supabase
        .from('investment_agricultural_assets')
        .insert([payload]);
    }

    resetForm();
    loadAssets();
  };

  const handleEdit = (asset: InvestmentAsset) => {
    setEditingId(asset.id);
    setFormData({
      farm_id: asset.farm_id,
      contract_id: asset.contract_id || '',
      tree_type: asset.tree_type,
      quantity: asset.quantity,
      acquisition_date: asset.acquisition_date,
      notes: asset.notes || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الأصل؟')) {
      await supabase
        .from('investment_agricultural_assets')
        .delete()
        .eq('id', id);
      loadAssets();
    }
  };

  const resetForm = () => {
    setFormData({
      farm_id: '',
      contract_id: '',
      tree_type: '',
      quantity: 0,
      acquisition_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const filteredAssets = assets.filter(asset =>
    asset.tree_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTrees = assets.reduce((sum, asset) => sum + asset.quantity, 0);
  const totalFarms = new Set(assets.map(a => a.farm_id)).size;

  const getFarmName = (farmId: string) => {
    return farms.find(f => f.id === farmId)?.name || 'غير محدد';
  };

  const getContractRef = (contractId: string | null) => {
    if (!contractId) return 'بدون عقد';
    return contracts.find(c => c.id === contractId)?.reference_number || 'غير محدد';
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-darkgreen">الأصول الزراعية</h2>
          <p className="text-gray-600 text-sm mt-1">عرض وإدارة أصول المستثمر من الأشجار</p>
        </div>
        {selectedUserId && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة أصل</span>
          </button>
        )}
      </div>

      {/* User Selector */}
      <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg p-4 border border-blue-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">اختر المستثمر</label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- اختر مستثمر --</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      {selectedUserId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الأشجار</p>
                  <p className="text-2xl font-bold text-darkgreen mt-1">{totalTrees}</p>
                </div>
                <TreePine className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">عدد المزارع</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{totalFarms}</p>
                </div>
                <Building2 className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">أنواع الأشجار</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">
                    {new Set(assets.map(a => a.tree_type)).size}
                  </p>
                </div>
                <FileText className="w-10 h-10 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث عن نوع شجرة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Assets List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">جاري التحميل...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <TreePine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد أصول مسجلة لهذا المستثمر</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                إضافة أول أصل
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssets.map((asset) => (
                <div key={asset.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                        <TreePine className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{asset.tree_type}</h3>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                            {asset.quantity} شجرة
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">المزرعة:</span>
                            <span className="font-medium text-gray-900">{getFarmName(asset.farm_id)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">العقد:</span>
                            <span className="font-medium text-gray-900">{getContractRef(asset.contract_id)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          تاريخ الاستحواذ: {new Date(asset.acquisition_date).toLocaleDateString('ar-SA')}
                        </p>
                        {asset.notes && (
                          <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">{asset.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(asset)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-darkgreen">
                {editingId ? 'تعديل الأصل' : 'إضافة أصل جديد'}
              </h3>
              {selectedUser && (
                <p className="text-sm text-gray-600 mt-1">
                  للمستثمر: {selectedUser.full_name}
                </p>
              )}
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المزرعة *</label>
                <select
                  required
                  value={formData.farm_id}
                  onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- اختر مزرعة --</option>
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">العقد المرتبط</label>
                <select
                  value={formData.contract_id}
                  onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- بدون عقد --</option>
                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.reference_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع الشجرة *</label>
                <input
                  type="text"
                  required
                  value={formData.tree_type}
                  onChange={(e) => setFormData({ ...formData, tree_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: زيتون، نخيل"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">العدد *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الاستحواذ *</label>
                <input
                  type="date"
                  required
                  value={formData.acquisition_date}
                  onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingId ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentAssetsTab;
