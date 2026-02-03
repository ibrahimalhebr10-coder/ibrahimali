import React, { useState, useEffect } from 'react';
import { Plus, TreePine, Sprout, Apple, Edit2, Trash2, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface TreeInventory {
  id: string;
  farm_id: string;
  tree_type: string;
  quantity: number;
  current_state: 'نمو' | 'إثمار' | 'راحة موسمية';
  planting_date: string | null;
  notes: string | null;
  created_at: string;
}

interface Farm {
  id: string;
  name_ar: string;
}

const TreesMapTab: React.FC = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [inventory, setInventory] = useState<TreeInventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    tree_type: '',
    quantity: 0,
    current_state: 'نمو' as TreeInventory['current_state'],
    planting_date: '',
    notes: '',
  });

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      loadInventory();
    }
  }, [selectedFarmId]);

  const loadFarms = async () => {
    const { data } = await supabase
      .from('farms')
      .select('id, name_ar')
      .order('name_ar');
    if (data) setFarms(data);
  };

  const loadInventory = async () => {
    if (!selectedFarmId) return;

    setLoading(true);
    const { data } = await supabase
      .from('agricultural_tree_inventory')
      .select('*')
      .eq('farm_id', selectedFarmId)
      .order('created_at', { ascending: false });

    if (data) setInventory(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId) return;

    const payload = {
      ...formData,
      farm_id: selectedFarmId,
      planting_date: formData.planting_date || null,
    };

    if (editingId) {
      await supabase
        .from('agricultural_tree_inventory')
        .update(payload)
        .eq('id', editingId);
    } else {
      await supabase
        .from('agricultural_tree_inventory')
        .insert([payload]);
    }

    resetForm();
    loadInventory();
  };

  const handleEdit = (item: TreeInventory) => {
    setEditingId(item.id);
    setFormData({
      tree_type: item.tree_type,
      quantity: item.quantity,
      current_state: item.current_state,
      planting_date: item.planting_date || '',
      notes: item.notes || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      await supabase
        .from('agricultural_tree_inventory')
        .delete()
        .eq('id', id);
      loadInventory();
    }
  };

  const resetForm = () => {
    setFormData({
      tree_type: '',
      quantity: 0,
      current_state: 'نمو',
      planting_date: '',
      notes: '',
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const getStateColor = (state: TreeInventory['current_state']) => {
    const colors = {
      'نمو': 'bg-green-100 text-green-700',
      'إثمار': 'bg-amber-100 text-amber-700',
      'راحة موسمية': 'bg-blue-100 text-blue-700',
    };
    return colors[state];
  };

  const getStateIcon = (state: TreeInventory['current_state']) => {
    const icons = {
      'نمو': Sprout,
      'إثمار': Apple,
      'راحة موسمية': TreePine,
    };
    return icons[state];
  };

  const filteredInventory = inventory.filter(item =>
    item.tree_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTrees = inventory.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-darkgreen">خريطة الأشجار</h2>
          <p className="text-gray-600 text-sm mt-1">عرض وإدارة مخزون الأشجار حسب النوع والحالة</p>
        </div>
        {selectedFarmId && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة أشجار</span>
          </button>
        )}
      </div>

      {/* Farm Selector */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">اختر المزرعة</label>
        <select
          value={selectedFarmId}
          onChange={(e) => setSelectedFarmId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">-- اختر مزرعة --</option>
          {farms.map((farm) => (
            <option key={farm.id} value={farm.id}>
              {farm.name_ar}
            </option>
          ))}
        </select>
      </div>

      {selectedFarmId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <p className="text-sm text-gray-600">في مرحلة النمو</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {inventory.filter(i => i.current_state === 'نمو').reduce((sum, i) => sum + i.quantity, 0)}
                  </p>
                </div>
                <Sprout className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">في مرحلة الإثمار</p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">
                    {inventory.filter(i => i.current_state === 'إثمار').reduce((sum, i) => sum + i.quantity, 0)}
                  </p>
                </div>
                <Apple className="w-10 h-10 text-amber-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">راحة موسمية</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {inventory.filter(i => i.current_state === 'راحة موسمية').reduce((sum, i) => sum + i.quantity, 0)}
                  </p>
                </div>
                <TreePine className="w-10 h-10 text-blue-600" />
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
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Inventory List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">جاري التحميل...</p>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <TreePine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد أشجار مسجلة بعد</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                إضافة أول شجرة
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.map((item) => {
                const StateIcon = getStateIcon(item.current_state);
                return (
                  <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <TreePine className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.tree_type}</h3>
                          <p className="text-2xl font-bold text-darkgreen">{item.quantity}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getStateColor(item.current_state)}`}>
                      <StateIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.current_state}</span>
                    </div>
                    {item.planting_date && (
                      <p className="text-xs text-gray-500 mt-2">
                        تاريخ الزراعة: {new Date(item.planting_date).toLocaleDateString('ar-SA')}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">{item.notes}</p>
                    )}
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
                {editingId ? 'تعديل الأشجار' : 'إضافة أشجار جديدة'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع الشجرة *</label>
                <input
                  type="text"
                  required
                  value={formData.tree_type}
                  onChange={(e) => setFormData({ ...formData, tree_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="مثال: زيتون، نخيل، رمان"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحالة الحالية *</label>
                <select
                  required
                  value={formData.current_state}
                  onChange={(e) => setFormData({ ...formData, current_state: e.target.value as TreeInventory['current_state'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="نمو">نمو</option>
                  <option value="إثمار">إثمار</option>
                  <option value="راحة موسمية">راحة موسمية</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الزراعة</label>
                <input
                  type="date"
                  value={formData.planting_date}
                  onChange={(e) => setFormData({ ...formData, planting_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات داخلية</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="أي ملاحظات أو تفاصيل إضافية..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
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

export default TreesMapTab;
