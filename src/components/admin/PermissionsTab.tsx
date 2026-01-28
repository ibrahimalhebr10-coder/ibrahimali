import { useState, useEffect } from 'react';
import { Check, AlertCircle, Shield, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { permissionsService, AdminRole, AdminPermission } from '../../services/permissionsService';

export default function PermissionsTab() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [allPermissions, setAllPermissions] = useState<AdminPermission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<AdminPermission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categoryNames: Record<string, string> = {
    dashboard: 'لوحة التحكم',
    farms: 'المزارع',
    reservations: 'الحجوزات',
    finance: 'المالية والسداد',
    users: 'المستخدمين',
    messages: 'الرسائل',
    admins: 'مستخدمو الإدارة',
    settings: 'إعدادات المنصة',
    logs: 'السجلات'
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      loadRolePermissions();
    }
  }, [selectedRole]);

  async function loadData() {
    setLoading(true);
    try {
      const [rolesData, permsData] = await Promise.all([
        permissionsService.getAllRoles(),
        permissionsService.getAllPermissions()
      ]);
      setRoles(rolesData);
      setAllPermissions(permsData);

      if (rolesData.length > 0) {
        setSelectedRole(rolesData[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }

  async function loadRolePermissions() {
    if (!selectedRole) return;

    try {
      const perms = await permissionsService.getRolePermissions(selectedRole.id);
      setRolePermissions(perms);
      setSelectedPermissionIds(new Set(perms.map(p => p.id)));
    } catch (error) {
      console.error('Error loading role permissions:', error);
    }
  }

  function togglePermission(permissionId: string) {
    if (selectedRole?.role_key === 'super_admin') {
      return;
    }

    const newSet = new Set(selectedPermissionIds);
    if (newSet.has(permissionId)) {
      newSet.delete(permissionId);
    } else {
      newSet.add(permissionId);
    }
    setSelectedPermissionIds(newSet);
  }

  function toggleCategory(category: string) {
    const newSet = new Set(expandedCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setExpandedCategories(newSet);
  }

  function toggleAllInCategory(category: string, checked: boolean) {
    if (selectedRole?.role_key === 'super_admin') {
      return;
    }

    const categoryPerms = allPermissions.filter(p => p.category === category);
    const newSet = new Set(selectedPermissionIds);

    categoryPerms.forEach(perm => {
      if (checked) {
        newSet.add(perm.id);
      } else {
        newSet.delete(perm.id);
      }
    });

    setSelectedPermissionIds(newSet);
  }

  async function handleSavePermissions() {
    if (!selectedRole) return;

    if (selectedRole.role_key === 'super_admin') {
      setError('لا يمكن تعديل صلاحيات المدير العام');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const result = await permissionsService.syncRolePermissions(
        selectedRole.id,
        Array.from(selectedPermissionIds)
      );

      if (result) {
        setSuccess('تم حفظ الصلاحيات بنجاح');
        await loadRolePermissions();
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError('فشل حفظ الصلاحيات');
      }
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      setError(error.message || 'حدث خطأ أثناء حفظ الصلاحيات');
    } finally {
      setSaving(false);
    }
  }

  const permissionsByCategory = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, AdminPermission[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-1">إدارة الصلاحيات</h3>
        <p className="text-sm text-gray-600">حدد الصلاحيات لكل دور حسب احتياجات المنصة</p>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          اختر الدور لتعديل صلاحياته:
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role)}
              className="p-4 rounded-xl border-2 transition-all"
              style={{
                borderColor: selectedRole?.id === role.id ? '#10b981' : '#e5e7eb',
                background: selectedRole?.id === role.id ? '#f0fdf4' : '#ffffff'
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                {role.is_system_role ? (
                  <Lock className="w-4 h-4 text-amber-600" />
                ) : (
                  <Shield className="w-4 h-4 text-blue-600" />
                )}
                <span className="font-bold text-sm">{role.role_name_ar}</span>
              </div>
              <span className="text-xs text-gray-500">{rolePermissions.length} صلاحية</span>
            </button>
          ))}
        </div>
      </div>

      {selectedRole && (
        <>
          {selectedRole.role_key === 'super_admin' && (
            <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-600" />
              <span className="text-amber-800 font-semibold">
                دور المدير العام يملك جميع الصلاحيات ولا يمكن تعديله
              </span>
            </div>
          )}

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <div className="space-y-4">
              {Object.entries(permissionsByCategory).map(([category, perms]) => {
                const isExpanded = expandedCategories.has(category);
                const selectedCount = perms.filter(p => selectedPermissionIds.has(p.id)).length;
                const totalCount = perms.length;
                const allSelected = selectedCount === totalCount;
                const someSelected = selectedCount > 0 && selectedCount < totalCount;

                return (
                  <div key={category} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected;
                          }}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleAllInCategory(category, !allSelected);
                          }}
                          disabled={selectedRole.role_key === 'super_admin'}
                          className="w-5 h-5 rounded border-2 border-gray-300"
                        />
                        <h4 className="font-bold text-gray-800">
                          {categoryNames[category] || category}
                        </h4>
                        <span className="text-sm text-gray-500">
                          ({selectedCount}/{totalCount})
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="p-4 space-y-2 bg-white">
                        {perms.map((perm) => {
                          const isChecked = selectedPermissionIds.has(perm.id);
                          return (
                            <label
                              key={perm.id}
                              className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                              style={{
                                background: isChecked ? '#f0fdf4' : '#f9fafb',
                                borderColor: isChecked ? '#86efac' : '#e5e7eb',
                                opacity: selectedRole.role_key === 'super_admin' ? 0.6 : 1,
                                cursor: selectedRole.role_key === 'super_admin' ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(perm.id)}
                                disabled={selectedRole.role_key === 'super_admin'}
                                className="w-5 h-5 rounded border-2 border-gray-300"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-gray-800">
                                    {perm.permission_name_ar}
                                  </span>
                                  {perm.is_critical && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                      حساسة
                                    </span>
                                  )}
                                </div>
                                {perm.description && (
                                  <p className="text-xs text-gray-500 mt-1">{perm.description}</p>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 font-mono">
                                {perm.permission_key}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedRole.role_key !== 'super_admin' && (
              <div className="mt-6 pt-6 border-t-2 border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  تم اختيار <span className="font-bold text-green-600">{selectedPermissionIds.size}</span> من أصل {allPermissions.length} صلاحية
                </div>
                <button
                  onClick={handleSavePermissions}
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>حفظ الصلاحيات</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
