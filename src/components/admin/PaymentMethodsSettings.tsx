import React, { useState, useEffect } from 'react';
import { CreditCard, CalendarCheck, Clock, Building2, CheckCircle, XCircle, Settings, AlertCircle, ArrowUp, ArrowDown, Save } from 'lucide-react';
import { paymentMethodsService, PaymentMethod, PaymentMethodType } from '../../services/paymentMethodsService';
import ActionGuard from './ActionGuard';

const methodIcons: Record<PaymentMethodType, React.ComponentType<{ className?: string }>> = {
  mada: CreditCard,
  tabby: CalendarCheck,
  tamara: Clock,
  bank_transfer: Building2
};

export default function PaymentMethodsSettings() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  async function loadPaymentMethods() {
    try {
      setLoading(true);
      const data = await paymentMethodsService.getAllMethods();
      setMethods(data);
    } catch (err) {
      console.error('Error loading payment methods:', err);
      setError('فشل تحميل وسائل السداد');
    } finally {
      setLoading(false);
    }
  }

  async function toggleMethodStatus(method: PaymentMethod) {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!method.is_active) {
        const validation = await paymentMethodsService.validateMethodConfig(
          method.method_type,
          method.config
        );

        if (!validation.isValid) {
          setError(`لا يمكن تفعيل ${method.name_ar}. يرجى إكمال الإعدادات أولاً.`);
          setSelectedMethod(method);
          setShowConfig(true);
          return;
        }
      }

      await paymentMethodsService.toggleMethodStatus(method.id, !method.is_active);
      setSuccess(`تم ${method.is_active ? 'إيقاف' : 'تفعيل'} ${method.name_ar} بنجاح`);
      await loadPaymentMethods();
    } catch (err: any) {
      console.error('Error toggling method status:', err);
      setError(err.message || 'حدث خطأ أثناء تحديث حالة الوسيلة');
    } finally {
      setSaving(false);
    }
  }

  async function updatePriority(method: PaymentMethod, direction: 'up' | 'down') {
    try {
      setSaving(true);
      const newPriority = direction === 'up' ? method.priority - 1 : method.priority + 1;

      if (newPriority < 1) return;

      await paymentMethodsService.updateMethodPriority(method.id, newPriority);
      await loadPaymentMethods();
    } catch (err) {
      console.error('Error updating priority:', err);
      setError('فشل تحديث الترتيب');
    } finally {
      setSaving(false);
    }
  }

  function openConfig(method: PaymentMethod) {
    setSelectedMethod(method);
    setShowConfig(true);
    setError('');
    setSuccess('');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل وسائل السداد...</p>
        </div>
      </div>
    );
  }

  return (
    <ActionGuard action="finance.manage_payment_methods">
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <CreditCard className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">وسائل السداد</h2>
        </div>
        <p className="text-gray-600 mr-11">
          إدارة وسائل السداد المتاحة للمستثمرين
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-900 space-y-2">
            <p className="font-semibold">ملاحظات مهمة:</p>
            <ul className="list-disc list-inside space-y-1 text-amber-800">
              <li>الوسائل غير المفعلة لا تظهر للمستثمرين</li>
              <li>يجب إكمال الإعدادات قبل التفعيل</li>
              <li>الترتيب يحدد ظهور الوسائل في صفحة الدفع</li>
              <li>لا يوجد ربط فعلي ببوابات الدفع في هذه المرحلة</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {methods.map((method, index) => {
          const Icon = methodIcons[method.method_type];
          return (
            <div
              key={method.id}
              className={`bg-white rounded-xl p-6 border-2 transition-all ${
                method.is_active
                  ? 'border-green-200 shadow-lg shadow-green-100'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    method.is_active
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {method.name_ar}
                    </h3>
                    <p className="text-sm text-gray-500">{method.name_en}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {method.is_active ? (
                    <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      مفعّل
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                      <XCircle className="w-4 h-4" />
                      غير مفعّل
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">
                {method.description_ar}
              </p>

              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">المميزات:</p>
                <div className="flex flex-wrap gap-2">
                  {method.features.slice(0, 3).map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => toggleMethodStatus(method)}
                  disabled={saving}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    method.is_active
                      ? 'bg-red-100 hover:bg-red-200 text-red-700'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {method.is_active ? 'إيقاف' : 'تفعيل'}
                </button>

                <button
                  onClick={() => openConfig(method)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  title="الإعدادات"
                >
                  <Settings className="w-5 h-5" />
                </button>

                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => updatePriority(method, 'up')}
                    disabled={saving || index === 0}
                    className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    title="نقل للأعلى"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updatePriority(method, 'down')}
                    disabled={saving || index === methods.length - 1}
                    className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    title="نقل للأسفل"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500 text-center">
                الأولوية: {method.priority}
              </div>
            </div>
          );
        })}
      </div>

      {showConfig && selectedMethod && (
        <ConfigModal
          method={selectedMethod}
          onClose={() => {
            setShowConfig(false);
            setSelectedMethod(null);
          }}
          onSave={async () => {
            setShowConfig(false);
            setSelectedMethod(null);
            await loadPaymentMethods();
            setSuccess('تم حفظ الإعدادات بنجاح');
          }}
        />
      )}
    </div>
    </ActionGuard>
  );
}

function ConfigModal({
  method,
  onClose,
  onSave
}: {
  method: PaymentMethod;
  onClose: () => void;
  onSave: () => void;
}) {
  const [config, setConfig] = useState(method.config);
  const [gatewayConfig, setGatewayConfig] = useState<Record<string, any>>({
    merchant_id: '',
    api_key: '',
    environment: 'sandbox',
    ...((method as any).gateway_config || {})
  });
  const [saving, setSaving] = useState(false);

  const isGateway = ['mada', 'tabby', 'tamara'].includes(method.method_type);

  async function handleSave() {
    try {
      setSaving(true);
      await paymentMethodsService.updateMethodConfig(method.id, config);

      if (isGateway) {
        await paymentMethodsService.updateGatewayConfig(method.id, gatewayConfig);
      }

      onSave();
    } catch (err) {
      console.error('Error saving config:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            إعدادات {method.name_ar}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {method.description_ar}
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">متطلبات التفعيل:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
              {method.requirements.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold mb-1">تنبيه مهم:</p>
                <p>
                  في هذه المرحلة، الإعدادات للتجهيز فقط.
                  لا يوجد ربط فعلي ببوابات الدفع.
                  سيتم تفعيل الدفع الفعلي في مراحل قادمة.
                </p>
              </div>
            </div>
          </div>

          {!isGateway && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">إعدادات الوسيلة:</h4>
              {Object.entries(config).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {key.replace(/_/g, ' ').toUpperCase()}
                  </label>
                  <input
                    type={key.includes('secret') || key.includes('key') ? 'password' : 'text'}
                    value={typeof value === 'string' ? value : JSON.stringify(value)}
                    onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                    placeholder={`أدخل ${key}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          )}

          {isGateway && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">إعدادات بوابة الدفع:</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم التاجر (Merchant ID) *
                    </label>
                    <input
                      type="text"
                      value={gatewayConfig.merchant_id || ''}
                      onChange={(e) => setGatewayConfig({ ...gatewayConfig, merchant_id: e.target.value })}
                      placeholder="أدخل رقم التاجر"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      رقم التاجر الخاص بك من بوابة الدفع
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      مفتاح API (API Key) *
                    </label>
                    <input
                      type="password"
                      value={gatewayConfig.api_key || ''}
                      onChange={(e) => setGatewayConfig({ ...gatewayConfig, api_key: e.target.value })}
                      placeholder="أدخل مفتاح API"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      مفتاح API السري - سيتم تخزينه بشكل آمن
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      البيئة (Environment) *
                    </label>
                    <select
                      value={gatewayConfig.environment || 'sandbox'}
                      onChange={(e) => setGatewayConfig({ ...gatewayConfig, environment: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="sandbox">تجريبي (Sandbox)</option>
                      <option value="production">إنتاج (Production)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      استخدم البيئة التجريبية للاختبار والإنتاج للعمليات الحقيقية
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook Secret (اختياري)
                    </label>
                    <input
                      type="password"
                      value={gatewayConfig.webhook_secret || ''}
                      onChange={(e) => setGatewayConfig({ ...gatewayConfig, webhook_secret: e.target.value })}
                      placeholder="أدخل Webhook Secret"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      مفتاح التحقق من webhooks - لتأكيد صحة الإشعارات
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-900">
                    <p className="font-semibold mb-1">تنبيه أمني:</p>
                    <p>
                      لا تشارك هذه المعلومات مع أي شخص.
                      مفاتيح API والأسرار يتم تخزينها بشكل آمن في قاعدة البيانات.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-900">
                    <p className="font-semibold mb-1">ملاحظة:</p>
                    <p>
                      التفعيل الفعلي لبوابات الدفع سيكون في مراحل قادمة.
                      حالياً، يمكنك حفظ الإعدادات للتجهيز فقط.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </div>
      </div>
    </div>
  );
}
