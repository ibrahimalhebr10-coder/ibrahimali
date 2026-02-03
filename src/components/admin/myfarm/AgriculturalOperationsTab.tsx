import React, { useState, useEffect } from 'react';
import { Plus, Droplets, Scissors, Leaf, Bug, Calendar, FileText, Image, Edit2, Trash2, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Operation {
  id: string;
  farm_id: string;
  operation_type: 'ري' | 'تقليم' | 'تسميد' | 'مكافحة آفات';
  operation_date: string;
  description: string;
  internal_notes: string | null;
  photos: string[];
  created_at: string;
}

interface Farm {
  id: string;
  name: string;
}

const AgriculturalOperationsTab: React.FC = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const [formData, setFormData] = useState({
    operation_type: 'ري' as Operation['operation_type'],
    operation_date: new Date().toISOString().split('T')[0],
    description: '',
    internal_notes: '',
  });

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      loadOperations();
    }
  }, [selectedFarmId]);

  const loadFarms = async () => {
    const { data } = await supabase
      .from('farms')
      .select('id, name')
      .order('name');
    if (data) setFarms(data);
  };

  const loadOperations = async () => {
    if (!selectedFarmId) return;

    setLoading(true);
    const { data } = await supabase
      .from('agricultural_operations')
      .select('*')
      .eq('farm_id', selectedFarmId)
      .order('operation_date', { ascending: false });

    if (data) setOperations(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId) return;

    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      ...formData,
      farm_id: selectedFarmId,
      performed_by: user?.id,
      photos: [],
    };

    if (editingId) {
      await supabase
        .from('agricultural_operations')
        .update(payload)
        .eq('id', editingId);
    } else {
      await supabase
        .from('agricultural_operations')
        .insert([payload]);
    }

    resetForm();
    loadOperations();
  };

  const handleEdit = (operation: Operation) => {
    setEditingId(operation.id);
    setFormData({
      operation_type: operation.operation_type,
      operation_date: operation.operation_date,
      description: operation.description,
      internal_notes: operation.internal_notes || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه العملية؟')) {
      await supabase
        .from('agricultural_operations')
        .delete()
        .eq('id', id);
      loadOperations();
    }
  };

  const resetForm = () => {
    setFormData({
      operation_type: 'ري',
      operation_date: new Date().toISOString().split('T')[0],
      description: '',
      internal_notes: '',
    });
    setEditingId(null);
    setShowAddForm(false);
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
    const matchesSearch = op.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         op.internal_notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || op.operation_type === filterType;
    return matchesSearch && matchesType;
  });

  const operationStats = {
    total: operations.length,
    'ري': operations.filter(o => o.operation_type === 'ري').length,
    'تقليم': operations.filter(o => o.operation_type === 'تقليم').length,
    'تسميد': operations.filter(o => o.operation_type === 'تسميد').length,
    'مكافحة آفات': operations.filter(o => o.operation_type === 'مكافحة آفات').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-darkgreen">العمليات الزراعية</h2>
          <p className="text-gray-600 text-sm mt-1">سجل وتوثيق جميع العمليات الزراعية</p>
        </div>
        {selectedFarmId && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة عملية</span>
          </button>
        )}
      </div>

      {/* Farm Selector */}
      <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg p-4 border border-blue-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">اختر المزرعة</label>
        <select
          value={selectedFarmId}
          onChange={(e) => setSelectedFarmId(e.target.value)}
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

      {selectedFarmId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">إجمالي العمليات</p>
              <p className="text-2xl font-bold text-darkgreen">{operationStats.total}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-gray-600">ري</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{operationStats['ري']}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Scissors className="w-4 h-4 text-amber-600" />
                <p className="text-xs text-gray-600">تقليم</p>
              </div>
              <p className="text-2xl font-bold text-amber-700">{operationStats['تقليم']}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Leaf className="w-4 h-4 text-green-600" />
                <p className="text-xs text-gray-600">تسميد</p>
              </div>
              <p className="text-2xl font-bold text-green-700">{operationStats['تسميد']}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Bug className="w-4 h-4 text-red-600" />
                <p className="text-xs text-gray-600">مكافحة آفات</p>
              </div>
              <p className="text-2xl font-bold text-red-700">{operationStats['مكافحة آفات']}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="البحث في الوصف أو الملاحظات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الأنواع</option>
              <option value="ري">ري</option>
              <option value="تقليم">تقليم</option>
              <option value="تسميد">تسميد</option>
              <option value="مكافحة آفات">مكافحة آفات</option>
            </select>
          </div>

          {/* Operations List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">جاري التحميل...</p>
            </div>
          ) : filteredOperations.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <Droplets className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد عمليات زراعية مسجلة</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                إضافة أول عملية
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOperations.map((operation) => {
                const OperationIcon = getOperationIcon(operation.operation_type);
                return (
                  <div key={operation.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getOperationColor(operation.operation_type)}`}>
                          <OperationIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{operation.operation_type}</h3>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(operation.operation_date).toLocaleDateString('ar-SA')}</span>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-2">{operation.description}</p>
                          {operation.internal_notes && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                              <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 text-amber-600 mt-0.5" />
                                <div>
                                  <p className="text-xs font-medium text-amber-800 mb-1">ملاحظات داخلية:</p>
                                  <p className="text-sm text-amber-900">{operation.internal_notes}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          {operation.photos && operation.photos.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Image className="w-4 h-4" />
                              <span>{operation.photos.length} صورة مرفقة</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(operation)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(operation.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                {editingId ? 'تعديل العملية' : 'إضافة عملية زراعية'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع العملية *</label>
                <select
                  required
                  value={formData.operation_type}
                  onChange={(e) => setFormData({ ...formData, operation_type: e.target.value as Operation['operation_type'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ري">ري</option>
                  <option value="تقليم">تقليم</option>
                  <option value="تسميد">تسميد</option>
                  <option value="مكافحة آفات">مكافحة آفات</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ العملية *</label>
                <input
                  type="date"
                  required
                  value={formData.operation_date}
                  onChange={(e) => setFormData({ ...formData, operation_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">وصف العملية *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="اكتب وصف تفصيلي للعملية..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات داخلية</label>
                <textarea
                  value={formData.internal_notes}
                  onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ملاحظات للاستخدام الداخلي فقط..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>ملاحظة:</strong> يمكنك إضافة صور لهذه العملية من تبويب "التوثيق الزراعي" بعد الحفظ
                </p>
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

export default AgriculturalOperationsTab;
