import { useState, useEffect } from 'react';
import { Shield, ChevronDown, ChevronUp, Check, X, AlertTriangle, Info } from 'lucide-react';
import { permissionsService } from '../../services/permissionsService';

interface Role {
  id: string;
  role_key: string;
  role_name_ar: string;
  role_name_en: string;
}

interface Action {
  action_id: string;
  action_key: string;
  action_name_ar: string;
  description_ar: string;
  scope_level: string;
  is_dangerous: boolean;
  requires_approval: boolean;
  category_key: string;
  category_name_ar: string;
  is_enabled: boolean;
}

export default function RoleActionsMapping() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleActions, setRoleActions] = useState<Action[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      loadRoleActions();
    }
  }, [selectedRole]);

  async function loadRoles() {
    setLoading(true);
    try {
      const rolesData = await permissionsService.getAllRoles();
      setRoles(rolesData);
      if (rolesData.length > 0) {
        setSelectedRole(rolesData[0]);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadRoleActions() {
    if (!selectedRole) return;

    try {
      const actions = await permissionsService.getRoleActions(selectedRole.id);
      setRoleActions(actions);
    } catch (error) {
      console.error('Error loading role actions:', error);
    }
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

  const actionsByCategory = roleActions.reduce((acc, action) => {
    if (!acc[action.category_key]) {
      acc[action.category_key] = {
        name: action.category_name_ar,
        actions: []
      };
    }
    acc[action.category_key].actions.push(action);
    return acc;
  }, {} as Record<string, { name: string; actions: Action[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8" />
          <h2 className="text-2xl font-bold">ربط الأدوار بالصلاحيات</h2>
        </div>
        <p className="text-blue-100">
          عرض الصلاحيات المعينة لكل دور في النظام. المرحلة الرابعة: الربط مكتمل.
        </p>
      </div>

      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-green-900 font-semibold mb-1">المرحلة الرابعة: ربط الأدوار بالصلاحيات</p>
          <p className="text-green-800 text-sm">
            تم ربط جميع الأدوار بالصلاحيات المناسبة. اختر دوراً لمشاهدة صلاحياته.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          اختر الدور لعرض صلاحياته:
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {roles.map((role) => {
            const actionsCount = selectedRole?.id === role.id ? roleActions.filter(a => a.is_enabled).length : 0;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className="p-4 rounded-xl border-2 transition-all text-right"
                style={{
                  borderColor: selectedRole?.id === role.id ? '#2563eb' : '#e5e7eb',
                  background: selectedRole?.id === role.id ? '#eff6ff' : '#ffffff'
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-sm">{role.role_name_ar}</span>
                </div>
                {selectedRole?.id === role.id && (
                  <span className="text-xs text-blue-600 font-medium">
                    {actionsCount} صلاحية مفعلة
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedRole && (
        <>
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  صلاحيات دور: {selectedRole.role_name_ar}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  إجمالي {roleActions.length} صلاحية ({roleActions.filter(a => a.is_enabled).length} مفعلة)
                </p>
              </div>
            </div>

            {roleActions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                لا توجد صلاحيات معينة لهذا الدور
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(actionsByCategory).map(([categoryKey, { name, actions }]) => {
                  const isExpanded = expandedCategory === categoryKey;
                  const enabledCount = actions.filter(a => a.is_enabled).length;

                  return (
                    <div
                      key={categoryKey}
                      className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : categoryKey)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            enabledCount === actions.length
                              ? 'bg-green-100'
                              : enabledCount > 0
                              ? 'bg-amber-100'
                              : 'bg-gray-100'
                          }`}>
                            <Shield className={`w-5 h-5 ${
                              enabledCount === actions.length
                                ? 'text-green-600'
                                : enabledCount > 0
                                ? 'text-amber-600'
                                : 'text-gray-400'
                            }`} />
                          </div>
                          <div className="text-right">
                            <h4 className="font-bold text-gray-900">{name}</h4>
                            <p className="text-sm text-gray-600">
                              {enabledCount} من {actions.length} صلاحية مفعلة
                            </p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t-2 border-gray-100 bg-gray-50 p-4 space-y-2">
                          {actions.map((action) => (
                            <div
                              key={action.action_id}
                              className={`p-3 rounded-lg border-2 ${
                                action.is_enabled
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-gray-100 border-gray-300 opacity-50'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {action.is_enabled ? (
                                      <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <X className="w-4 h-4 text-gray-400" />
                                    )}
                                    <h5 className="font-bold text-gray-900">
                                      {action.action_name_ar}
                                    </h5>
                                    {action.is_dangerous && (
                                      <AlertTriangle className="w-4 h-4 text-red-500" />
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mr-6">
                                    {action.description_ar}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1 mr-6 font-mono">
                                    {action.action_key}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap mr-6">
                                {getScopeLevelBadge(action.scope_level)}

                                {action.is_dangerous && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    حرجة
                                  </span>
                                )}

                                {action.requires_approval && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                    تتطلب موافقة
                                  </span>
                                )}

                                {action.is_enabled ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-200 text-green-800">
                                    مفعلة
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-300 text-gray-600">
                                    معطلة
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedRole.role_key === 'super_admin' && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-900 font-semibold mb-1">ملاحظة: صلاحية messaging.send</p>
                <p className="text-amber-800 text-sm">
                  تم تعطيل صلاحية الإرسال المباشر للرسائل (messaging.send) افتراضياً للمدير العام.
                  يمكن تفعيلها عند الحاجة من خلال لوحة إدارة الصلاحيات.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
