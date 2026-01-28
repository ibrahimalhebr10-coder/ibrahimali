import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, Save, X, Tag, Lock } from 'lucide-react';
import { messageTemplatesService, MessageTemplate } from '../../services/messageTemplatesService';

export default function MessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: 'general'
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await messageTemplatesService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category
    });
    setIsCreating(false);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingTemplate(null);
    setFormData({
      name: '',
      content: '',
      category: 'general'
    });
  };

  const handleSave = async () => {
    try {
      const extractedVariables = messageTemplatesService.extractVariables(formData.content);

      if (editingTemplate && !editingTemplate.is_system) {
        await messageTemplatesService.updateTemplate(editingTemplate.id, {
          ...formData,
          variables: extractedVariables
        });
      } else if (isCreating) {
        await messageTemplatesService.createTemplate({
          ...formData,
          variables: extractedVariables,
          is_system: false
        });
      }

      await loadTemplates();
      handleCancel();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('حدث خطأ أثناء حفظ القالب');
    }
  };

  const handleDelete = async (template: MessageTemplate) => {
    if (template.is_system) {
      alert('لا يمكن حذف قوالب النظام الافتراضية');
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف القالب "${template.name}"؟`)) {
      return;
    }

    try {
      await messageTemplatesService.deleteTemplate(template.id);
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('حدث خطأ أثناء حذف القالب');
    }
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setIsCreating(false);
    setFormData({
      name: '',
      content: '',
      category: 'general'
    });
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      payment: 'سداد',
      reservation: 'حجوزات',
      general: 'عام',
      notification: 'إشعارات'
    };
    return categories[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      payment: 'bg-green-100 text-green-800',
      reservation: 'bg-blue-100 text-blue-800',
      general: 'bg-gray-100 text-gray-800',
      notification: 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">قوالب الرسائل</h2>
          <p className="text-gray-600 mt-1">إنشاء وإدارة قوالب الرسائل مع المتغيرات الديناميكية</p>
        </div>
        {!isCreating && !editingTemplate && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            قالب جديد
          </button>
        )}
      </div>

      {(isCreating || editingTemplate) && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {isCreating ? 'إنشاء قالب جديد' : 'تعديل القالب'}
            </h3>
            {editingTemplate?.is_system && (
              <span className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">
                <Lock className="w-4 h-4" />
                قالب نظام (يمكن التعديل فقط)
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم القالب
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="مثال: فتح سداد"
                disabled={editingTemplate?.is_system}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التصنيف
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={editingTemplate?.is_system}
              >
                <option value="general">عام</option>
                <option value="payment">سداد</option>
                <option value="reservation">حجوزات</option>
                <option value="notification">إشعارات</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نص الرسالة
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                placeholder="اكتب نص الرسالة هنا... استخدم {{اسم_المتغير}} للمتغيرات الديناميكية"
              />
              <p className="text-sm text-gray-500 mt-2">
                💡 استخدم المتغيرات مثل: {{اسم_المستثمر}}، {{اسم_المزرعة}}، {{رقم_الحجز}}، {{المبلغ}}
              </p>
            </div>

            {formData.content && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">المتغيرات المكتشفة:</h4>
                <div className="flex flex-wrap gap-2">
                  {messageTemplatesService.extractVariables(formData.content).map((variable) => (
                    <span
                      key={variable}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      <Tag className="w-3 h-3" />
                      {variable}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={!formData.name || !formData.content}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                حفظ القالب
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                    {template.is_system && (
                      <Lock className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                    {getCategoryLabel(template.category)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="تعديل"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                {!template.is_system && (
                  <button
                    onClick={() => handleDelete(template)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {template.content.length > 200
                  ? template.content.substring(0, 200) + '...'
                  : template.content}
              </p>
            </div>

            {template.variables.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">المتغيرات المتاحة:</h4>
                <div className="flex flex-wrap gap-2">
                  {template.variables.map((variable) => (
                    <span
                      key={variable}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                    >
                      <Tag className="w-3 h-3" />
                      {variable}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {templates.length === 0 && !isCreating && !editingTemplate && (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد قوالب</h3>
          <p className="text-gray-600 mb-4">ابدأ بإنشاء قالب رسالة جديد</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            إنشاء قالب
          </button>
        </div>
      )}
    </div>
  );
}
