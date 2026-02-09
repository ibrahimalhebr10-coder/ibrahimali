import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Gift,
  TrendingUp,
  TrendingDown,
  Info,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PartnerCodeSettingsData {
  default_partner_bonus_years: number;
  max_partner_bonus_years: number;
  min_partner_bonus_years: number;
  partner_code_bonus_description: string;
}

export default function PartnerCodeSettings() {
  const [settings, setSettings] = useState<PartnerCodeSettingsData>({
    default_partner_bonus_years: 3,
    max_partner_bonus_years: 10,
    min_partner_bonus_years: 1,
    partner_code_bonus_description: 'سنوات مجانية إضافية عند استخدام كود الشريك'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', [
          'default_partner_bonus_years',
          'max_partner_bonus_years',
          'min_partner_bonus_years',
          'partner_code_bonus_description'
        ]);

      if (error) throw error;

      if (data) {
        const settingsMap: any = {};
        data.forEach(item => {
          if (item.key.includes('_years')) {
            settingsMap[item.key] = parseInt(item.value);
          } else {
            settingsMap[item.key] = item.value;
          }
        });

        setSettings({
          default_partner_bonus_years: settingsMap.default_partner_bonus_years || 3,
          max_partner_bonus_years: settingsMap.max_partner_bonus_years || 10,
          min_partner_bonus_years: settingsMap.min_partner_bonus_years || 1,
          partner_code_bonus_description: settingsMap.partner_code_bonus_description || 'سنوات مجانية إضافية عند استخدام كود الشريك'
        });
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'فشل تحميل الإعدادات' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // التحقق من الصحة
    if (settings.default_partner_bonus_years < settings.min_partner_bonus_years) {
      setMessage({ type: 'error', text: 'القيمة الافتراضية يجب أن تكون أكبر من أو تساوي الحد الأدنى' });
      return;
    }

    if (settings.default_partner_bonus_years > settings.max_partner_bonus_years) {
      setMessage({ type: 'error', text: 'القيمة الافتراضية يجب أن تكون أقل من أو تساوي الحد الأقصى' });
      return;
    }

    if (settings.min_partner_bonus_years > settings.max_partner_bonus_years) {
      setMessage({ type: 'error', text: 'الحد الأدنى يجب أن يكون أقل من أو يساوي الحد الأقصى' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      // تحديث كل إعداد على حدة
      const updates = [
        {
          key: 'default_partner_bonus_years',
          value: String(settings.default_partner_bonus_years)
        },
        {
          key: 'max_partner_bonus_years',
          value: String(settings.max_partner_bonus_years)
        },
        {
          key: 'min_partner_bonus_years',
          value: String(settings.min_partner_bonus_years)
        },
        {
          key: 'partner_code_bonus_description',
          value: settings.partner_code_bonus_description
        }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .update({
            value: update.value,
            updated_at: new Date().toISOString()
          })
          .eq('key', update.key);

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'فشل حفظ الإعدادات' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-l from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">إعدادات السنوات المجانية لأكواد الشركاء</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              يمكنك التحكم في عدد السنوات المجانية التي يحصل عليها العملاء عند استخدام أكواد الشركاء.
              هذه الإعدادات تُطبق على جميع الأكواد ما لم يتم تخصيص قيمة مختلفة لشريك معين.
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-xl p-4 ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Default Bonus Years */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Gift className="w-4 h-4 text-amber-600" />
              السنوات المجانية الافتراضية للأكواد الجديدة
            </label>
            <input
              type="number"
              min={settings.min_partner_bonus_years}
              max={settings.max_partner_bonus_years}
              value={settings.default_partner_bonus_years}
              onChange={(e) => setSettings({
                ...settings,
                default_partner_bonus_years: parseInt(e.target.value) || 0
              })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg font-bold text-center"
            />
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              هذا هو العدد الافتراضي للسنوات المجانية عند إنشاء كود جديد
            </p>
          </div>

          {/* Min Bonus Years */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <TrendingDown className="w-4 h-4 text-blue-600" />
              الحد الأدنى للسنوات المجانية
            </label>
            <input
              type="number"
              min={0}
              max={settings.max_partner_bonus_years}
              value={settings.min_partner_bonus_years}
              onChange={(e) => setSettings({
                ...settings,
                min_partner_bonus_years: parseInt(e.target.value) || 0
              })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold text-center"
            />
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              أقل عدد سنوات يمكن إعطاؤه لأي كود شريك
            </p>
          </div>

          {/* Max Bonus Years */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              الحد الأقصى للسنوات المجانية
            </label>
            <input
              type="number"
              min={settings.min_partner_bonus_years}
              max={20}
              value={settings.max_partner_bonus_years}
              onChange={(e) => setSettings({
                ...settings,
                max_partner_bonus_years: parseInt(e.target.value) || 0
              })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-bold text-center"
            />
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              أكثر عدد سنوات يمكن إعطاؤه لأي كود شريك
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Info className="w-4 h-4 text-purple-600" />
              وصف الميزة (يظهر للعملاء)
            </label>
            <textarea
              value={settings.partner_code_bonus_description}
              onChange={(e) => setSettings({
                ...settings,
                partner_code_bonus_description: e.target.value
              })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="اكتب وصف الميزة..."
            />
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              هذا النص يظهر للعملاء عند استخدام كود الشريك
            </p>
          </div>

          {/* Preview */}
          <div className="bg-gradient-to-l from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-600" />
              معاينة ما يراه العميل
            </h3>
            <div className="bg-white rounded-lg p-4 border border-amber-300">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-bold">مبروك! لقد حصلت على:</span>
              </div>
              <div className="mt-2 mr-7">
                <p className="text-xl font-black text-amber-600">
                  +{settings.default_partner_bonus_years} سنوات مجانية
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {settings.partner_code_bonus_description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              النطاق: من {settings.min_partner_bonus_years} إلى {settings.max_partner_bonus_years} سنة
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-l from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ الإعدادات</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-bold mb-1">ملاحظات هامة:</p>
            <ul className="space-y-1 mr-4">
              <li>• يمكن تخصيص عدد السنوات المجانية لكل شريك بشكل منفصل من صفحة إدارة الشركاء</li>
              <li>• السنوات المجانية تُضاف إلى مدة العقد الأساسية وسنوات الباقة (إن وُجدت)</li>
              <li>• التغييرات تُطبق على الأكواد الجديدة فقط، ولا تؤثر على الحجوزات القديمة</li>
              <li>• القيمة الافتراضية تُستخدم عند إنشاء شريك جديد فقط</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
