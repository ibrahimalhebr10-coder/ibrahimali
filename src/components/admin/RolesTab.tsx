import { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, AlertCircle, Check, X, Lock } from 'lucide-react';
import { permissionsService, AdminRole } from '../../services/permissionsService';

export default function RolesTab() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const [formData, setFormData] = useState({
    role_name_ar: '',
    role_name_en: '',
    description: '',
    priority: 100
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    setLoading(true);
    try {
      const data = await permissionsService.getAllRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setFormData({
      role_name_ar: '',
      role_name_en: '',
      description: '',
      priority: 100
    });
    setEditingRole(null);
    setShowCreateModal(true);
    setError('');
    setSuccess('');
  }

  function openEditModal(role: AdminRole) {
    setFormData({
      role_name_ar: role.role_name_ar,
      role_name_en: role.role_name_en,
      description: role.description || '',
      priority: role.priority
    });
    setEditingRole(role);
    setShowCreateModal(true);
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.role_name_ar || !formData.role_name_en) {
      setError('يرجى إدخال اسم الدور بالعربية والإنجليزية');
      return;
    }

    try {
      if (editingRole) {
        const result = await permissionsService.updateRole(editingRole.id, {
          role_name_ar: formData.role_name_ar,
          role_name_en: formData.role_name_en,
          description: formData.description,
          priority: formData.priority
        });

        if (result) {
          await permissionsService.logPermissionAction(
            'update_role',
            editingRole.id,
            `تم تحديث الدور: ${formData.role_name_ar}`,
            { old_name: editingRole.role_name_ar, new_name: formData.role_name_ar }
          );
          setSuccess('تم تحديث الدور بنجاح');
          await loadRoles();
          setTimeout(() => {
            setShowCreateModal(false);
            setSuccess('');
          }, 1500);
        } else {
          setError('فشل تحديث الدور');
        }
      } else {
        const roleKey = formData.role_name_en.toLowerCase().replace(/\s+/g, '_');
        const newRole = await permissionsService.createRole({
          role_key: roleKey,
          role_name_ar: formData.role_name_ar,
          role_name_en: formData.role_name_en,
          description: formData.description,
          priority: formData.priority
        });

        if (newRole) {
          await permissionsService.logPermissionAction(
            'create_role',
            newRole.id,
            `تم إنشاء دور جديد: ${formData.role_name_ar}`,
            { role_key: roleKey, role_name: formData.role_name_ar }
          );
          setSuccess('تم إنشاء الدور بنجاح');
          await loadRoles();
          setTimeout(() => {
            setShowCreateModal(false);
            setSuccess('');
          }, 1500);
        } else {
          setError('فشل إنشاء الدور');
        }
      }
    } catch (error: any) {
      console.error('Error saving role:', error);
      setError(error.message || 'حدث خطأ أثناء حفظ الدور');
    }
  }

  async function handleDeleteRole(role: AdminRole) {
    if (role.is_system_role) {
      alert('لا يمكن حذف الأدوار الأساسية');
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف دور "${role.role_name_ar}"؟`)) {
      return;
    }

    try {
      const result = await permissionsService.deleteRole(role.id);
      if (result) {
        await permissionsService.logPermissionAction(
          'delete_role',
          role.id,
          `تم حذف الدور: ${role.role_name_ar}`,
          { role_key: role.role_key, role_name: role.role_name_ar }
        );
        setSuccess('تم حذف الدور بنجاح');
        await loadRoles();
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError('فشل حذف الدور');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      setError('حدث خطأ أثناء حذف الدور');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">الأدوار الإدارية</h3>
          <p className="text-sm text-gray-600 mt-1">إدارة أدوار المستخدمين وصلاحياتهم</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة دور جديد</span>
        </button>
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

      <div className="grid gap-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: role.is_system_role
                      ? 'linear-gradient(145deg, #FEF3C7, #FDE047)'
                      : 'linear-gradient(145deg, #DBEAFE, #93C5FD)',
                    border: role.is_system_role ? '2px solid #F59E0B' : '2px solid #3B82F6'
                  }}
                >
                  {role.is_system_role ? (
                    <Lock className="w-6 h-6 text-amber-700" />
                  ) : (
                    <Shield className="w-6 h-6 text-blue-700" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold text-gray-800">{role.role_name_ar}</h4>
                    <span className="text-sm text-gray-500">({role.role_name_en})</span>
                    {role.is_system_role && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                        دور أساسي
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>الأولوية: {role.priority}</span>
                    <span>المفتاح: {role.role_key}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(role)}
                  disabled={role.is_system_role && role.role_key === 'super_admin'}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={role.is_system_role && role.role_key === 'super_admin' ? 'لا يمكن تعديل دور المدير العام' : 'تعديل'}
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteRole(role)}
                  disabled={role.is_system_role}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={role.is_system_role ? 'لا يمكن حذف الأدوار الأساسية' : 'حذف'}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingRole ? 'تعديل الدور' : 'إضافة دور جديد'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  اسم الدور (عربي) *
                </label>
                <input
                  type="text"
                  value={formData.role_name_ar}
                  onChange={(e) => setFormData({ ...formData, role_name_ar: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="مثال: مدير المحتوى"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  اسم الدور (إنجليزي) *
                </label>
                <input
                  type="text"
                  value={formData.role_name_en}
                  onChange={(e) => setFormData({ ...formData, role_name_en: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="Example: Content Manager"
                  required
                  disabled={editingRole?.is_system_role}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="وصف مختصر للدور وصلاحياته"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  الأولوية (أقل رقم = أعلى أولوية)
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  min="1"
                  max="1000"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  {editingRole ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
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
}
