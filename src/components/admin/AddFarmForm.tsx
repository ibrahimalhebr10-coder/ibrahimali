import React, { useState } from 'react';
import { X, Plus, Trash2, Save, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TreeType {
  name: string;
  count: number;
}

interface AddFarmFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddFarmForm: React.FC<AddFarmFormProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [areaSize, setAreaSize] = useState('');
  const [internalCost, setInternalCost] = useState('');
  const [totalTrees, setTotalTrees] = useState('');
  const [comingSoonLabel, setComingSoonLabel] = useState('قريبًا');
  const [cardDescription, setCardDescription] = useState('');

  const [treeTypes, setTreeTypes] = useState<TreeType[]>([{ name: '', count: 0 }]);

  const [section1Expanded, setSection1Expanded] = useState(true);
  const [section2Expanded, setSection2Expanded] = useState(true);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const addTreeType = () => {
    setTreeTypes([...treeTypes, { name: '', count: 0 }]);
  };

  const removeTreeType = (index: number) => {
    if (treeTypes.length > 1) {
      setTreeTypes(treeTypes.filter((_, i) => i !== index));
    }
  };

  const updateTreeType = (index: number, field: 'name' | 'count', value: string | number) => {
    const updated = [...treeTypes];
    if (field === 'name') {
      updated[index].name = value as string;
    } else {
      updated[index].count = Number(value) || 0;
    }
    setTreeTypes(updated);
  };

  const calculateTreeSum = () => {
    return treeTypes.reduce((sum, tree) => sum + tree.count, 0);
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError('يرجى إدخال اسم المزرعة');
      return false;
    }

    if (!location.trim()) {
      setError('يرجى إدخال موقع المزرعة');
      return false;
    }

    const total = Number(totalTrees) || 0;
    if (total <= 0) {
      setError('يرجى إدخال إجمالي عدد الأشجار');
      return false;
    }

    const hasEmptyTreeType = treeTypes.some(t => !t.name.trim());
    if (hasEmptyTreeType) {
      setError('يرجى إدخال اسم لجميع أنواع الأشجار أو حذف الحقول الفارغة');
      return false;
    }

    const treeSum = calculateTreeSum();
    if (treeSum !== total) {
      setError(`مجموع أعداد الأشجار (${treeSum}) لا يساوي الإجمالي المدخل (${total})`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const treeTypesJson = treeTypes.map((tree, index) => ({
        name: tree.name,
        count: tree.count,
        order: index + 1
      }));

      const { data, error: insertError } = await supabase
        .from('farms')
        .insert([
          {
            name_ar: name,
            name_en: name,
            location: location,
            area_size: areaSize || null,
            internal_cost_per_tree: Number(internalCost) || 0,
            total_trees: Number(totalTrees),
            coming_soon_label: comingSoonLabel || 'قريبًا',
            card_description: cardDescription || null,
            tree_types: treeTypesJson,
            description_ar: cardDescription || name,
            image_url: 'https://images.pexels.com/photos/96715/pexels-photo-96715.jpeg',
            annual_return_rate: 0,
            min_investment: 1000,
            max_investment: 100000,
            total_capacity: Number(totalTrees),
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'active',
            is_open_for_booking: true,
            available_trees: Number(totalTrees),
            reserved_trees: 0
          }
        ])
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        setError('حدث خطأ أثناء إضافة المزرعة');
        setIsLoading(false);
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const treeSum = calculateTreeSum();
  const total = Number(totalTrees) || 0;
  const isTreeSumValid = total > 0 && treeSum === total;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-darkgreen to-green-700 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">إضافة مزرعة جديدة</h2>
            <p className="text-green-100 text-sm mt-1">المزرعة = خزان | التسعير من الباقات</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Section 1: معلومات المزرعة الأساسية */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setSection1Expanded(!section1Expanded)}
              className="w-full bg-gray-50 px-6 py-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-darkgreen text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-bold text-gray-900">معلومات المزرعة الأساسية</h3>
                  <p className="text-sm text-gray-600">بيانات البطاقة والهوية العامة</p>
                </div>
              </div>
              {section1Expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {section1Expanded && (
              <div className="p-6 space-y-5 bg-white">
                {/* اسم المزرعة */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    اسم المزرعة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-darkgreen text-right"
                    placeholder="مثال: مزرعة الخير"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">يظهر في بطاقة المزرعة وصفحتها</p>
                </div>

                {/* موقع المزرعة */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    موقع المزرعة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-darkgreen text-right"
                    placeholder="مثال: القصيم - بريدة"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">يظهر في بطاقة المزرعة وصفحتها</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* مساحة المزرعة */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      مساحة المزرعة (اختياري)
                    </label>
                    <input
                      type="text"
                      value={areaSize}
                      onChange={(e) => setAreaSize(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-darkgreen text-right"
                      placeholder="مثال: 5000 م² أو 5 هكتار"
                    />
                    <p className="text-xs text-gray-500 mt-1">إداري فقط - لا يظهر للمستخدم</p>
                  </div>

                  {/* السعر الداخلي */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      التكلفة الداخلية للشجرة (اختياري)
                    </label>
                    <input
                      type="number"
                      value={internalCost}
                      onChange={(e) => setInternalCost(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-darkgreen text-right"
                      placeholder="مثال: 500"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">للتحليل الداخلي فقط - لا يظهر للمستخدم</p>
                  </div>
                </div>

                {/* إجمالي عدد الأشجار */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    إجمالي عدد الأشجار <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={totalTrees}
                    onChange={(e) => setTotalTrees(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-darkgreen text-right"
                    placeholder="مثال: 1000"
                    min="1"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">يظهر في بطاقة المزرعة - سعة الخزان الكلية</p>
                </div>

                {/* عنوان إضافي "قريبًا" */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    عنوان إضافي (قريبًا)
                  </label>
                  <input
                    type="text"
                    value={comingSoonLabel}
                    onChange={(e) => setComingSoonLabel(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-darkgreen text-right"
                    placeholder="مثال: قريبًا | مرحلة جديدة | توسعة قادمة"
                  />
                  <p className="text-xs text-gray-500 mt-1">يظهر في بطاقة المزرعة - قابل للتعديل</p>
                </div>

                {/* وصف مختصر للبطاقة */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    وصف مختصر للبطاقة
                  </label>
                  <textarea
                    value={cardDescription}
                    onChange={(e) => setCardDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-darkgreen text-right resize-none"
                    placeholder="وصف مختصر يظهر أسفل البطاقة في الواجهة"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">يظهر أسفل بطاقة المزرعة في الواجهة</p>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: أنواع الأشجار */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setSection2Expanded(!section2Expanded)}
              className="w-full bg-gray-50 px-6 py-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-darkgreen text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-bold text-gray-900">أنواع الأشجار في المزرعة</h3>
                  <p className="text-sm text-gray-600">
                    {isTreeSumValid ? (
                      <span className="text-green-600">✓ المجموع صحيح ({treeSum} من {total})</span>
                    ) : (
                      <span className="text-amber-600">
                        المجموع: {treeSum} من {total}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {section2Expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {section2Expanded && (
              <div className="p-6 space-y-4 bg-white">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900">
                    <strong>ملاحظة مهمة:</strong> مجموع أعداد الأشجار هنا يجب أن يساوي إجمالي عدد الأشجار في القسم الأول
                  </p>
                </div>

                {treeTypes.map((tree, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            نوع الشجرة
                          </label>
                          <input
                            type="text"
                            value={tree.name}
                            onChange={(e) => updateTreeType(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-darkgreen text-right text-sm"
                            placeholder="مثال: نخيل - خلاص"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            عدد الأشجار
                          </label>
                          <input
                            type="number"
                            value={tree.count || ''}
                            onChange={(e) => updateTreeType(index, 'count', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-darkgreen text-right text-sm"
                            placeholder="مثال: 500"
                            min="0"
                          />
                        </div>
                      </div>
                      {treeTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTreeType(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-5"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addTreeType}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-darkgreen hover:text-darkgreen transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>إضافة نوع شجرة آخر</span>
                </button>

                {/* Summary */}
                <div className={`p-4 rounded-lg border-2 ${
                  isTreeSumValid
                    ? 'bg-green-50 border-green-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">مجموع الأشجار المدخل:</span>
                    <span className={`text-2xl font-bold ${
                      isTreeSumValid ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {treeSum} / {total}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-darkgreen text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جارٍ الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>حفظ المزرعة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFarmForm;
