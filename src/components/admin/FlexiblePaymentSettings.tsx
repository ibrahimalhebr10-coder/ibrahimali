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
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        {/* العنوان */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">نظام الدفع المرن</h3>
              <p className="text-sm text-gray-600 mt-1">
                السماح للعملاء بالحجز أولاً، وعند اكتمال حجز المزرعة سنتواصل معهم لإتمام الدفع
              </p>
            </div>
          </div>
        </div>

        {/* الإعدادات الأساسية */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-5">
          <h4 className="font-bold text-gray-900 text-base">الإعدادات الأساسية</h4>

          {/* تفعيل/تعطيل النظام */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
            <div className="flex-1 ml-4">
              <div className="font-bold text-gray-900">تفعيل نظام الدفع المرن</div>
              <div className="text-sm text-gray-700 mt-1 leading-relaxed">
                السماح بالحجز قبل الدفع، وعند اكتمال المزرعة سيتم التواصل مع العملاء
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
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
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600 shadow-lg"></div>
            </label>
          </div>

          {/* توضيح النظام الجديد */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-5 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-blue-900 mb-2">كيف يعمل النظام؟</h5>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <p>العميل يحجز الأشجار ويختار "الدفع عند اكتمال المزرعة"</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <p>يتم إنشاء حجز معلق في قاعدة البيانات</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <p>عند اكتمال المزرعة، يتم التواصل مع العميل</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">4.</span>
                    <p>بعد الدفع، يتم تفعيل الحجز وضم الأشجار</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ملاحظة هامة */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-amber-900 mb-1">ملاحظة هامة</h5>
                <p className="text-sm text-amber-800 leading-relaxed">
                  لا يوجد تحديد زمني لإتمام الدفع. الحجوزات تبقى معلقة حتى اكتمال المزرعة،
                  ثم يتم التواصل مع العملاء بشكل شخصي.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* زر الحفظ */}
        <div className="bg-white rounded-lg shadow-sm p-5 sticky bottom-0 z-10 border-t-2 border-green-100">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>

            {success && (
              <div className="flex items-center gap-2 text-green-600 animate-pulse">
                <CheckCircle className="w-5 h-5" />
                <span className="font-bold">تم الحفظ بنجاح</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
