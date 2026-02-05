import { useState, useEffect } from 'react';
import { Users, Filter, Plus, Search, AlertTriangle } from 'lucide-react';
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
          <p className="text-sm text-gray-600 mt-1">إجمالي العملاء: {customers.length}</p>
        </div>
        <div className="flex gap-2">
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الجوال / البريد</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">حالة الحساب</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">أشجاري خضراء</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">أشجاري ذهبية</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">إجمالي الأشجار</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.user_id}
                  onClick={() => onCustomerSelect(customer.user_id)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{customer.full_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.phone || '-'}</div>
                    <div className="text-xs text-gray-500">{customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.account_status)}`}>
                      {customer.account_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="font-semibold text-green-600">{customer.green_trees_count}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="font-semibold text-yellow-600">{customer.golden_trees_count}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="font-bold text-gray-900">{customer.total_trees_count}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(customer.registered_at).toLocaleDateString('ar-SA')}
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
    </div>
  );
}
