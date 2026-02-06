import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Gift, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface InfluencerSettings {
  is_system_active: boolean;
  trees_required_for_reward: number;
  reward_type: string;
  congratulation_message_ar: string;
  congratulation_message_en: string;
  featured_package_color: string;
  auto_activate_partners: boolean;
}

export default function InfluencerSettingsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<InfluencerSettings>({
    is_system_active: false,
    trees_required_for_reward: 20,
    reward_type: 'tree',
    congratulation_message_ar: 'مبرووووك! 🎉 تم إضافة شجرة مكافأة لحسابك',
    congratulation_message_en: 'Congratulations! 🎉 A reward tree has been added to your account',
    featured_package_color: '#FFD700',
    auto_activate_partners: true
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const { data, error } = await supabase
        .from('influencer_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          is_system_active: data.is_system_active,
          trees_required_for_reward: data.trees_required_for_reward,
          reward_type: data.reward_type,
          congratulation_message_ar: data.congratulation_message_ar,
          congratulation_message_en: data.congratulation_message_en,
          featured_package_color: data.featured_package_color,
          auto_activate_partners: data.auto_activate_partners
        });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setErrorMessage('فشل تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      // Validate trees_required_for_reward
      if (settings.trees_required_for_reward < 1 || settings.trees_required_for_reward > 1000) {
        setErrorMessage('عدد الأشجار المطلوبة يجب أن يكون بين 1 و 1000');
        return;
      }

      const { error } = await supabase
        .from('influencer_settings')
        .update({
          is_system_active: settings.is_system_active,
          trees_required_for_reward: settings.trees_required_for_reward,
          reward_type: settings.reward_type,
          congratulation_message_ar: settings.congratulation_message_ar,
          congratulation_message_en: settings.congratulation_message_en,
          featured_package_color: settings.featured_package_color,
          auto_activate_partners: settings.auto_activate_partners
        })
        .eq('id', '00000000-0000-0000-0000-000000000001');

      if (error) throw error;

      setSuccessMessage('✅ تم حفظ الإعدادات بنجاح!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setErrorMessage('فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto text-emerald-600 animate-spin mb-4" />
          <p className="text-slate-600 font-semibold">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">إعدادات شريك النجاح</h2>
          <p className="text-slate-600">إدارة قواعد المكافآت والإعدادات العامة</p>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-800 font-semibold">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800 font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 space-y-6">
        {/* System Active Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
          <div>
            <label className="text-sm font-bold text-slate-800">تفعيل نظام شركاء النجاح</label>
            <p className="text-xs text-slate-600 mt-1">تشغيل أو إيقاف النظام بالكامل</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, is_system_active: !settings.is_system_active })}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              settings.is_system_active ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                settings.is_system_active ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Reward Calculation Rule */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-bold text-amber-900">قاعدة احتساب المكافآت</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                عدد الأشجار المطلوبة للحصول على مكافأة واحدة
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={settings.trees_required_for_reward}
                  onChange={(e) => setSettings({ ...settings, trees_required_for_reward: parseInt(e.target.value) || 1 })}
                  className="flex-1 px-4 py-3 border-2 border-amber-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 font-bold text-lg text-center"
                />
                <span className="text-sm font-semibold text-slate-600">شجرة</span>
              </div>
              <p className="text-xs text-amber-700 mt-2 font-semibold">
                💡 مثال: إذا كانت القيمة 20، فكل 20 شجرة محجوزة = شجرة واحدة مكافأة
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSettings({ ...settings, trees_required_for_reward: 5 })}
                className="px-4 py-2 rounded-lg bg-white border-2 border-amber-300 text-amber-800 font-bold text-sm hover:bg-amber-50 transition-colors"
              >
                حملة: 5 أشجار
              </button>
              <button
                onClick={() => setSettings({ ...settings, trees_required_for_reward: 10 })}
                className="px-4 py-2 rounded-lg bg-white border-2 border-amber-300 text-amber-800 font-bold text-sm hover:bg-amber-50 transition-colors"
              >
                متوسط: 10 أشجار
              </button>
              <button
                onClick={() => setSettings({ ...settings, trees_required_for_reward: 20 })}
                className="px-4 py-2 rounded-lg bg-white border-2 border-amber-300 text-amber-800 font-bold text-sm hover:bg-amber-50 transition-colors"
              >
                افتراضي: 20 شجرة
              </button>
              <button
                onClick={() => setSettings({ ...settings, trees_required_for_reward: 50 })}
                className="px-4 py-2 rounded-lg bg-white border-2 border-amber-300 text-amber-800 font-bold text-sm hover:bg-amber-50 transition-colors"
              >
                صعب: 50 شجرة
              </button>
            </div>

            <div className="bg-white/80 rounded-xl p-4 border border-amber-300">
              <p className="text-sm text-amber-900 font-semibold">
                📊 معاينة: <span className="text-amber-700">كل {settings.trees_required_for_reward} شجرة محجوزة = مكافأة شجرة واحدة</span>
              </p>
            </div>
          </div>
        </div>

        {/* Auto Activate Partners */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
          <div>
            <label className="text-sm font-bold text-slate-800">تفعيل الشركاء تلقائياً</label>
            <p className="text-xs text-slate-600 mt-1">تفعيل الشركاء الجدد فور التسجيل</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, auto_activate_partners: !settings.auto_activate_partners })}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              settings.auto_activate_partners ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                settings.auto_activate_partners ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Featured Package Color */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">
            لون الباقة المميزة
          </label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={settings.featured_package_color}
              onChange={(e) => setSettings({ ...settings, featured_package_color: e.target.value })}
              className="w-20 h-12 rounded-xl border-2 border-slate-300 cursor-pointer"
            />
            <input
              type="text"
              value={settings.featured_package_color}
              onChange={(e) => setSettings({ ...settings, featured_package_color: e.target.value })}
              className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 font-mono"
              placeholder="#FFD700"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold flex items-center gap-3 hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {saving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>جاري الحفظ...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>حفظ الإعدادات</span>
            </>
          )}
        </button>
      </div>

      {/* Important Note */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-900 font-semibold">
          📌 <span className="font-black">ملاحظة مهمة:</span> يتم احتساب الأشجار فقط من الحجوزات المؤكدة (بعد الدفع). التغييرات في عدد الأشجار المطلوبة تؤثر على جميع الشركاء فوراً.
        </p>
      </div>
    </div>
  );
}
