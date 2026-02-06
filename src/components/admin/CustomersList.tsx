import { useState, useEffect } from 'react';
import { Users, Filter, Plus, Search, AlertTriangle, Trash2, CheckSquare, Square } from 'lucide-react';
import { customerManagementService, Customer } from '../../services/customerManagementService';

interface CustomersListProps {
  onCustomerSelect: (userId: string) => void;
  onViewGroups: () => void;
  onViewDuplicates: () => void;
}

export default function CustomersList({ onCustomerSelect, onViewGroups, onViewDuplicates }: CustomersListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [minTrees, setMinTrees] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'multiple', userId?: string }>({ type: 'multiple' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchQuery]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerManagementService.getCustomersList();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    if (searchQuery) {
      filtered = filtered.filter(customer =>
        customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.includes(searchQuery)
      );
    }

    setFilteredCustomers(filtered);
  };

  const handleApplyTreesFilter = async () => {
    if (!minTrees) {
      loadCustomers();
      return;
    }

    try {
      setLoading(true);
      const data = await customerManagementService.getCustomersList(parseInt(minTrees));
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error('Error filtering customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroupFromFilter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const groupName = formData.get('groupName') as string;
    const description = formData.get('description') as string;

    try {
      const customerIds = filteredCustomers.map(c => c.user_id);
      await customerManagementService.createGroupFromFilter(groupName, customerIds, description);
      alert(`✓ تم إنشاء المجموعة "${groupName}" بنجاح\nعدد العملاء: ${customerIds.length}`);
      setShowCreateGroupModal(false);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('حدث خطأ أثناء إنشاء المجموعة');
    }
  };

  const handleToggleCustomer = (userId: string) => {
    setSelectedCustomers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleToggleAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.user_id));
    }
  };

  const handleDeleteSingle = (userId: string) => {
    setDeleteTarget({ type: 'single', userId });
    setShowDeleteModal(true);
  };

  const handleDeleteMultiple = () => {
    if (selectedCustomers.length === 0) {
      alert('الرجاء اختيار عملاء للحذف');
      return;
    }
    setDeleteTarget({ type: 'multiple' });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'single' && deleteTarget.userId) {
        await customerManagementService.deleteCustomerAccount(deleteTarget.userId, 'DELETE', 'حذف من لوحة التحكم');
        alert('تم حذف العميل بنجاح');
      } else {
        const result = await customerManagementService.deleteCustomersInBatch(
          selectedCustomers,
          'DELETE',
          'حذف جماعي من لوحة التحكم'
        );
        alert(`تم حذف ${result.deleted} عميل بنجاح${result.failed > 0 ? `\nفشل حذف ${result.failed} عميل` : ''}`);
        setSelectedCustomers([]);
      }
      setShowDeleteModal(false);
      loadCustomers();
    } catch (error) {
      console.error('Error deleting customer(s):', error);
      alert('حدث خطأ أثناء الحذف');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'نشط': return 'bg-green-100 text-green-800';
      case 'معطل': return 'bg-red-100 text-red-800';
      case 'غير مفعل': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">قائمة العملاء</h2>
          <p className="text-sm text-gray-600 mt-1">
            إجمالي العملاء: {customers.length}
            {selectedCustomers.length > 0 && (
              <span className="mr-2 text-blue-600 font-semibold">
                • تم اختيار {selectedCustomers.length} عميل
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedCustomers.length > 0 && (
            <button
              onClick={handleDeleteMultiple}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              حذف المحدد ({selectedCustomers.length})
            </button>
          )}
          <button
            onClick={onViewDuplicates}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            العملاء المكررين
          </button>
          <button
            onClick={onViewGroups}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Users className="w-4 h-4" />
            المجموعات
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">بحث</label>
            <div className="relative">
              <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث بالاسم، البريد، أو الجوال..."
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">فلترة حسب عدد الأشجار</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={minTrees}
                onChange={(e) => setMinTrees(e.target.value)}
                placeholder="الحد الأدنى"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleApplyTreesFilter}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {filteredCustomers.length > 0 && (
          <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              عدد النتائج: <span className="font-bold">{filteredCustomers.length}</span> عميل
            </div>
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              إنشاء مجموعة من النتائج
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-center">
                  <button
                    onClick={handleToggleAll}
                    className="text-gray-500 hover:text-blue-600 transition-colors"
                    title={selectedCustomers.length === filteredCustomers.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                  >
                    {selectedCustomers.length === filteredCustomers.length ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الجوال / البريد</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">حالة الحساب</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">أشجاري خضراء</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">أشجاري ذهبية</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">إجمالي الأشجار</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ التسجيل</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.user_id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCustomer(customer.user_id);
                      }}
                      className="text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      {selectedCustomers.includes(customer.user_id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap cursor-pointer"
                    onClick={() => onCustomerSelect(customer.user_id)}
                  >
                    <div className="font-medium text-gray-900">{customer.full_name}</div>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap cursor-pointer"
                    onClick={() => onCustomerSelect(customer.user_id)}
                  >
                    <div className="text-sm text-gray-900">{customer.phone || '-'}</div>
                    <div className="text-xs text-gray-500">{customer.email}</div>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap cursor-pointer"
                    onClick={() => onCustomerSelect(customer.user_id)}
                  >
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.account_status)}`}>
                      {customer.account_status}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-center cursor-pointer"
                    onClick={() => onCustomerSelect(customer.user_id)}
                  >
                    <span className="font-semibold text-green-600">{customer.green_trees_count}</span>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-center cursor-pointer"
                    onClick={() => onCustomerSelect(customer.user_id)}
                  >
                    <span className="font-semibold text-yellow-600">{customer.golden_trees_count}</span>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-center cursor-pointer"
                    onClick={() => onCustomerSelect(customer.user_id)}
                  >
                    <span className="font-bold text-gray-900">{customer.total_trees_count}</span>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                    onClick={() => onCustomerSelect(customer.user_id)}
                  >
                    {new Date(customer.registered_at).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSingle(customer.user_id);
                      }}
                      className="text-red-600 hover:text-red-800 transition-colors p-2"
                      title="حذف العميل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            لا توجد نتائج
          </div>
        )}
      </div>

      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <Plus className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">إنشاء مجموعة جديدة</h3>
            </div>
            <form onSubmit={handleCreateGroupFromFilter} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المجموعة</label>
                <input
                  type="text"
                  name="groupName"
                  required
                  placeholder="مثال: عملاء VIP"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">وصف المجموعة</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="وصف اختياري..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                سيتم إضافة <span className="font-bold">{filteredCustomers.length}</span> عميل للمجموعة
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  إنشاء المجموعة
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">تأكيد الحذف</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center py-4">
                <p className="text-lg text-gray-800 font-medium">
                  {deleteTarget.type === 'single'
                    ? 'هل تريد حذف هذا العميل؟'
                    : `هل تريد حذف ${selectedCustomers.length} عميل؟`
                  }
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  سيتم حذف جميع البيانات المرتبطة
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isDeleting ? 'جاري الحذف...' : 'حذف'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 font-medium"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
