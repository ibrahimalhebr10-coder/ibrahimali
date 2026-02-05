import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Users, UserPlus, UserMinus } from 'lucide-react';
import { customerManagementService, CustomerGroup } from '../../services/customerManagementService';

interface CustomerGroupsProps {
  onBack: () => void;
}

export default function CustomerGroups({ onBack }: CustomerGroupsProps) {
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CustomerGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupMembers(selectedGroup.id);
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await customerManagementService.getAllGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    try {
      const data = await customerManagementService.getGroupMembers(groupId);
      setGroupMembers(data);
    } catch (error) {
      console.error('Error loading group members:', error);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const groupName = formData.get('groupName') as string;
    const description = formData.get('description') as string;

    try {
      await customerManagementService.createGroup(groupName, description);
      alert('✓ تم إنشاء المجموعة بنجاح');
      setShowCreateModal(false);
      loadGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('حدث خطأ أثناء إنشاء المجموعة');
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGroup) return;

    const formData = new FormData(e.currentTarget);
    const groupName = formData.get('groupName') as string;
    const description = formData.get('description') as string;

    try {
      await customerManagementService.updateGroup(selectedGroup.id, groupName, description);
      alert('✓ تم تحديث المجموعة بنجاح');
      setShowEditModal(false);
      loadGroups();
    } catch (error) {
      console.error('Error updating group:', error);
      alert('حدث خطأ أثناء تحديث المجموعة');
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;

    try {
      await customerManagementService.deleteGroup(selectedGroup.id);
      alert('✓ تم حذف المجموعة بنجاح');
      setShowDeleteModal(false);
      setSelectedGroup(null);
      loadGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('حدث خطأ أثناء حذف المجموعة');
    }
  };

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGroup) return;

    const formData = new FormData(e.currentTarget);
    const userId = formData.get('userId') as string;

    try {
      await customerManagementService.addMemberToGroup(selectedGroup.id, userId);
      alert('✓ تم إضافة العضو للمجموعة');
      setShowAddMemberModal(false);
      loadGroupMembers(selectedGroup.id);
    } catch (error) {
      console.error('Error adding member:', error);
      alert('حدث خطأ أثناء إضافة العضو');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;
    if (!confirm('هل تريد إزالة هذا العضو من المجموعة؟')) return;

    try {
      await customerManagementService.removeMemberFromGroup(selectedGroup.id, userId);
      alert('✓ تم إزالة العضو من المجموعة');
      loadGroupMembers(selectedGroup.id);
    } catch (error) {
      console.error('Error removing member:', error);
      alert('حدث خطأ أثناء إزالة العضو');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">المجموعات الإدارية</h2>
            <p className="text-sm text-gray-600 mt-1">إدارة وتنظيم العملاء في مجموعات</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          مجموعة جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">قائمة المجموعات</h3>
          <div className="space-y-2">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedGroup?.id === group.id ? 'bg-blue-50 border-2 border-blue-600' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className="font-medium text-gray-900">{group.group_name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {group.members_count || 0} عضو
                </div>
              </div>
            ))}
            {groups.length === 0 && (
              <p className="text-center text-gray-500 py-8">لا توجد مجموعات</p>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {selectedGroup ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedGroup.group_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedGroup.description || 'لا يوجد وصف'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">الأعضاء ({groupMembers.length})</span>
                </div>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  إضافة عضو
                </button>
              </div>

              <div className="space-y-2">
                {groupMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {member.profile?.full_name || member.user.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {member.profile?.phone || member.user.email}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {groupMembers.length === 0 && (
                  <p className="text-center text-gray-500 py-8">لا يوجد أعضاء في هذه المجموعة</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Users className="w-12 h-12 mb-3 opacity-50" />
              <p>اختر مجموعة لعرض تفاصيلها</p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">إنشاء مجموعة جديدة</h3>
            </div>
            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المجموعة</label>
                <input
                  type="text"
                  name="groupName"
                  required
                  placeholder="مثال: عملاء VIP"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="وصف اختياري..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  إنشاء
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">تعديل المجموعة</h3>
            </div>
            <form onSubmit={handleUpdateGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المجموعة</label>
                <input
                  type="text"
                  name="groupName"
                  required
                  defaultValue={selectedGroup.group_name}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={selectedGroup.description || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-red-200 bg-red-50">
              <h3 className="text-xl font-bold text-red-900">حذف المجموعة</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                هل أنت متأكد من حذف المجموعة "<span className="font-bold">{selectedGroup.group_name}</span>"؟
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                ملاحظة: سيتم حذف المجموعة فقط، العملاء لن يتأثروا
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteGroup}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  حذف
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddMemberModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">إضافة عضو</h3>
            </div>
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">معرف العميل (User ID)</label>
                <input
                  type="text"
                  name="userId"
                  required
                  placeholder="uuid"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  يمكنك الحصول على معرف العميل من صفحة قائمة العملاء
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  إضافة
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
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
