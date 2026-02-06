import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  Settings,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  LogIn,
  Phone
} from 'lucide-react';
import {
  influencerMarketingService,
  InfluencerPartner,
  InfluencerSettings,
  CreateInfluencerPartnerData
} from '../../services/influencerMarketingService';
import { supabase } from '../../lib/supabase';
import { impersonationService } from '../../services/impersonationService';
import { useAuth } from '../../contexts/AuthContext';

export default function InfluencerPartnersManager() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<InfluencerPartner[]>([]);
  const [settings, setSettings] = useState<InfluencerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newPartner, setNewPartner] = useState<CreateInfluencerPartnerData>({
    name: '',
    display_name: '',
    phone: '',
    is_active: true,
    notes: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    is_system_active: false,
    trees_required_for_reward: 20,
    reward_type: 'tree',
    congratulation_message_ar: '',
    congratulation_message_en: '',
    featured_package_color: '#FFD700',
    auto_activate_partners: true
  });

  useEffect(() => {
    loadData();

    // Listen for admin identity changes to refresh data
    const handleIdentityChange = () => {
      console.log('🔄 [InfluencerPartnersManager] Identity changed, reloading data...');
      loadData();
    };

    window.addEventListener('admin-identity-changed', handleIdentityChange);

    return () => {
      window.removeEventListener('admin-identity-changed', handleIdentityChange);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [partnersData, settingsData] = await Promise.all([
        influencerMarketingService.getAllPartners(),
        influencerMarketingService.getSettings()
      ]);

      setPartners(partnersData);
      setSettings(settingsData);

      if (settingsData) {
        setSettingsForm({
          is_system_active: settingsData.is_system_active,
          trees_required_for_reward: settingsData.trees_required_for_reward,
          reward_type: settingsData.reward_type,
          congratulation_message_ar: settingsData.congratulation_message_ar,
          congratulation_message_en: settingsData.congratulation_message_en,
          featured_package_color: settingsData.featured_package_color,
          auto_activate_partners: settingsData.auto_activate_partners
        });
      }
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      showMessage('error', 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPartner.name.trim()) {
      showMessage('error', 'يرجى إدخال اسم المؤثر');
      return;
    }

    try {
      const exists = await influencerMarketingService.checkPartnerExists(newPartner.name);
      if (exists) {
        showMessage('error', 'اسم المؤثر موجود مسبقاً');
        return;
      }

      await influencerMarketingService.createPartner({
        name: newPartner.name.trim(),
        display_name: newPartner.display_name?.trim() || undefined,
        is_active: newPartner.is_active,
        notes: newPartner.notes?.trim() || undefined
      });

      showMessage('success', 'تم إضافة المؤثر بنجاح');
      setShowAddForm(false);
      setNewPartner({ name: '', display_name: '', phone: '', is_active: true, notes: '' });
      loadData();
    } catch (error) {
      console.error('خطأ في إضافة المؤثر:', error);
      showMessage('error', 'فشل في إضافة المؤثر');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await influencerMarketingService.togglePartnerStatus(id, !currentStatus);
      showMessage('success', `تم ${!currentStatus ? 'تفعيل' : 'إيقاف'} المؤثر`);
      loadData();
    } catch (error) {
      console.error('خطأ في تغيير الحالة:', error);
      showMessage('error', 'فشل في تغيير الحالة');
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المؤثر؟')) return;

    try {
      await influencerMarketingService.deletePartner(id);
      showMessage('success', 'تم حذف المؤثر بنجاح');
      loadData();
    } catch (error) {
      console.error('خطأ في حذف المؤثر:', error);
      showMessage('error', 'فشل في حذف المؤثر');
    }
  };

  const handleImpersonatePartner = async (partnerId: string, partnerName: string) => {
    if (!confirm(`هل تريد الدخول على حساب ${partnerName}؟`)) return;

    if (!user) {
      showMessage('error', 'يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      console.log('🎭 [Admin] Starting partner impersonation...');
      console.log('   Partner ID:', partnerId);
      console.log('   Partner Name:', partnerName);
      console.log('   Admin User ID:', user.id);

      const { data, error } = await supabase.rpc('admin_get_partner_login_info', {
        partner_id: partnerId
      });

      if (error) throw error;

      if (!data.success) {
        showMessage('error', data.message || 'فشل في الوصول للحساب');
        return;
      }

      if (!data.user_id) {
        showMessage('error', 'هذا الشريك لا يمتلك حساب مستخدم بعد');
        return;
      }

      impersonationService.startImpersonation({
        partnerId: partnerId,
        partnerName: data.name || partnerName,
        partnerPhone: data.phone || '',
        adminUserId: user.id
      });

      showMessage('success', `جارِ الدخول على حساب ${partnerName}...`);

      console.log('✅ [Admin] Impersonation started successfully');
      console.log('🔄 [Admin] Redirecting to homepage...');

      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (error) {
      console.error('❌ [Admin] خطأ في محاولة الدخول:', error);
      showMessage('error', 'فشل في الدخول على الحساب');
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await influencerMarketingService.updateSettings(settingsForm);
      showMessage('success', 'تم تحديث الإعدادات بنجاح');
      setShowSettings(false);
      loadData();
    } catch (error) {
      console.error('خطأ في تحديث الإعدادات:', error);
      showMessage('error', 'فشل في تحديث الإعدادات');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">جارِ التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">شركاء المسيرة</h2>
              <p className="text-sm text-slate-500">إدارة المؤثرين ونظام المكافآت</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              الإعدادات
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة مؤثر
            </button>
          </div>
        </div>

        {settings && (
          <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
            settings.is_system_active
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-slate-50 border border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              {settings.is_system_active ? (
                <Power className="w-5 h-5 text-emerald-600" />
              ) : (
                <PowerOff className="w-5 h-5 text-slate-400" />
              )}
              <div>
                <p className={`font-semibold ${
                  settings.is_system_active ? 'text-emerald-800' : 'text-slate-600'
                }`}>
                  النظام {settings.is_system_active ? 'مفعّل' : 'موقوف'}
                </p>
                <p className="text-sm text-slate-500">
                  المكافأة: شجرة واحدة لكل {settings.trees_required_for_reward} شجرة محجوزة
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">اسم المؤثر</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">اسم العرض</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">رقم الجوال</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">الحالة</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">الحجوزات</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">الأشجار</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">المكافآت</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">التقدم</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    لا يوجد مؤثرين حالياً. اضغط "إضافة مؤثر" للبدء
                  </td>
                </tr>
              ) : (
                partners.map((partner) => (
                  <tr key={partner.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{partner.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {partner.display_name || '-'}
                    </td>
                    <td className="py-3 px-4">
                      {partner.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <a href={`tel:${partner.phone}`} className="text-emerald-600 hover:text-emerald-700 font-medium">
                            {partner.phone}
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        partner.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {partner.is_active ? 'مفعّل' : 'موقوف'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{partner.total_bookings}</td>
                    <td className="py-3 px-4 text-slate-600">{partner.total_trees_booked}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-amber-600">{partner.total_rewards_earned}</span>
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const treesRequired = settings?.trees_required_for_reward || 20;
                        const treesInBatch = partner.total_trees_booked % treesRequired;
                        const treesUntilNext = treesRequired - treesInBatch;
                        const progressPercentage = (treesInBatch / treesRequired) * 100;

                        return (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="font-medium">{treesInBatch}/{treesRequired}</span>
                              <span className="text-slate-400">({treesUntilNext} متبقية)</span>
                            </div>
                            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {partner.user_id && (
                          <button
                            onClick={() => handleImpersonatePartner(partner.id, partner.display_name || partner.name)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="دخول مباشر على الحساب"
                          >
                            <LogIn className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleStatus(partner.id, partner.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            partner.is_active
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                          }`}
                          title={partner.is_active ? 'إيقاف' : 'تفعيل'}
                        >
                          {partner.is_active ? (
                            <PowerOff className="w-4 h-4" />
                          ) : (
                            <Power className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeletePartner(partner.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">إضافة مؤثر جديد</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddPartner} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  اسم المؤثر <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="مثال: أحمد_المزارع"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">سيستخدم للإدخال في صفحة المزرعة</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  اسم العرض (اختياري)
                </label>
                <input
                  type="text"
                  value={newPartner.display_name}
                  onChange={(e) => setNewPartner({ ...newPartner, display_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="مثال: أحمد المزارع"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  رقم الجوال (اختياري)
                </label>
                <input
                  type="tel"
                  value={newPartner.phone}
                  onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="مثال: 05xxxxxxxx"
                  dir="ltr"
                />
                <p className="text-xs text-slate-500 mt-1">رقم الجوال للتواصل مع الشريك</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={newPartner.notes}
                  onChange={(e) => setNewPartner({ ...newPartner, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows={3}
                  placeholder="ملاحظات داخلية..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newPartner.is_active}
                  onChange={(e) => setNewPartner({ ...newPartner, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                  تفعيل المؤثر مباشرة
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSettings && settings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">إعدادات نظام المؤثرين</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <input
                  type="checkbox"
                  id="is_system_active"
                  checked={settingsForm.is_system_active}
                  onChange={(e) => setSettingsForm({ ...settingsForm, is_system_active: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="is_system_active" className="font-medium text-slate-800">
                  تفعيل نظام المؤثرين بالكامل
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  عدد الأشجار المطلوبة للمكافأة
                </label>
                <input
                  type="number"
                  min="1"
                  value={settingsForm.trees_required_for_reward}
                  onChange={(e) => setSettingsForm({ ...settingsForm, trees_required_for_reward: parseInt(e.target.value) || 20 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-slate-500 mt-1">كل X شجرة محجوزة = شجرة واحدة للمؤثر</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  رسالة "مبرووووك" بالعربية
                </label>
                <textarea
                  value={settingsForm.congratulation_message_ar}
                  onChange={(e) => setSettingsForm({ ...settingsForm, congratulation_message_ar: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  رسالة "مبرووووك" بالإنجليزية
                </label>
                <textarea
                  value={settingsForm.congratulation_message_en}
                  onChange={(e) => setSettingsForm({ ...settingsForm, congratulation_message_en: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  لون الباقة المميزة
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settingsForm.featured_package_color}
                    onChange={(e) => setSettingsForm({ ...settingsForm, featured_package_color: e.target.value })}
                    className="w-16 h-10 rounded-lg border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settingsForm.featured_package_color}
                    onChange={(e) => setSettingsForm({ ...settingsForm, featured_package_color: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="#FFD700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <input
                  type="checkbox"
                  id="auto_activate_partners"
                  checked={settingsForm.auto_activate_partners}
                  onChange={(e) => setSettingsForm({ ...settingsForm, auto_activate_partners: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="auto_activate_partners" className="text-sm font-medium text-slate-700">
                  تفعيل الشركاء تلقائياً عند الإضافة
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  حفظ الإعدادات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
