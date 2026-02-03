import React, { useState, useEffect } from 'react';
import { Eye, Save, Image, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface ExperienceContent {
  id: string;
  farm_id: string;
  is_active: boolean;
  display_text: string;
  selected_photos: string[];
  status_message: string | null;
  last_updated: string;
}

interface Farm {
  id: string;
  name_ar: string;
}

const ExperienceBuilderTab: React.FC = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [content, setContent] = useState<ExperienceContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    is_active: true,
    display_text: '',
    selected_photos: [] as string[],
    status_message: '',
  });

  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      loadContent();
    }
  }, [selectedFarmId]);

  const loadFarms = async () => {
    const { data } = await supabase
      .from('farms')
      .select('id, name_ar')
      .order('name_ar');
    if (data) setFarms(data);
  };

  const loadContent = async () => {
    if (!selectedFarmId) return;

    setLoading(true);
    const { data } = await supabase
      .from('agricultural_experience_content')
      .select('*')
      .eq('farm_id', selectedFarmId)
      .maybeSingle();

    if (data) {
      setContent(data);
      setFormData({
        is_active: data.is_active,
        display_text: data.display_text,
        selected_photos: data.selected_photos || [],
        status_message: data.status_message || '',
      });
    } else {
      setContent(null);
      setFormData({
        is_active: true,
        display_text: '',
        selected_photos: [],
        status_message: '',
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!selectedFarmId) return;

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      ...formData,
      farm_id: selectedFarmId,
      updated_by: user?.id,
      last_updated: new Date().toISOString(),
    };

    if (content) {
      await supabase
        .from('agricultural_experience_content')
        .update(payload)
        .eq('id', content.id);
    } else {
      await supabase
        .from('agricultural_experience_content')
        .insert([payload]);
    }

    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    loadContent();
  };

  const handleAddPhoto = () => {
    if (newPhotoUrl.trim()) {
      setFormData({
        ...formData,
        selected_photos: [...formData.selected_photos, newPhotoUrl.trim()],
      });
      setNewPhotoUrl('');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormData({
      ...formData,
      selected_photos: formData.selected_photos.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-darkgreen">Experience Builder - زراعي</h2>
          <p className="text-gray-600 text-sm mt-1">تحديد المحتوى الذي سيراه المزارع في الواجهة</p>
        </div>
        {selectedFarmId && (
          <button
            onClick={handleSave}
            disabled={saving || !formData.display_text.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : saveSuccess ? (
              <Check className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>{saving ? 'جاري الحفظ...' : saveSuccess ? 'تم الحفظ!' : 'حفظ التغييرات'}</span>
          </button>
        )}
      </div>

      {/* Farm Selector */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-4 border border-violet-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">اختر المزرعة</label>
        <select
          value={selectedFarmId}
          onChange={(e) => setSelectedFarmId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
          {/* Important Notice */}
          <div className="bg-violet-50 border-2 border-violet-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-violet-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-violet-900 mb-1">هام جداً</h3>
                <p className="text-sm text-violet-800 leading-relaxed">
                  هذا التبويب هو <strong>المصدر الوحيد</strong> لما سيظهر في زر "مزرعتي الزراعي" في واجهة المستخدم.
                  يجب أن يكون المحتوى واضحاً ومحدثاً باستمرار.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">جاري التحميل...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Editor Panel */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">تحرير المحتوى</h3>

                  {/* Active Toggle */}
                  <div className="mb-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-5 h-5 text-violet-600 rounded focus:ring-2 focus:ring-violet-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">تفعيل المحتوى</span>
                        <p className="text-xs text-gray-600">سيظهر للمزارع في الواجهة</p>
                      </div>
                    </label>
                  </div>

                  {/* Display Text */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      النص الذي سيظهر للمزارع *
                    </label>
                    <textarea
                      required
                      value={formData.display_text}
                      onChange={(e) => setFormData({ ...formData, display_text: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="اكتب النص الذي سيراه المزارع عن حالة مزرعته..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.display_text.length} حرف
                    </p>
                  </div>

                  {/* Status Message */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رسالة الحالة (أسبوعية/شهرية)
                    </label>
                    <textarea
                      value={formData.status_message}
                      onChange={(e) => setFormData({ ...formData, status_message: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="رسالة حالة دورية تُحدّث المزارع عن آخر التطورات..."
                    />
                  </div>

                  {/* Photos Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الصور المختارة للعرض
                    </label>
                    <div className="space-y-3">
                      {/* Add Photo */}
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newPhotoUrl}
                          onChange={(e) => setNewPhotoUrl(e.target.value)}
                          placeholder="رابط الصورة..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={handleAddPhoto}
                          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                        >
                          إضافة
                        </button>
                      </div>

                      {/* Photos List */}
                      {formData.selected_photos.length > 0 ? (
                        <div className="space-y-2">
                          {formData.selected_photos.map((photo, index) => (
                            <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                              <Image className="w-5 h-5 text-gray-400 flex-shrink-0" />
                              <span className="flex-1 text-sm text-gray-700 truncate">{photo}</span>
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(index)}
                                className="text-red-600 hover:bg-red-50 p-1 rounded"
                              >
                                حذف
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                          لم يتم اختيار صور بعد
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm sticky top-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-5 h-5 text-violet-600" />
                    <h3 className="text-lg font-bold text-gray-900">معاينة</h3>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        formData.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {formData.is_active ? 'مفعّل' : 'غير مفعّل'}
                      </span>
                    </div>

                    {/* Display Text */}
                    {formData.display_text ? (
                      <div className="mb-4">
                        <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                          {formData.display_text}
                        </p>
                      </div>
                    ) : (
                      <div className="mb-4 text-center py-8">
                        <p className="text-gray-400">النص سيظهر هنا</p>
                      </div>
                    )}

                    {/* Status Message */}
                    {formData.status_message && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium text-blue-800 mb-1">آخر تحديث:</p>
                        <p className="text-sm text-blue-900">{formData.status_message}</p>
                      </div>
                    )}

                    {/* Photos Grid */}
                    {formData.selected_photos.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {formData.selected_photos.map((photo, index) => (
                          <div key={index} className="bg-gray-200 rounded-lg h-24 flex items-center justify-center">
                            <Image className="w-8 h-8 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Empty State */}
                    {!formData.display_text && formData.selected_photos.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-400 text-sm">قم بملء البيانات لرؤية المعاينة</p>
                      </div>
                    )}
                  </div>

                  {/* Last Updated */}
                  {content && (
                    <div className="mt-4 text-xs text-gray-500 text-center">
                      آخر تحديث: {new Date(content.last_updated).toLocaleString('ar-SA')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Helper Tips */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">نصائح لبناء تجربة مميزة:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-violet-600 font-bold">•</span>
                <span>استخدم لغة واضحة وودية تناسب المزارع</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-600 font-bold">•</span>
                <span>حدّث رسالة الحالة بشكل دوري (أسبوعياً أو شهرياً)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-600 font-bold">•</span>
                <span>اختر صوراً عالية الجودة توضح الحالة الفعلية للمزرعة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-600 font-bold">•</span>
                <span>تجنب الوعود المحددة بأرقام إنتاج دقيقة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-600 font-bold">•</span>
                <span>ركز على الشفافية والمصداقية في المعلومات</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default ExperienceBuilderTab;
