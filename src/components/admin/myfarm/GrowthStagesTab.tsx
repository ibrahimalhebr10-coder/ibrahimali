import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Sprout, Edit2, Trash2, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface GrowthStage {
  id: string;
  farm_id: string;
  tree_type: string;
  current_stage: string;
  stage_description: string | null;
  estimated_timeframe: string | null;
  stage_start_date: string | null;
  stage_end_date: string | null;
  notes: string | null;
  created_at: string;
}

interface Farm {
  id: string;
  name_ar: string;
}

const GrowthStagesTab: React.FC = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [stages, setStages] = useState<GrowthStage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    tree_type: '',
    current_stage: '',
    stage_description: '',
    estimated_timeframe: '',
    stage_start_date: '',
    stage_end_date: '',
    notes: '',
  });

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      loadStages();
    }
  }, [selectedFarmId]);

  const loadFarms = async () => {
    const { data } = await supabase
      .from('farms')
      .select('id, name_ar')
      .order('name_ar');
    if (data) setFarms(data);
  };

  const loadStages = async () => {
    if (!selectedFarmId) return;

    setLoading(true);
    const { data } = await supabase
      .from('agricultural_growth_stages')
      .select('*')
      .eq('farm_id', selectedFarmId)
      .order('created_at', { ascending: false });

    if (data) setStages(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId) return;

    const payload = {
      ...formData,
      farm_id: selectedFarmId,
      stage_start_date: formData.stage_start_date || null,
      stage_end_date: formData.stage_end_date || null,
    };

    if (editingId) {
      await supabase
        .from('agricultural_growth_stages')
        .update(payload)
        .eq('id', editingId);
    } else {
      await supabase
        .from('agricultural_growth_stages')
        .insert([payload]);
    }

    resetForm();
    loadStages();
  };

  const handleEdit = (stage: GrowthStage) => {
    setEditingId(stage.id);
    setFormData({
      tree_type: stage.tree_type,
      current_stage: stage.current_stage,
      stage_description: stage.stage_description || '',
      estimated_timeframe: stage.estimated_timeframe || '',
      stage_start_date: stage.stage_start_date || '',
      stage_end_date: stage.stage_end_date || '',
      notes: stage.notes || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المرحلة؟')) {
      await supabase
        .from('agricultural_growth_stages')
        .delete()
        .eq('id', id);
      loadStages();
    }
  };

  const resetForm = () => {
    setFormData({
      tree_type: '',
      current_stage: '',
      stage_description: '',
      estimated_timeframe: '',
      stage_start_date: '',
      stage_end_date: '',
      notes: '',
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const filteredStages = stages.filter(stage =>
    stage.tree_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stage.current_stage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-darkgreen">مراحل النمو والمحصول</h2>
          <p className="text-gray-600 text-sm mt-1">تحديد المرحلة الحالية والنوافذ الزمنية التقديرية</p>
        </div>
        {selectedFarmId && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة مرحلة</span>
          </button>
        )}
      </div>

      {/* Farm Selector */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">اختر المزرعة</label>
        <select
          value={selectedFarmId}
          onChange={(e) => setSelectedFarmId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">إجمالي المراحل</p>
              <p className="text-2xl font-bold text-darkgreen">{stages.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">أنواع الأشجار</p>
              <p className="text-2xl font-bold text-emerald-700">{new Set(stages.map(s => s.tree_type)).size}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">مراحل نشطة</p>
              <p className="text-2xl font-bold text-green-700">
                {stages.filter(s => s.stage_start_date && !s.stage_end_date).length}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث عن نوع شجرة أو مرحلة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Stages List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">جاري التحميل...</p>
            </div>
          ) : filteredStages.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <Sprout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد مراحل نمو مسجلة</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                إضافة أول مرحلة
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStages.map((stage) => (
                <div key={stage.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Sprout className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{stage.tree_type}</h3>
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                            {stage.current_stage}
                          </span>
                        </div>
                        {stage.stage_description && (
                          <p className="text-gray-700 mb-3">{stage.stage_description}</p>
                        )}
                        {stage.estimated_timeframe && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <div className="flex items-start gap-2">
                              <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-blue-800 mb-1">النافذة الزمنية التقديرية:</p>
                                <p className="text-sm text-blue-900">{stage.estimated_timeframe}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {stage.stage_start_date && (
                            <div>
                              <p className="text-gray-600 mb-1">بداية المرحلة</p>
                              <p className="font-semibold text-gray-900">
                                {new Date(stage.stage_start_date).toLocaleDateString('ar-SA')}
                              </p>
                            </div>
                          )}
                          {stage.stage_end_date && (
                            <div>
                              <p className="text-gray-600 mb-1">نهاية المرحلة المتوقعة</p>
                              <p className="font-semibold text-gray-900">
                                {new Date(stage.stage_end_date).toLocaleDateString('ar-SA')}
                              </p>
                            </div>
                          )}
                        </div>
                        {stage.notes && (
                          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-sm text-gray-700">{stage.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(stage)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(stage.id)}
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
                {editingId ? 'تعديل المرحلة' : 'إضافة مرحلة نمو'}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="مثال: زيتون، نخيل"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المرحلة الحالية *</label>
                <input
                  type="text"
                  required
                  value={formData.current_stage}
                  onChange={(e) => setFormData({ ...formData, current_stage: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="مثال: مرحلة الإزهار، مرحلة النضج"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">وصف المرحلة</label>
                <textarea
                  value={formData.stage_description}
                  onChange={(e) => setFormData({ ...formData, stage_description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="وصف تفصيلي للمرحلة..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">النافذة الزمنية التقديرية</label>
                <input
                  type="text"
                  value={formData.estimated_timeframe}
                  onChange={(e) => setFormData({ ...formData, estimated_timeframe: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="مثال: من 2-3 أشهر، خلال الربيع"
                />
                <p className="text-xs text-gray-500 mt-1">بدون أرقام دقيقة - نافذة زمنية تقديرية فقط</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">بداية المرحلة</label>
                  <input
                    type="date"
                    value={formData.stage_start_date}
                    onChange={(e) => setFormData({ ...formData, stage_start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نهاية المرحلة المتوقعة</label>
                  <input
                    type="date"
                    value={formData.stage_end_date}
                    onChange={(e) => setFormData({ ...formData, stage_end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
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

export default GrowthStagesTab;
