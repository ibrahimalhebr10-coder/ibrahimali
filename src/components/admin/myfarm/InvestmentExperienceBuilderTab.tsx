import React, { useState, useEffect } from 'react';
import { Eye, Save, Image, AlertCircle, Check, TrendingUp } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface InvestmentExperienceContent {
  id: string;
  user_id: string;
  is_active: boolean;
  display_text: string;
  selected_photos: string[];
  status_message: string | null;
  growth_metrics: {
    total_trees?: number;
    total_value?: number;
    growth_percentage?: number;
  };
  last_updated: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

const InvestmentExperienceBuilderTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [content, setContent] = useState<InvestmentExperienceContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    is_active: true,
    display_text: '',
    selected_photos: [] as string[],
    status_message: '',
    growth_metrics: {
      total_trees: 0,
      total_value: 0,
      growth_percentage: 0,
    },
  });

  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadContent();
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .order('full_name');
    if (data) setUsers(data);
  };

  const loadContent = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    const { data } = await supabase
      .from('investment_experience_content')
      .select('*')
      .eq('user_id', selectedUserId)
      .maybeSingle();

    if (data) {
      setContent(data);
      setFormData({
        is_active: data.is_active,
        display_text: data.display_text,
        selected_photos: data.selected_photos || [],
        status_message: data.status_message || '',
        growth_metrics: data.growth_metrics || { total_trees: 0, total_value: 0, growth_percentage: 0 },
      });
    } else {
      setContent(null);
      setFormData({
        is_active: true,
        display_text: '',
        selected_photos: [],
        status_message: '',
        growth_metrics: { total_trees: 0, total_value: 0, growth_percentage: 0 },
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!selectedUserId) return;

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      ...formData,
      user_id: selectedUserId,
      updated_by: user?.id,
      last_updated: new Date().toISOString(),
    };

    if (content) {
      await supabase
        .from('investment_experience_content')
        .update(payload)
        .eq('id', content.id);
    } else {
      await supabase
        .from('investment_experience_content')
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

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-darkgreen">Experience Builder - استثماري</h2>
          <p className="text-gray-600 text-sm mt-1">تحديد المحتوى الذي سيراه المستثمر في الواجهة</p>
        </div>
        {selectedUserId && (
          <button
            onClick={handleSave}
            disabled={saving || !formData.display_text.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          {/* Important Notice */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">هام جداً - فصل كامل</h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  هذا التبويب هو <strong>المصدر الوحيد</strong> لما سيظهر في زر "مزرعتي الاستثماري" في واجهة المستخدم.
                  منفصل تماماً عن المسار الزراعي. استخدم لغة أصول ونمو وتوسعة فقط.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">تفعيل المحتوى</span>
                        <p className="text-xs text-gray-600">سيظهر للمستثمر في الواجهة</p>
                      </div>
                    </label>
                  </div>

                  {/* Display Text */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      النص الذي سيظهر للمستثمر *
                    </label>
                    <textarea
                      required
                      value={formData.display_text}
                      onChange={(e) => setFormData({ ...formData, display_text: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="استخدم لغة أصول ونمو وتوسعة... مثال: أصولك الاستثمارية تنمو بشكل ممتاز، لديك فرص توسعة جديدة..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.display_text.length} حرف - استخدم لغة استثمارية فقط
                    </p>
                  </div>

                  {/* Growth Metrics */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      مقاييس النمو
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">إجمالي الأشجار</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.growth_metrics.total_trees || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            growth_metrics: {
                              ...formData.growth_metrics,
                              total_trees: parseInt(e.target.value) || 0,
                            },
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">القيمة الإجمالية (SAR)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.growth_metrics.total_value || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            growth_metrics: {
                              ...formData.growth_metrics,
                              total_value: parseFloat(e.target.value) || 0,
                            },
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">نسبة النمو (%)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.growth_metrics.growth_percentage || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            growth_metrics: {
                              ...formData.growth_metrics,
                              growth_percentage: parseFloat(e.target.value) || 0,
                            },
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رسالة الحالة (دورية)
                    </label>
                    <textarea
                      value={formData.status_message}
                      onChange={(e) => setFormData({ ...formData, status_message: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="رسالة تحديث دورية عن حالة الاستثمار..."
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
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={handleAddPhoto}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                    <Eye className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">معاينة المستثمر</h3>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-sky-50">
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

                    {/* Growth Metrics */}
                    {(formData.growth_metrics.total_trees > 0 || formData.growth_metrics.total_value > 0) && (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-white/70 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-600 mb-1">الأشجار</p>
                          <p className="text-lg font-bold text-darkgreen">{formData.growth_metrics.total_trees}</p>
                        </div>
                        <div className="bg-white/70 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-600 mb-1">القيمة</p>
                          <p className="text-lg font-bold text-blue-700">{formData.growth_metrics.total_value?.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/70 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-600 mb-1">النمو</p>
                          <p className="text-lg font-bold text-green-700 flex items-center justify-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {formData.growth_metrics.growth_percentage}%
                          </p>
                        </div>
                      </div>
                    )}

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
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium text-amber-800 mb-1">آخر تحديث:</p>
                        <p className="text-sm text-amber-900">{formData.status_message}</p>
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
            <h3 className="font-semibold text-gray-900 mb-3">نصائح لبناء تجربة استثمارية مميزة:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>استخدم لغة أصول ونمو وتوسعة - ليس زراعة وحصاد</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>ركز على الأرقام والمقاييس (عدد الأشجار، القيمة، النمو%)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>أظهر فرص التوسعة المتاحة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>حدّث رسالة الحالة بانتظام</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>هذا المحتوى منفصل تماماً عن المسار الزراعي</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default InvestmentExperienceBuilderTab;
