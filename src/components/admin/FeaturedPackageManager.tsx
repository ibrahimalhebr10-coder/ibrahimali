import { useState, useEffect } from 'react';
import { Package, Save, AlertCircle, CheckCircle, DollarSign, Calendar, Clock, Gift, Sparkles } from 'lucide-react';
import {
  influencerMarketingService,
  FeaturedPackageSettings
} from '../../services/influencerMarketingService';

export default function FeaturedPackageManager() {
  const [settings, setSettings] = useState<FeaturedPackageSettings>({
    color: '#d4af37',
    borderStyle: 'solid',
    congratulationText: 'مبرووووك! 🎉',
    name: 'الباقة الذهبية',
    price: 150,
    contractDuration: 10,
    bonusDuration: 6,
    description: 'باقة خاصة لعملاء شركاء المسيرة مع مميزات إضافية',
    highlightText: '+6 أشهر إضافية مجاناً'
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
              <h3 className="text-lg font-bold text-slate-800">إدارة الباقة المميزة</h3>
              <p className="text-sm text-slate-600">الباقة التي تظهر في صفحة المزرعة عند إدخال كود شريك المسيرة</p>
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
                <p className="font-semibold mb-2">ملاحظة مهمة:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>هذه الباقة تظهر فقط عند إدخال كود شريك المسيرة</li>
                  <li>تختفي عند إعادة تحميل الصفحة (F5)</li>
                  <li>عنصر تسويقي مؤقت لتحفيز الحجز</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
            <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              بيانات الباقة الأساسية
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  اسم الباقة
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-slate-800 font-medium"
                  placeholder="الباقة الذهبية"
                />
                <p className="text-xs text-slate-500 mt-1">الاسم الذي يظهر على البطاقة</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  السعر (ر.س / شجرة)
                </label>
                <input
                  type="number"
                  value={settings.price}
                  onChange={(e) => setSettings({ ...settings, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-slate-800 font-medium"
                  placeholder="150"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-slate-500 mt-1">سعر الشجرة الواحدة بالريال السعودي</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  مدة العقد (سنوات)
                </label>
                <input
                  type="number"
                  value={settings.contractDuration}
                  onChange={(e) => setSettings({ ...settings, contractDuration: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-slate-800 font-medium"
                  placeholder="10"
                  min="1"
                />
                <p className="text-xs text-slate-500 mt-1">عدد سنوات العقد</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  المدة المجانية (أشهر)
                </label>
                <input
                  type="number"
                  value={settings.bonusDuration}
                  onChange={(e) => setSettings({ ...settings, bonusDuration: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-slate-800 font-medium"
                  placeholder="6"
                  min="0"
                />
                <p className="text-xs text-slate-500 mt-1">عدد الأشهر المجانية الإضافية</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  وصف الباقة
                </label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none bg-white text-slate-800"
                  rows={3}
                  placeholder="باقة خاصة لعملاء شركاء المسيرة مع مميزات إضافية"
                />
                <p className="text-xs text-slate-500 mt-1">وصف تفصيلي للباقة</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  النص البارز
                </label>
                <input
                  type="text"
                  value={settings.highlightText}
                  onChange={(e) => setSettings({ ...settings, highlightText: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-slate-800 font-medium"
                  placeholder="+6 أشهر إضافية مجاناً"
                />
                <p className="text-xs text-slate-500 mt-1">النص الذي يظهر على شارة المزايا</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
            <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              تخصيص المظهر
            </h4>

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
                    className="w-16 h-11 rounded-lg border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.color}
                    onChange={(e) => setSettings({ ...settings, color: e.target.value })}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-slate-800 font-medium"
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-slate-800 font-medium"
                >
                  <option value="solid">خط متصل (Solid)</option>
                  <option value="dashed">خط متقطع (Dashed)</option>
                  <option value="double">خط مزدوج (Double)</option>
                  <option value="gradient">تدرج لوني (Gradient)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">شكل إطار الباقة المميزة</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  نص التهنئة
                </label>
                <input
                  type="text"
                  value={settings.congratulationText}
                  onChange={(e) => setSettings({ ...settings, congratulationText: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-slate-800 font-medium"
                  placeholder="مبرووووك! 🎉"
                />
                <p className="text-xs text-slate-500 mt-1">النص الذي يظهر في رسالة التهنئة</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
            <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              معاينة الباقة المميزة
            </h4>

            <div
              className="relative bg-white rounded-2xl p-6 shadow-xl overflow-hidden"
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
                className="absolute -top-3 right-1/2 transform translate-x-1/2 text-white text-sm font-bold px-5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg animate-pulse"
                style={{ backgroundColor: settings.color }}
              >
                <Gift className="w-4 h-4" />
                <span>الباقة المميزة</span>
              </div>

              <div className="mt-4 space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-800">{settings.name}</h3>
                  <p className="text-sm text-slate-600 mt-2">{settings.description}</p>
                </div>

                <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl py-3 px-4 text-center">
                  <div className="text-2xl font-bold">{settings.price} ر.س</div>
                  <div className="text-xs opacity-90">للشجرة الواحدة</div>
                </div>

                <div
                  className="rounded-xl py-3 px-4 flex items-center justify-center gap-2 border-2 animate-bounce"
                  style={{
                    backgroundColor: `${settings.color}15`,
                    borderColor: settings.color
                  }}
                >
                  <Clock className="w-5 h-5" style={{ color: settings.color }} />
                  <span className="font-bold text-sm" style={{ color: settings.color }}>
                    {settings.highlightText}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-50 rounded-lg py-2 px-3">
                    <div className="text-xs text-slate-600">مدة العقد</div>
                    <div className="text-lg font-bold text-slate-800">{settings.contractDuration} سنوات</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg py-2 px-3">
                    <div className="text-xs text-slate-600">مجاناً</div>
                    <div className="text-lg font-bold text-slate-800">{settings.bonusDuration} أشهر</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-semibold"
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
