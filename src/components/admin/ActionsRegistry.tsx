import { useState, useEffect } from 'react';
import { Shield, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { permissionsService } from '../../services/permissionsService';

interface ActionCategory {
  id: string;
  category_key: string;
  category_name_ar: string;
  category_name_en: string;
  description_ar: string;
  description_en: string;
  icon: string;
  display_order: number;
}

interface Action {
  id: string;
  category_id: string;
  action_key: string;
  action_name_ar: string;
  action_name_en: string;
  description_ar: string;
  description_en: string;
  scope_level: string;
  is_dangerous: boolean;
  requires_approval: boolean;
  display_order: number;
}

export default function ActionsRegistry() {
  const [categories, setCategories] = useState<ActionCategory[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [categoriesData, actionsData] = await Promise.all([
        permissionsService.getAllActionCategories(),
        permissionsService.getAllActions()
      ]);
      setCategories(categoriesData);
      setActions(actionsData);
    } catch (error) {
      console.error('Error loading actions registry:', error);
    } finally {
      setLoading(false);
    }
  }

  function getActionsForCategory(categoryId: string): Action[] {
    return actions.filter(a => a.category_id === categoryId);
  }

  function getScopeLevelBadge(scopeLevel: string) {
    const badges = {
      system: { label: 'نظام', color: 'bg-purple-100 text-purple-700' },
      farm: { label: 'مزرعة', color: 'bg-blue-100 text-blue-700' },
      task: { label: 'مهمة', color: 'bg-green-100 text-green-700' },
      own: { label: 'ذاتي', color: 'bg-gray-100 text-gray-700' }
    };
    const badge = badges[scopeLevel as keyof typeof badges] || badges.farm;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8" />
          <h2 className="text-2xl font-bold">سجل الصلاحيات المركزي</h2>
        </div>
        <p className="text-green-100">
          جميع الصلاحيات المتاحة في النظام مقسمة حسب المجموعات. هذا السجل للعرض فقط، لم يتم ربط الصلاحيات بالأدوار بعد.
        </p>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-900 font-semibold mb-1">المرحلة الثالثة: تعريف الصلاحيات</p>
          <p className="text-blue-800 text-sm">
            تم تعريف {actions.length} صلاحية موزعة على {categories.length} مجموعات. الربط بالأدوار سيكون في المراحل القادمة.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {categories.map((category) => {
          const categoryActions = getActionsForCategory(category.id);
          const isExpanded = expandedCategory === category.id;

          return (
            <div
              key={category.id}
              className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden transition-all"
            >
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-bold text-gray-900">
                      {category.category_name_ar}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {category.description_ar}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">
                        {categoryActions.length} صلاحية
                      </span>
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-6 h-6 text-gray-400" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t-2 border-gray-100 bg-gray-50">
                  <div className="p-5 space-y-3">
                    {categoryActions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        لا توجد صلاحيات في هذه المجموعة
                      </div>
                    ) : (
                      categoryActions.map((action) => (
                        <div
                          key={action.id}
                          className="bg-white rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900">
                                  {action.action_name_ar}
                                </h4>
                                {action.is_dangerous && (
                                  <AlertTriangle className="w-4 h-4 text-red-500" />
                                )}
                                {action.requires_approval && (
                                  <CheckCircle className="w-4 h-4 text-amber-500" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {action.description_ar}
                              </p>
                              <p className="text-xs text-gray-400 mt-1 font-mono">
                                {action.action_key}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {getScopeLevelBadge(action.scope_level)}

                            {action.is_dangerous && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                عملية حرجة
                              </span>
                            )}

                            {action.requires_approval && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                تتطلب موافقة
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
        <h3 className="font-bold text-gray-900 mb-3">مستويات النطاق (Scope Levels)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              نظام
            </span>
            <span className="text-sm text-gray-600">النظام بالكامل</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              مزرعة
            </span>
            <span className="text-sm text-gray-600">مزرعة محددة</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              مهمة
            </span>
            <span className="text-sm text-gray-600">مهمة محددة</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              ذاتي
            </span>
            <span className="text-sm text-gray-600">بيانات المستخدم فقط</span>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          إشارات مهمة
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-gray-700">
              <span className="font-semibold">عملية حرجة:</span> صلاحية خطيرة قد تؤثر على بيانات حساسة
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-amber-500" />
            <span className="text-gray-700">
              <span className="font-semibold">تتطلب موافقة:</span> تحتاج موافقة من مشرف أعلى قبل التنفيذ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
