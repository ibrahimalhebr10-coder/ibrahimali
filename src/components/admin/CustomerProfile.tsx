import { useState, useEffect } from 'react';
import { ArrowLeft, User, Shield, AlertTriangle, Ban, Trash2, TreePine, Coins, Activity, Users } from 'lucide-react';
import { customerManagementService, CustomerProfile as CustomerProfileType } from '../../services/customerManagementService';

interface CustomerProfileProps {
  userId: string;
  onBack: () => void;
}

type Tab = 'green_trees' | 'golden_trees' | 'financial' | 'activity';

export default function CustomerProfile({ userId, onBack }: CustomerProfileProps) {
  const [profile, setProfile] = useState<CustomerProfileType | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('green_trees');
  const [greenTrees, setGreenTrees] = useState<any[]>([]);
  const [goldenTrees, setGoldenTrees] = useState<any[]>([]);
  const [financialHistory, setFinancialHistory] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await customerManagementService.getCustomerProfile(userId);
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    try {
      switch (activeTab) {
        case 'green_trees':
          const green = await customerManagementService.getCustomerGreenTrees(userId);
          setGreenTrees(green);
          break;
        case 'golden_trees':
          const golden = await customerManagementService.getCustomerGoldenTrees(userId);
          setGoldenTrees(golden);
          break;
        case 'financial':
          const financial = await customerManagementService.getCustomerFinancialHistory(userId);
          setFinancialHistory(financial);
          break;
        case 'activity':
          const activity = await customerManagementService.getCustomerActivityLog(userId);
          setActivityLog(activity);
          break;
      }
    } catch (error) {
      console.error('Error loading tab data:', error);
    }
  };

  const handleDisableAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const reason = formData.get('reason') as string;
    const duration = parseInt(formData.get('duration') as string);

    try {
      await customerManagementService.disableCustomerAccount(userId, reason, duration);
      alert(`✓ تم تعطيل الحساب لمدة ${duration} يوم`);
      setShowDisableModal(false);
      loadProfile();
    } catch (error) {
      console.error('Error disabling account:', error);
      alert('حدث خطأ أثناء تعطيل الحساب');
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const confirmationCode = formData.get('confirmationCode') as string;
    const adminReason = formData.get('adminReason') as string;

    try {
      const result = await customerManagementService.deleteCustomerAccount(userId, confirmationCode, adminReason);
      if (result.success) {
        alert(`✓ تم حذف الحساب نهائياً\nعدد الحجوزات المحذوفة: ${result.reservations_deleted}`);
        onBack();
      } else {
        alert('❌ ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('حدث خطأ أثناء حذف الحساب');
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

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
          <p className="text-sm text-gray-600">{profile.email}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(profile.account_status)}`}>
          {profile.account_status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">بطاقة الهوية</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-600">الاسم الكامل:</span>
              <div className="font-medium text-gray-900">{profile.full_name}</div>
            </div>
            <div>
              <span className="text-gray-600">الجوال:</span>
              <div className="font-medium text-gray-900">{profile.phone || '-'}</div>
            </div>
            <div>
              <span className="text-gray-600">البريد:</span>
              <div className="font-medium text-gray-900 text-xs">{profile.email}</div>
            </div>
            <div>
              <span className="text-gray-600">الدولة:</span>
              <div className="font-medium text-gray-900">{profile.country || '-'}</div>
            </div>
            <div className="flex gap-2 pt-2">
              <span className={`px-2 py-1 rounded text-xs ${profile.email_confirmed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {profile.email_confirmed ? 'بريد مفعل' : 'بريد غير مفعل'}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${profile.phone_confirmed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {profile.phone_confirmed ? 'جوال مفعل' : 'جوال غير مفعل'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <TreePine className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">نظرة عامة</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">أشجاري خضراء</span>
              <span className="text-2xl font-bold text-green-600">{profile.green_trees_count}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">أشجاري ذهبية</span>
              <span className="text-2xl font-bold text-yellow-600">{profile.golden_trees_count}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">عدد المزارع</span>
              <span className="text-2xl font-bold text-gray-900">{profile.farms_count}</span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">الالتزامات المالية</span>
                <span className={`text-lg font-bold ${profile.pending_payments > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {profile.pending_payments.toLocaleString()} ر.س
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">المجموعات</h3>
          </div>
          <div className="space-y-2">
            {profile.groups.length > 0 ? (
              profile.groups.map(group => (
                <div key={group.group_id} className="px-3 py-2 bg-purple-50 rounded-lg text-sm text-purple-800">
                  {group.group_name}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">لا ينتمي لأي مجموعة</p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-1">
            <div>التسجيل: {new Date(profile.registered_at).toLocaleDateString('ar-SA')}</div>
            <div>آخر دخول: {profile.last_login ? new Date(profile.last_login).toLocaleDateString('ar-SA') : '-'}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('green_trees')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'green_trees' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              أشجاري الخضراء ({profile.green_trees_count})
            </button>
            <button
              onClick={() => setActiveTab('golden_trees')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'golden_trees' ? 'border-b-2 border-yellow-600 text-yellow-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              أشجاري الذهبية ({profile.golden_trees_count})
            </button>
            <button
              onClick={() => setActiveTab('financial')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'financial' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              السجل المالي
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'activity' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              النشاط والسجل
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'green_trees' && (
            <div className="space-y-4">
              {greenTrees.map((tree) => (
                <div key={tree.reservation_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-gray-900">{tree.farm_name}</div>
                    <span className={`px-2 py-1 rounded text-xs ${tree.maintenance_status === 'مسدد' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {tree.maintenance_status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">عدد الأشجار:</span>
                      <div className="font-medium">{tree.tree_count}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">تاريخ العقد:</span>
                      <div className="font-medium">{tree.contract_start_date}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">آخر صيانة:</span>
                      <div className="font-medium">{tree.last_maintenance ? new Date(tree.last_maintenance).toLocaleDateString('ar-SA') : '-'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">رسوم مستحقة:</span>
                      <div className="font-medium text-red-600">{tree.pending_fees} ر.س</div>
                    </div>
                  </div>
                </div>
              ))}
              {greenTrees.length === 0 && (
                <p className="text-center text-gray-500 py-8">لا توجد أشجار خضراء</p>
              )}
            </div>
          )}

          {activeTab === 'golden_trees' && (
            <div className="space-y-4">
              {goldenTrees.map((tree) => (
                <div key={tree.reservation_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-gray-900">{tree.farm_name}</div>
                    <span className={`px-2 py-1 rounded text-xs ${tree.maintenance_status === 'مسدد' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {tree.maintenance_status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">عدد الأشجار:</span>
                      <div className="font-medium">{tree.tree_count}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">تاريخ العقد:</span>
                      <div className="font-medium">{tree.contract_start_date}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">الاستفادة:</span>
                      <div className="font-medium">{tree.utilization_type}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">آخر تحديث:</span>
                      <div className="font-medium">{new Date(tree.last_update).toLocaleDateString('ar-SA')}</div>
                    </div>
                  </div>
                </div>
              ))}
              {goldenTrees.length === 0 && (
                <p className="text-center text-gray-500 py-8">لا توجد أشجار ذهبية</p>
              )}
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-3">
              {financialHistory.map((payment) => (
                <div key={payment.payment_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{payment.description}</div>
                    <div className="text-sm text-gray-500">{new Date(payment.payment_date).toLocaleDateString('ar-SA')}</div>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">{payment.amount.toLocaleString()} ر.س</div>
                    <div className={`text-xs ${payment.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                      {payment.payment_status === 'paid' ? 'مسدد' : 'مستحق'}
                    </div>
                  </div>
                </div>
              ))}
              {financialHistory.length === 0 && (
                <p className="text-center text-gray-500 py-8">لا يوجد سجل مالي</p>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              {activityLog.map((activity) => (
                <div key={activity.activity_id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                  <Activity className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{activity.activity_type}</div>
                    <div className="text-sm text-gray-600">{activity.activity_description}</div>
                    <div className="text-xs text-gray-500 mt-1">{new Date(activity.activity_timestamp).toLocaleString('ar-SA')}</div>
                  </div>
                </div>
              ))}
              {activityLog.length === 0 && (
                <p className="text-center text-gray-500 py-8">لا يوجد نشاط مسجل</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-red-900">منطقة القرار الحساس</h3>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDisableModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Ban className="w-4 h-4" />
            تعطيل الحساب
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            حذف نهائي
          </button>
        </div>
      </div>

      {showDisableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">تعطيل الحساب</h3>
            </div>
            <form onSubmit={handleDisableAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السبب</label>
                <textarea
                  name="reason"
                  required
                  rows={3}
                  placeholder="اكتب السبب..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المدة (بالأيام)</label>
                <input
                  type="number"
                  name="duration"
                  required
                  defaultValue={30}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  تعطيل
                </button>
                <button
                  type="button"
                  onClick={() => setShowDisableModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
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
            <div className="px-6 py-4 border-b border-red-200 bg-red-50">
              <h3 className="text-xl font-bold text-red-900">حذف نهائي - تحذير</h3>
            </div>
            <form onSubmit={handleDeleteAccount} className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="font-bold text-red-900 mb-2">تحذير:</div>
                <div className="text-sm text-red-800">
                  • الحذف نهائي ولا يمكن التراجع<br />
                  • سيتم حذف جميع الحجوزات<br />
                  • سيتم حذف جميع البيانات
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سبب الحذف</label>
                <textarea
                  name="adminReason"
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كود التأكيد</label>
                <input
                  type="text"
                  name="confirmationCode"
                  required
                  placeholder={`${userId.substring(0, 8)}DELETE`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 font-mono"
                />
                <div className="text-xs text-gray-600 mt-1">
                  اكتب: <span className="font-mono font-bold">{userId.substring(0, 8)}DELETE</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  حذف نهائي
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
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
