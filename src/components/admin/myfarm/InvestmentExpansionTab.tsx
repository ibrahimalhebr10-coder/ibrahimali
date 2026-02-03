import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Building2, TreePine, Edit2, Trash2, Search, DollarSign } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface ExpansionOpportunity {
  id: string;
  user_id: string;
  opportunity_type: 'إضافة أشجار' | 'ترقية عقد' | 'دخول مزرعة جديدة';
  farm_id: string | null;
  title: string;
  description: string | null;
  estimated_investment: number;
  potential_trees: number;
  is_active: boolean;
  created_at: string;
}

interface User {
  id: string;
  full_name: string;
  phone: string;
}

interface Farm {
  id: string;
  name_ar: string;
}

const InvestmentExpansionTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [opportunities, setOpportunities] = useState<ExpansionOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const [formData, setFormData] = useState({
    opportunity_type: 'إضافة أشجار' as ExpansionOpportunity['opportunity_type'],
    farm_id: '',
    title: '',
    description: '',
    estimated_investment: 0,
    potential_trees: 0,
    is_active: true,
  });

  useEffect(() => {
    loadUsers();
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadOpportunities();
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, full_name, phone')
      .order('full_name');
    if (data) setUsers(data);
  };

  const loadFarms = async () => {
    const { data } = await supabase
      .from('farms')
      .select('id, name_ar')
      .order('name_ar');
    if (data) setFarms(data);
  };

  const loadOpportunities = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    const { data } = await supabase
      .from('investment_expansion_opportunities')
      .select('*')
      .eq('user_id', selectedUserId)
      .order('created_at', { ascending: false });

    if (data) setOpportunities(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    const payload = {
      ...formData,
      user_id: selectedUserId,
      farm_id: formData.farm_id || null,
    };

    if (editingId) {
      await supabase
        .from('investment_expansion_opportunities')
        .update(payload)
        .eq('id', editingId);
    } else {
      await supabase
        .from('investment_expansion_opportunities')
        .insert([payload]);
    }

    resetForm();
    loadOpportunities();
  };

  const handleEdit = (opportunity: ExpansionOpportunity) => {
    setEditingId(opportunity.id);
    setFormData({
      opportunity_type: opportunity.opportunity_type,
      farm_id: opportunity.farm_id || '',
      title: opportunity.title,
      description: opportunity.description || '',
      estimated_investment: opportunity.estimated_investment,
      potential_trees: opportunity.potential_trees,
      is_active: opportunity.is_active,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الفرصة؟')) {
      await supabase
        .from('investment_expansion_opportunities')
        .delete()
        .eq('id', id);
      loadOpportunities();
    }
  };

  const resetForm = () => {
    setFormData({
      opportunity_type: 'إضافة أشجار',
      farm_id: '',
      title: '',
      description: '',
      estimated_investment: 0,
      potential_trees: 0,
      is_active: true,
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const getOpportunityIcon = (type: ExpansionOpportunity['opportunity_type']) => {
    const icons = {
      'إضافة أشجار': TreePine,
      'ترقية عقد': TrendingUp,
      'دخول مزرعة جديدة': Building2,
    };
    return icons[type];
  };

  const getOpportunityColor = (type: ExpansionOpportunity['opportunity_type']) => {
    const colors = {
      'إضافة أشجار': 'bg-green-100 text-green-700 border-green-200',
      'ترقية عقد': 'bg-blue-100 text-blue-700 border-blue-200',
      'دخول مزرعة جديدة': 'bg-violet-100 text-violet-700 border-violet-200',
    };
    return colors[type];
  };

  const getFarmName = (farmId: string | null) => {
    if (!farmId) return 'غير محدد';
    return farms.find(f => f.id === farmId)?.name_ar || 'غير محدد';
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  const filteredOpportunities = opportunities.filter(op => {
    const matchesSearch = op.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         op.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || op.opportunity_type === filterType;
    return matchesSearch && matchesType;
  });

  const activeOpportunities = opportunities.filter(o => o.is_active).length;
  const totalInvestment = opportunities
    .filter(o => o.is_active)
    .reduce((sum, o) => sum + o.estimated_investment, 0);
  const totalTrees = opportunities
    .filter(o => o.is_active)
    .reduce((sum, o) => sum + o.potential_trees, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-darkgreen">فرص التوسعة</h2>
          <p className="text-gray-600 text-sm mt-1">إدارة فرص نمو وتوسع الاستثمار</p>
        </div>
        {selectedUserId && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة فرصة</span>
          </button>
        )}
      </div>

      {/* User Selector */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-4 border border-violet-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">اختر المستثمر</label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        >
          <option value="">-- اختر مستثمر --</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name} ({user.phone})
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
                  <p className="text-sm text-gray-600">فرص نشطة</p>
                  <p className="text-2xl font-bold text-darkgreen mt-1">{activeOpportunities}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-violet-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">الاستثمار المتوقع</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{totalInvestment.toLocaleString()} SAR</p>
                </div>
                <DollarSign className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">أشجار محتملة</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{totalTrees}</p>
                </div>
                <TreePine className="w-10 h-10 text-green-600" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="البحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="all">جميع الأنواع</option>
              <option value="إضافة أشجار">إضافة أشجار</option>
              <option value="ترقية عقد">ترقية عقد</option>
              <option value="دخول مزرعة جديدة">دخول مزرعة جديدة</option>
            </select>
          </div>

          {/* Opportunities List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">جاري التحميل...</p>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد فرص توسعة</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                إضافة أول فرصة
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOpportunities.map((opportunity) => {
                const OpportunityIcon = getOpportunityIcon(opportunity.opportunity_type);
                return (
                  <div key={opportunity.id} className={`bg-white rounded-lg border-2 p-4 shadow-sm hover:shadow-md transition-shadow ${getOpportunityColor(opportunity.opportunity_type)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md">
                          <OpportunityIcon className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold">{opportunity.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              opportunity.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {opportunity.is_active ? 'نشط' : 'غير نشط'}
                            </span>
                          </div>
                          <p className="text-sm mb-3">{opportunity.opportunity_type}</p>
                          {opportunity.description && (
                            <p className="text-sm mb-3 bg-white/50 p-2 rounded">{opportunity.description}</p>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            {opportunity.farm_id && (
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span>{getFarmName(opportunity.farm_id)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <span className="font-semibold">{opportunity.estimated_investment.toLocaleString()} SAR</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TreePine className="w-4 h-4 text-gray-400" />
                              <span className="font-semibold">{opportunity.potential_trees} شجرة</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(opportunity)}
                          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(opportunity.id)}
                          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                {editingId ? 'تعديل الفرصة' : 'إضافة فرصة توسعة'}
              </h3>
              {selectedUser && (
                <p className="text-sm text-gray-600 mt-1">
                  للمستثمر: {selectedUser.full_name}
                </p>
              )}
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع الفرصة *</label>
                <select
                  required
                  value={formData.opportunity_type}
                  onChange={(e) => setFormData({ ...formData, opportunity_type: e.target.value as ExpansionOpportunity['opportunity_type'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                >
                  <option value="إضافة أشجار">إضافة أشجار</option>
                  <option value="ترقية عقد">ترقية عقد</option>
                  <option value="دخول مزرعة جديدة">دخول مزرعة جديدة</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المزرعة</label>
                <select
                  value={formData.farm_id}
                  onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                >
                  <option value="">-- غير محدد --</option>
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عنوان الفرصة *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="مثال: إضافة 50 شجرة زيتون"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">وصف الفرصة</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="تفاصيل الفرصة..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الاستثمار المتوقع (SAR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.estimated_investment}
                    onChange={(e) => setFormData({ ...formData, estimated_investment: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الأشجار المحتملة</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.potential_trees}
                    onChange={(e) => setFormData({ ...formData, potential_trees: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-violet-600 rounded focus:ring-2 focus:ring-violet-500"
                  />
                  <span className="font-medium text-gray-900">الفرصة نشطة</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
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

export default InvestmentExpansionTab;
