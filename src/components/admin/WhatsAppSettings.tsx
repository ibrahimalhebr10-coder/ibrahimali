import { useState, useEffect } from 'react';
import { MessageCircle, Save, AlertCircle, CheckCircle, Phone, Info } from 'lucide-react';
import { systemSettingsService } from '../../services/systemSettingsService';

export default function WhatsAppSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const [number, enabled] = await Promise.all([
        systemSettingsService.getWhatsAppNumber(),
        systemSettingsService.isWhatsAppEnabled()
      ]);

      setWhatsappNumber(number);
      setWhatsappEnabled(enabled);
    } catch (err) {
      setError('فشل تحميل الإعدادات');
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      if (!whatsappNumber.trim()) {
        setError('يرجى إدخال رقم واتساب');
        return;
      }

      if (!whatsappNumber.startsWith('+')) {
        setError('يجب أن يبدأ الرقم بعلامة + ورمز الدولة');
        return;
      }

      await systemSettingsService.updateWhatsAppNumber(whatsappNumber);
      await systemSettingsService.setWhatsAppEnabled(whatsappEnabled);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('فشل حفظ الإعدادات');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-start gap-4">
          <div className="bg-green-600 text-white p-3 rounded-lg">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              إعدادات واتساب
            </h2>
            <p className="text-gray-600">
              إدارة رقم واتساب للتواصل المباشر مع المستثمرين
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">خطأ</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-800 font-medium">تم الحفظ بنجاح</p>
            <p className="text-green-700 text-sm">سيتم استخدام الرقم الجديد فوراً في جميع أزرار واتساب</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">رقم واتساب المدير</h3>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={whatsappEnabled}
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
                className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-900">
                تفعيل زر واتساب للمستثمرين
              </span>
            </label>
            <p className="text-xs text-gray-500 mr-7">
              عند التفعيل، سيظهر زر "تواصل معنا عبر واتساب" في صفحات المستثمرين
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              رقم الواتساب <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              dir="ltr"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+966501234567"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-left text-lg font-mono"
            />
            <p className="text-xs text-gray-500 mt-2">
              يجب أن يبدأ الرقم بعلامة + متبوعة برمز الدولة (مثال: +966 للسعودية)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 space-y-2">
                <p className="font-semibold">كيف يعمل زر واتساب؟</p>
                <ul className="space-y-1.5 text-blue-800 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <span>المستثمر يضغط على زر "تواصل عبر واتساب" من صفحة حسابه أو حجوزاته</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <span>يفتح تطبيق واتساب تلقائياً مع رسالة جاهزة تحتوي على:</span>
                  </li>
                  <li className="mr-6 text-blue-700">• اسم المستثمر الكامل</li>
                  <li className="mr-6 text-blue-700">• رقم الحجز (إن وُجد)</li>
                  <li className="mr-6 text-blue-700">• اسم المزرعة (إن وُجد)</li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <span>المستثمر يرسل الرسالة لهذا الرقم مباشرة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">4.</span>
                    <span>تصلك الرسالة على واتساب مع جميع التفاصيل</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold mb-1">تنبيه مهم</p>
                <ul className="space-y-1 text-amber-800 text-xs">
                  <li>• تأكد من صحة الرقم قبل الحفظ</li>
                  <li>• يجب أن يكون الرقم مفعّلاً على واتساب</li>
                  <li>• التغييرات ستؤثر فوراً على جميع المستثمرين</li>
                  <li>• إذا قمت بتعطيل واتساب، لن يظهر الزر لأي مستثمر</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium shadow-lg shadow-green-600/30"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>جاري الحفظ...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>حفظ الإعدادات</span>
            </>
          )}
        </button>

        <button
          onClick={loadSettings}
          disabled={saving}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          إلغاء التغييرات
        </button>
      </div>
    </div>
  );
}
