import { useState, useEffect } from 'react';
import { User, Plus, Edit2, UserX, UserCheck, AlertCircle, Check, X, Shield, MapPin } from 'lucide-react';
import { adminService, type Admin } from '../../services/adminService';
import { permissionsService, type AdminRole } from '../../services/permissionsService';
import ManageFarmAssignments from './ManageFarmAssignments';

export default function AdminUsersTab() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [managingFarmsFor, setManagingFarmsFor] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role_id: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [adminsData, rolesData] = await Promise.all([
        adminService.getAllAdmins(),
        permissionsService.getAllRoles()
      ]);
      setAdmins(adminsData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setFormData({
      full_name: '',
      email: '',
      role_id: roles.length > 0 ? roles[0].id : '',
      password: ''
    });
    setEditingAdmin(null);
    setShowModal(true);
    setError('');
    setSuccess('');
  }

  function openEditModal(admin: Admin) {
    setFormData({
      full_name: admin.full_name,
      email: admin.email,
      role_id: admin.role_id || '',
      password: ''
    });
    setEditingAdmin(admin);
    setShowModal(true);
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.full_name || !formData.email || !formData.role_id) {
      setError('يرجى إدخال جميع الحقول المطلوبة');
      return;
    }

    if (!editingAdmin && !formData.password) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }

    try {
      if (editingAdmin) {
        const result = await adminService.updateAdmin(editingAdmin.id, {
          full_name: formData.full_name,
          email: formData.email,
          role_id: formData.role_id
        });

        if (result) {
          const role = roles.find(r => r.id === formData.role_id);
          await permissionsService.logPermissionAction(
            'update_admin',
            editingAdmin.id,
            `تم تحديث بيانات المستخدم الإداري: ${formData.full_name}`,
            { email: formData.email, role: role?.role_name_ar }
          );
          setSuccess('تم تحديث المستخدم بنجاح');
          await loadData();
          setTimeout(() => {
            setShowModal(false);
            setSuccess('');
          }, 1500);
        } else {
          setError('فشل تحديث المستخدم');
        }
      } else {
        const result = await adminService.createAdmin({
          full_name: formData.full_name,
          email: formData.email,
          role_id: formData.role_id,
          password: formData.password
        });

        if (result) {
          const role = roles.find(r => r.id === formData.role_id);
          await permissionsService.logPermissionAction(
            'create_admin',
            formData.email,
            `تم إضافة مستخدم إداري جديد: ${formData.full_name}`,
            { email: formData.email, role: role?.role_name_ar }
          );
          setSuccess('تم إضافة المستخدم بنجاح');
          await loadData();
          setTimeout(() => {
            setShowModal(false);
            setSuccess('');
          }, 1500);
        } else {
          setError('فشل إضافة المستخدم');
        }
      }
    } catch (error: any) {
      console.error('Error saving admin:', error);
      setError(error.message || 'حدث خطأ أثناء حفظ البيانات');
    }
  }

  async function handleToggleStatus(admin: Admin) {
    const newStatus = !admin.is_active;
    const action = newStatus ? 'تفعيل' : 'إيقاف';

    if (!confirm(`هل أنت متأكد من ${action} المستخدم "${admin.full_name}"؟`)) {
      return;
    }

    try {
      const result = await adminService.toggleAdminStatus(admin.id, newStatus);
      if (result) {
        await permissionsService.logPermissionAction(
          'disable_admin',
          admin.id,
          `تم ${action} المستخدم الإداري: ${admin.full_name}`,
          { email: admin.email, new_status: newStatus }
        );
        setSuccess(`تم ${action} المستخدم بنجاح`);
        await loadData();
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(`فشل ${action} المستخدم`);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      setError(`حدث خطأ أثناء ${action} المستخدم`);
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
          <h3 className="text-xl font-bold text-gray-800">مستخدمو الإدارة</h3>
          <p className="text-sm text-gray-600 mt-1">إدارة المستخدمين الإداريين وصلاحياتهم</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة مستخدم</span>
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
        {admins.map((admin) => {
          const adminRole = roles.find(r => r.id === admin.role_id);
          
          return (
            <div
              key={admin.id}
              className="bg-white border-2 rounded-xl p-6 hover:border-green-300 transition-colors"
              style={{ borderColor: admin.is_active ? '#e5e7eb' : '#fecaca' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: admin.is_active
                        ? 'linear-gradient(145deg, #DBEAFE, #93C5FD)'
                        : 'linear-gradient(145deg, #FEE2E2, #FCA5A5)',
                      border: admin.is_active ? '2px solid #3B82F6' : '2px solid #EF4444'
                    }}
                  >
                    {admin.is_active ? (
                      <User className="w-6 h-6 text-blue-700" />
                    ) : (
                      <UserX className="w-6 h-6 text-red-700" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-gray-800">{admin.full_name}</h4>
                      {admin.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                          نشط
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                          موقوف
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">البريد:</span>
                        <span>{admin.email}</span>
                      </div>
                      {adminRole && (
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-600" />
                          <span className="font-semibold">{adminRole.role_name_ar}</span>
                          <span className="text-xs text-gray-400">({adminRole.role_name_en})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setManagingFarmsFor(admin)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="إدارة المزارع التابعة"
                  >
                    <MapPin className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(admin)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="تعديل"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(admin)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    style={{ color: admin.is_active ? '#ef4444' : '#10b981' }}
                    title={admin.is_active ? 'إيقاف' : 'تفعيل'}
                  >
                    {admin.is_active ? (
                      <UserX className="w-5 h-5" />
                    ) : (
                      <UserCheck className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingAdmin ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="مثال: أحمد محمد"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="example@domain.com"
                  required
                  disabled={!!editingAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  الدور *
                </label>
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  required
                >
                  <option value="">اختر الدور</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.role_name_ar} ({role.role_name_en})
                    </option>
                  ))}
                </select>
              </div>

              {!editingAdmin && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    كلمة المرور *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                    placeholder="••••••••"
                    required={!editingAdmin}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  {editingAdmin ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {managingFarmsFor && (
        <ManageFarmAssignments
          admin={managingFarmsFor}
          onClose={() => setManagingFarmsFor(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}
