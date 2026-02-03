import React, { useState, useEffect } from 'react';
import { Upload, Image, Video, Link2, Trash2, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Documentation {
  id: string;
  farm_id: string;
  media_type: 'صورة' | 'فيديو';
  media_url: string;
  linked_to_type: 'operation' | 'growth_stage';
  linked_to_id: string;
  caption: string | null;
  upload_date: string;
}

interface Farm {
  id: string;
  name_ar: string;
}

interface Operation {
  id: string;
  operation_type: string;
  operation_date: string;
}

interface GrowthStage {
  id: string;
  tree_type: string;
  current_stage: string;
}

const AgriculturalDocumentationTab: React.FC = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [documentation, setDocumentation] = useState<Documentation[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [growthStages, setGrowthStages] = useState<GrowthStage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    media_type: 'صورة' as Documentation['media_type'],
    media_url: '',
    linked_to_type: 'operation' as Documentation['linked_to_type'],
    linked_to_id: '',
    caption: '',
  });

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      loadDocumentation();
      loadOperations();
      loadGrowthStages();
    }
  }, [selectedFarmId]);

  const loadFarms = async () => {
    const { data } = await supabase
      .from('farms')
      .select('id, name_ar')
      .order('name_ar');
    if (data) setFarms(data);
  };

  const loadDocumentation = async () => {
    if (!selectedFarmId) return;

    setLoading(true);
    const { data } = await supabase
      .from('agricultural_documentation')
      .select('*')
      .eq('farm_id', selectedFarmId)
      .order('upload_date', { ascending: false });

    if (data) setDocumentation(data);
    setLoading(false);
  };

  const loadOperations = async () => {
    if (!selectedFarmId) return;

    const { data } = await supabase
      .from('agricultural_operations')
      .select('id, operation_type, operation_date')
      .eq('farm_id', selectedFarmId)
      .order('operation_date', { ascending: false });

    if (data) setOperations(data);
  };

  const loadGrowthStages = async () => {
    if (!selectedFarmId) return;

    const { data } = await supabase
      .from('agricultural_growth_stages')
      .select('id, tree_type, current_stage')
      .eq('farm_id', selectedFarmId);

    if (data) setGrowthStages(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId || !formData.linked_to_id) return;

    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      ...formData,
      farm_id: selectedFarmId,
      uploaded_by: user?.id,
    };

    await supabase
      .from('agricultural_documentation')
      .insert([payload]);

    resetForm();
    loadDocumentation();
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التوثيق؟')) {
      await supabase
        .from('agricultural_documentation')
        .delete()
        .eq('id', id);
      loadDocumentation();
    }
  };

  const resetForm = () => {
    setFormData({
      media_type: 'صورة',
      media_url: '',
      linked_to_type: 'operation',
      linked_to_id: '',
      caption: '',
    });
    setShowAddForm(false);
  };

  const filteredDocumentation = documentation.filter(doc =>
    doc.caption?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-darkgreen">التوثيق الزراعي</h2>
          <p className="text-gray-600 text-sm mt-1">رفع صور وفيديوهات مرتبطة بالعمليات والمراحل</p>
        </div>
        {selectedFarmId && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>رفع ملف</span>
          </button>
        )}
      </div>

      {/* Farm Selector */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">اختر المزرعة</label>
        <select
          value={selectedFarmId}
          onChange={(e) => setSelectedFarmId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">إجمالي الملفات</p>
              <p className="text-2xl font-bold text-darkgreen">{documentation.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Image className="w-4 h-4 text-amber-600" />
                <p className="text-xs text-gray-600">صور</p>
              </div>
              <p className="text-2xl font-bold text-amber-700">{documentation.filter(d => d.media_type === 'صورة').length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Video className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-gray-600">فيديوهات</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{documentation.filter(d => d.media_type === 'فيديو').length}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في التعليقات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Documentation List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">جاري التحميل...</p>
            </div>
          ) : filteredDocumentation.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا يوجد توثيق مرفوع</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                رفع أول ملف
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocumentation.map((doc) => (
                <div key={doc.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${doc.media_type === 'صورة' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                      {doc.media_type === 'صورة' ? (
                        <Image className={`w-6 h-6 ${doc.media_type === 'صورة' ? 'text-amber-600' : 'text-blue-600'}`} />
                      ) : (
                        <Video className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {doc.media_type}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        {doc.linked_to_type === 'operation' ? 'عملية زراعية' : 'مرحلة نمو'}
                      </span>
                    </div>
                    {doc.caption && (
                      <p className="text-sm text-gray-700">{doc.caption}</p>
                    )}
                    <a
                      href={doc.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Link2 className="w-4 h-4" />
                      <span>عرض الملف</span>
                    </a>
                    <p className="text-xs text-gray-500">
                      {new Date(doc.upload_date).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-darkgreen">رفع توثيق زراعي</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>مهم:</strong> جميع الملفات يجب أن تكون مرتبطة بعملية زراعية أو مرحلة نمو محددة
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع الملف *</label>
                <select
                  required
                  value={formData.media_type}
                  onChange={(e) => setFormData({ ...formData, media_type: e.target.value as Documentation['media_type'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="صورة">صورة</option>
                  <option value="فيديو">فيديو</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رابط الملف *</label>
                <input
                  type="url"
                  required
                  value={formData.media_url}
                  onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ربط بـ *</label>
                <select
                  required
                  value={formData.linked_to_type}
                  onChange={(e) => setFormData({ ...formData, linked_to_type: e.target.value as Documentation['linked_to_type'], linked_to_id: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="operation">عملية زراعية</option>
                  <option value="growth_stage">مرحلة نمو</option>
                </select>
              </div>

              {formData.linked_to_type === 'operation' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اختر العملية *</label>
                  <select
                    required
                    value={formData.linked_to_id}
                    onChange={(e) => setFormData({ ...formData, linked_to_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">-- اختر عملية --</option>
                    {operations.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.operation_type} - {new Date(op.operation_date).toLocaleDateString('ar-SA')}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اختر المرحلة *</label>
                  <select
                    required
                    value={formData.linked_to_id}
                    onChange={(e) => setFormData({ ...formData, linked_to_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">-- اختر مرحلة --</option>
                    {growthStages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.tree_type} - {stage.current_stage}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تعليق</label>
                <textarea
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="إضافة تعليق على الملف..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                >
                  رفع
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

export default AgriculturalDocumentationTab;
