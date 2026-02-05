import { useState, useEffect } from 'react';
import { Package, Save, AlertCircle, CheckCircle } from 'lucide-react';
import {
  influencerMarketingService,
  FeaturedPackageSettings
} from '../../services/influencerMarketingService';

export default function FeaturedPackageManager() {
  const [settings, setSettings] = useState<FeaturedPackageSettings>({
    color: '#d4af37',
    borderStyle: 'solid',
    congratulationText: 'مبرووووك! 🎉',
    benefitDescription: 'الشحن مجاني على هذه الباقة',
    benefitType: 'free_shipping'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await influencerMarketingService.getFeaturedPackageSettings();
      if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error('خطأ في تحميل إعدادات الباقة المميزة:', err);
      setMessage({ type: 'error', text: 'فشل تحميل الإعدادات' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await influencerMarketingService.updateFeaturedPackageSettings(settings);
      setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('خطأ في حفظ الإعدادات:', err);
      setMessage({ type: 'error', text: 'فشل حفظ الإعدادات' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">إعدادات الباقة المميزة</h3>
              <p className="text-sm text-slate-600">تخصيص شكل ومحتوى الباقة المميزة التي تظهر عند إدخال كود المؤثر</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {message && (
            <div className={`flex items-center gap-3 p-4 rounded-xl ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </span>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">القواعد الحاكمة:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>الباقة المميزة عنصر تسويقي مؤقت (Temporary Overlay)</li>
                  <li>ليست باقة دائمة ولا تُخزن مع الباقات</li>
                  <li>تظهر فقط عند إدخال كود المؤثر في صفحة المزرعة</li>
                  <li>تختفي تلقائياً عند: إعادة تحميل، رجوع، تغيير مزرعة، مسح الحقل</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                لون الباقة
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={settings.color}
                  onChange={(e) => setSettings({ ...settings, color: e.target.value })}
                  className="w-16 h-10 rounded-lg border border-slate-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.color}
                  onChange={(e) => setSettings({ ...settings, color: e.target.value })}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="#d4af37"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">لون الإطار والعناصر المميزة</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                نمط الإطار
              </label>
              <select
                value={settings.borderStyle}
                onChange={(e) => setSettings({ ...settings, borderStyle: e.target.value as any })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="solid">خط متصل (Solid)</option>
                <option value="dashed">خط متقطع (Dashed)</option>
                <option value="double">خط مزدوج (Double)</option>
                <option value="gradient">تدرج لوني (Gradient)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">شكل إطار الباقة المميزة</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                نص التهنئة
              </label>
              <input
                type="text"
                value={settings.congratulationText}
                onChange={(e) => setSettings({ ...settings, congratulationText: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="مبرووووك! 🎉"
              />
              <p className="text-xs text-slate-500 mt-1">النص الذي يظهر أعلى الباقة</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                نوع المزية
              </label>
              <select
                value={settings.benefitType}
                onChange={(e) => setSettings({ ...settings, benefitType: e.target.value as any })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="free_shipping">شحن مجاني</option>
                <option value="discount">خصم خاص</option>
                <option value="bonus_trees">أشجار إضافية</option>
                <option value="priority_support">دعم مميز</option>
                <option value="custom">مزية مخصصة</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">نوع الفائدة للمستخدم</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                وصف المزية
              </label>
              <textarea
                value={settings.benefitDescription}
                onChange={(e) => setSettings({ ...settings, benefitDescription: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="الشحن مجاني على هذه الباقة"
              />
              <p className="text-xs text-slate-500 mt-1">وصف تفصيلي للمزية</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-4">معاينة الباقة المميزة</h4>
            <div
              className="relative bg-white rounded-2xl p-6 shadow-lg overflow-hidden"
              style={{
                borderWidth: settings.borderStyle === 'double' ? '4px' : '3px',
                borderStyle: settings.borderStyle === 'gradient' ? 'solid' : settings.borderStyle,
                borderColor: settings.color,
                background: settings.borderStyle === 'gradient'
                  ? `linear-gradient(white, white) padding-box, linear-gradient(135deg, ${settings.color}, ${settings.color}88) border-box`
                  : 'white'
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 text-center py-2 text-sm font-bold text-white"
                style={{ backgroundColor: settings.color }}
              >
                {settings.congratulationText}
              </div>

              <div className="mt-8 space-y-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-800">الباقة المميزة</p>
                  <p className="text-sm text-slate-600 mt-2">{settings.benefitDescription}</p>
                </div>

                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 rounded-lg">
                  <Package className="w-4 h-4" style={{ color: settings.color }} />
                  <span className="text-sm font-medium text-slate-700">
                    {settings.benefitType === 'free_shipping' && 'شحن مجاني'}
                    {settings.benefitType === 'discount' && 'خصم خاص'}
                    {settings.benefitType === 'bonus_trees' && 'أشجار إضافية'}
                    {settings.benefitType === 'priority_support' && 'دعم مميز'}
                    {settings.benefitType === 'custom' && 'مزية مخصصة'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
        </div>
      </div>
    </div>
  );
}
