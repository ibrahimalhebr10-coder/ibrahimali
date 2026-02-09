import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Clock, Bell, Play, RefreshCw } from 'lucide-react';
import { systemSettingsService } from '../../services/systemSettingsService';
import { supabase } from '../../lib/supabase';

export default function FlexiblePaymentSettings() {
  const [settings, setSettings] = useState({
    flexible_payment_enabled: 'true',
    payment_grace_period_days: '7',
    auto_cancel_after_deadline: 'false',
    reminder_on_booking: 'true',
    reminder_midway: 'true',
    reminder_one_day_before: 'true',
    reminder_deadline_day: 'true'
  });

  const [messageTemplates, setMessageTemplates] = useState({
    payment_reminder_initial: '',
    payment_reminder_midway: '',
    payment_reminder_urgent: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [runningReminders, setRunningReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const allSettingsArray = await systemSettingsService.getAllSettings();

      // تحويل المصفوفة إلى كائن للوصول السهل
      const allSettings: Record<string, string> = {};
      allSettingsArray.forEach(setting => {
        allSettings[setting.key] = setting.value;
      });

      console.log('📥 [SETTINGS] تحميل الإعدادات:', allSettings);

      const loadedSettings = {
        flexible_payment_enabled: allSettings['flexible_payment_enabled'] || 'true',
        payment_grace_period_days: allSettings['payment_grace_period_days'] || '7',
        auto_cancel_after_deadline: allSettings['auto_cancel_after_deadline'] || 'false',
        reminder_on_booking: allSettings['reminder_on_booking'] || 'true',
        reminder_midway: allSettings['reminder_midway'] || 'true',
        reminder_one_day_before: allSettings['reminder_one_day_before'] || 'true',
        reminder_deadline_day: allSettings['reminder_deadline_day'] || 'true'
      };

      const loadedTemplates = {
        payment_reminder_initial: allSettings['payment_reminder_initial'] || 'شكراً لحجزك معنا! لديك {days} أيام لإتمام الدفع.',
        payment_reminder_midway: allSettings['payment_reminder_midway'] || 'تذكير: لديك {days} أيام متبقية لإتمام دفع حجزك.',
        payment_reminder_urgent: allSettings['payment_reminder_urgent'] || 'عاجل: يتبقى {hours} ساعة فقط لإتمام دفع حجزك!'
      };

      console.log('✅ [SETTINGS] الإعدادات المحملة:', loadedSettings);
      console.log('✅ [SETTINGS] القوالب المحملة:', loadedTemplates);

      setSettings(loadedSettings);
      setMessageTemplates(loadedTemplates);
    } catch (error) {
      console.error('❌ [SETTINGS] خطأ في تحميل الإعدادات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);

    try {
      console.log('💾 [SETTINGS] بدء حفظ الإعدادات...');
      console.log('💾 [SETTINGS] الإعدادات المراد حفظها:', settings);

      // حفظ الإعدادات
      for (const [key, value] of Object.entries(settings)) {
        console.log(`💾 [SETTINGS] حفظ ${key} = ${value}`);
        const result = await systemSettingsService.updateSetting(key, value);

        if (!result) {
          console.error(`❌ [SETTINGS] فشل حفظ ${key}`);
          throw new Error(`فشل حفظ إعداد: ${key}`);
        }

        console.log(`✅ [SETTINGS] تم حفظ ${key}`);
      }

      // حفظ قوالب الرسائل
      for (const [key, value] of Object.entries(messageTemplates)) {
        console.log(`💾 [SETTINGS] حفظ قالب ${key}`);
        const result = await systemSettingsService.updateSetting(key, value);

        if (!result) {
          console.error(`❌ [SETTINGS] فشل حفظ قالب ${key}`);
          throw new Error(`فشل حفظ قالب: ${key}`);
        }

        console.log(`✅ [SETTINGS] تم حفظ قالب ${key}`);
      }

      console.log('✅ [SETTINGS] تم حفظ جميع الإعدادات بنجاح!');

      // إعادة تحميل الإعدادات للتأكد من الحفظ
      await loadSettings();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('❌ [SETTINGS] خطأ في حفظ الإعدادات:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleRunReminders = async () => {
    setRunningReminders(true);
    setReminderResult(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-reminders`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('فشل تشغيل التذكيرات');
      }

      const result = await response.json();
      setReminderResult(result);

      setTimeout(() => setReminderResult(null), 10000);
    } catch (error) {
      console.error('Error running reminders:', error);
      alert('حدث خطأ أثناء تشغيل التذكيرات');
    } finally {
      setRunningReminders(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-green-50 rounded-lg">
            <Clock className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">نظام الدفع المرن</h3>
            <p className="text-sm text-gray-600 mt-1">
              السماح للعملاء بالحجز أولاً والدفع لاحقاً خلال مدة محددة
            </p>
          </div>
        </div>
      </div>

      {/* الإعدادات الأساسية */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <h4 className="font-bold text-gray-900">الإعدادات الأساسية</h4>

        {/* تفعيل/تعطيل النظام */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium text-gray-900">تفعيل نظام الدفع المرن</div>
            <div className="text-sm text-gray-600 mt-1">
              السماح بالحجز قبل الدفع
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.flexible_payment_enabled === 'true'}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  flexible_payment_enabled: e.target.checked ? 'true' : 'false'
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        {/* المدة الزمنية */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            المدة المسموحة للدفع (بالأيام)
          </label>
          <select
            value={settings.payment_grace_period_days}
            onChange={(e) =>
              setSettings({ ...settings, payment_grace_period_days: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="3">3 أيام</option>
            <option value="5">5 أيام</option>
            <option value="7">7 أيام (الافتراضي)</option>
            <option value="10">10 أيام</option>
            <option value="14">14 يوم (أسبوعين)</option>
            <option value="21">21 يوم (3 أسابيع)</option>
            <option value="30">30 يوم (شهر)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            المدة التي سيكون فيها الحجز معلقاً قبل الدفع
          </p>
        </div>

        {/* الإلغاء التلقائي */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium text-gray-900">إلغاء تلقائي بعد انتهاء المهلة</div>
            <div className="text-sm text-gray-600 mt-1">
              إلغاء الحجز تلقائياً إذا لم يتم الدفع في الموعد المحدد
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.auto_cancel_after_deadline === 'true'}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  auto_cancel_after_deadline: e.target.checked ? 'true' : 'false'
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>
      </div>

      {/* إعدادات التذكيرات */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-green-600" />
          <h4 className="font-bold text-gray-900">التذكيرات التلقائية</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">تذكير فور الحجز</div>
              <div className="text-sm text-gray-600 mt-1">إرسال رسالة تأكيد مع رابط الدفع</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.reminder_on_booking === 'true'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reminder_on_booking: e.target.checked ? 'true' : 'false'
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">تذكير في منتصف المدة</div>
              <div className="text-sm text-gray-600 mt-1">إرسال تذكير بعد مرور نصف المدة</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.reminder_midway === 'true'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reminder_midway: e.target.checked ? 'true' : 'false'
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">تذكير قبل يوم من الموعد</div>
              <div className="text-sm text-gray-600 mt-1">إرسال تذكير عاجل قبل 24 ساعة</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.reminder_one_day_before === 'true'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reminder_one_day_before: e.target.checked ? 'true' : 'false'
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">تذكير في يوم الموعد</div>
              <div className="text-sm text-gray-600 mt-1">إرسال تذكير نهائي في آخر يوم</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.reminder_deadline_day === 'true'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reminder_deadline_day: e.target.checked ? 'true' : 'false'
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* قوالب الرسائل */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <h4 className="font-bold text-gray-900">قوالب رسائل التذكير</h4>
        <p className="text-sm text-gray-600">
          استخدم المتغيرات: <code className="bg-gray-100 px-2 py-1 rounded">{'{days}'}</code> للأيام و <code className="bg-gray-100 px-2 py-1 rounded">{'{hours}'}</code> للساعات و <code className="bg-gray-100 px-2 py-1 rounded">{'{payment_link}'}</code> لرابط الدفع
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رسالة التأكيد الأولى
          </label>
          <textarea
            value={messageTemplates.payment_reminder_initial}
            onChange={(e) =>
              setMessageTemplates({
                ...messageTemplates,
                payment_reminder_initial: e.target.value
              })
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رسالة التذكير في منتصف المدة
          </label>
          <textarea
            value={messageTemplates.payment_reminder_midway}
            onChange={(e) =>
              setMessageTemplates({
                ...messageTemplates,
                payment_reminder_midway: e.target.value
              })
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رسالة التذكير العاجل
          </label>
          <textarea
            value={messageTemplates.payment_reminder_urgent}
            onChange={(e) =>
              setMessageTemplates({
                ...messageTemplates,
                payment_reminder_urgent: e.target.value
              })
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* زر الحفظ */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>

          {success && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">تم الحفظ بنجاح</span>
            </div>
          )}
        </div>
      </div>

      {/* تشغيل التذكيرات يدوياً */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg shadow-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Play className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900">تشغيل التذكيرات التلقائية يدوياً</h4>
            <p className="text-sm text-gray-600 mt-1">
              اختبر نظام التذكيرات أو شغله يدوياً الآن
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="text-sm text-gray-700 space-y-2">
            <p className="font-medium">سيقوم النظام بـ:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>فحص جميع الحجوزات المعلقة</li>
              <li>إرسال التذكيرات المناسبة حسب الوقت المتبقي</li>
              <li>تسجيل جميع التذكيرات في قاعدة البيانات</li>
              <li>إلغاء الحجوزات المنتهية (إذا كان مفعل)</li>
            </ul>
          </div>
        </div>

        <button
          onClick={handleRunReminders}
          disabled={runningReminders}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {runningReminders ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              جاري التشغيل...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              تشغيل التذكيرات الآن
            </>
          )}
        </button>

        {reminderResult && (
          <div className="mt-4 p-4 bg-white rounded-lg border-2 border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h5 className="font-bold text-gray-900 mb-2">نتيجة التشغيل</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">التذكيرات المرسلة</div>
                    <div className="text-2xl font-bold text-green-600">
                      {reminderResult.summary?.reminders_sent || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">التذكيرات المتخطاة</div>
                    <div className="text-2xl font-bold text-gray-600">
                      {reminderResult.summary?.reminders_skipped || 0}
                    </div>
                  </div>
                  {reminderResult.summary?.reservations_cancelled > 0 && (
                    <div>
                      <div className="text-gray-600">الحجوزات الملغاة</div>
                      <div className="text-2xl font-bold text-red-600">
                        {reminderResult.summary.reservations_cancelled}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {new Date(reminderResult.timestamp).toLocaleString('ar-SA')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
