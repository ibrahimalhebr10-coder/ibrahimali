import { useState, useEffect } from 'react';
import { CreditCard, Settings, Check, X, AlertCircle, RefreshCw, Eye, EyeOff, Link, Key, Globe, Webhook, TestTube } from 'lucide-react';
import { paymentProvidersService, PaymentProvider } from '../../services/paymentProvidersService';

export default function PaymentProvidersManager() {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await paymentProvidersService.getAllProviders();
      setProviders(data);
    } catch (error) {
      console.error('Error loading providers:', error);
      alert('حدث خطأ أثناء تحميل البوابات');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProvider = async (providerId: string, enabled: boolean) => {
    try {
      await paymentProvidersService.toggleProvider(providerId, enabled);
      alert(enabled ? '✓ تم تفعيل البوابة' : '✓ تم تعطيل البوابة');
      loadProviders();
    } catch (error) {
      console.error('Error toggling provider:', error);
      alert('حدث خطأ أثناء تحديث البوابة');
    }
  };

  const handleSwitchEnvironment = async (providerId: string, environment: 'sandbox' | 'production') => {
    try {
      await paymentProvidersService.switchEnvironment(providerId, environment);
      alert(`✓ تم التبديل إلى بيئة ${environment === 'sandbox' ? 'التجريب' : 'الإنتاج'}`);
      loadProviders();
    } catch (error) {
      console.error('Error switching environment:', error);
      alert('حدث خطأ أثناء تبديل البيئة');
    }
  };

  const handleTestConnection = async (providerId: string) => {
    try {
      setTesting(providerId);
      await paymentProvidersService.testConnection(providerId);

      setTimeout(async () => {
        await loadProviders();
        setTesting(null);
        alert('✓ تم اختبار الاتصال بنجاح');
      }, 2000);
    } catch (error) {
      console.error('Error testing connection:', error);
      setTesting(null);
      alert('❌ فشل اختبار الاتصال');
    }
  };

  const handleSaveConfiguration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProvider) return;

    const formData = new FormData(e.currentTarget);

    try {
      await paymentProvidersService.updateProviderConfiguration(selectedProvider.id, {
        api_key: formData.get('api_key') as string,
        secret_key: formData.get('secret_key') as string,
        merchant_id: formData.get('merchant_id') as string,
        webhook_url: formData.get('webhook_url') as string,
        webhook_secret: formData.get('webhook_secret') as string,
        environment: formData.get('environment') as 'sandbox' | 'production'
      });

      alert('✓ تم حفظ الإعدادات بنجاح');
      setShowConfigModal(false);
      loadProviders();
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getConnectionBadge = (status: string) => {
    const colors = paymentProvidersService.getConnectionStatusColor(status);
    const label = paymentProvidersService.getConnectionStatusLabel(status);
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">البطاقات المالية</h2>
          <p className="text-sm text-gray-600 mt-1">إدارة بوابات الدفع والربط مع المنصات الخارجية</p>
        </div>
        <button
          onClick={loadProviders}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`text-3xl ${paymentProvidersService.getProviderColor(provider.provider_code)}`}>
                    {paymentProvidersService.getProviderIcon(provider.provider_code)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{provider.provider_name_ar}</h3>
                    <p className="text-xs text-gray-500">{provider.provider_name_en}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleProvider(provider.id, !provider.is_enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    provider.is_enabled ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      provider.is_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">الحالة:</span>
                  {getConnectionBadge(provider.connection_status)}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">البيئة:</span>
                  <select
                    value={provider.environment}
                    onChange={(e) => handleSwitchEnvironment(provider.id, e.target.value as 'sandbox' | 'production')}
                    className="px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                    disabled={!provider.is_enabled}
                  >
                    <option value="sandbox">تجريبي</option>
                    <option value="production">إنتاج</option>
                  </select>
                </div>

                {provider.description_ar && (
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {provider.description_ar}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>الحد الأدنى:</span>
                  <span className="font-medium">{provider.min_amount?.toLocaleString()} ر.س</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>الحد الأقصى:</span>
                  <span className="font-medium">{provider.max_amount?.toLocaleString()} ر.س</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedProvider(provider);
                    setShowConfigModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Settings className="w-4 h-4" />
                  إعدادات الربط
                </button>

                {provider.provider_code !== 'bank_transfer' && (
                  <button
                    onClick={() => handleTestConnection(provider.id)}
                    disabled={testing === provider.id || !provider.api_key}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TestTube className={`w-4 h-4 ${testing === provider.id ? 'animate-pulse' : ''}`} />
                    {testing === provider.id ? 'جاري الاختبار...' : 'اختبار الاتصال'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showConfigModal && selectedProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">إعدادات الربط</h3>
                  <p className="text-sm text-gray-600">{selectedProvider.provider_name_ar}</p>
                </div>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveConfiguration} className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">معلومة هامة</p>
                    <p>هذه المفاتيح تُستخدم للربط مع منصة الدفع الخارجية. احرص على عدم مشاركتها مع أي شخص.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4" />
                  البيئة
                </label>
                <select
                  name="environment"
                  defaultValue={selectedProvider.environment}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="sandbox">تجريبي (Sandbox)</option>
                  <option value="production">إنتاج (Production)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  استخدم البيئة التجريبية للاختبار والبيئة الإنتاجية للمعاملات الحقيقية
                </p>
              </div>

              {selectedProvider.provider_code !== 'bank_transfer' && (
                <>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Key className="w-4 h-4" />
                      مفتاح API
                    </label>
                    <div className="relative">
                      <input
                        type={showSecrets['api_key'] ? 'text' : 'password'}
                        name="api_key"
                        defaultValue={selectedProvider.api_key || ''}
                        placeholder="أدخل مفتاح API"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecretVisibility('api_key')}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets['api_key'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Key className="w-4 h-4" />
                      المفتاح السري
                    </label>
                    <div className="relative">
                      <input
                        type={showSecrets['secret_key'] ? 'text' : 'password'}
                        name="secret_key"
                        defaultValue={selectedProvider.secret_key || ''}
                        placeholder="أدخل المفتاح السري"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecretVisibility('secret_key')}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets['secret_key'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {(selectedProvider.provider_code === 'mada' || selectedProvider.provider_code === 'visa_mastercard') && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <CreditCard className="w-4 h-4" />
                        معرف التاجر
                      </label>
                      <input
                        type="text"
                        name="merchant_id"
                        defaultValue={selectedProvider.merchant_id || ''}
                        placeholder="أدخل معرف التاجر"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {(selectedProvider.provider_code === 'tamara' || selectedProvider.provider_code === 'tabby') && (
                    <>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <Link className="w-4 h-4" />
                          رابط Webhook
                        </label>
                        <input
                          type="url"
                          name="webhook_url"
                          defaultValue={selectedProvider.webhook_url || ''}
                          placeholder="https://yourdomain.com/webhooks/payment"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          dir="ltr"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          الرابط الذي سيستقبل الإشعارات من منصة الدفع
                        </p>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <Webhook className="w-4 h-4" />
                          سر Webhook
                        </label>
                        <div className="relative">
                          <input
                            type={showSecrets['webhook_secret'] ? 'text' : 'password'}
                            name="webhook_secret"
                            defaultValue={selectedProvider.webhook_secret || ''}
                            placeholder="أدخل سر Webhook"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => toggleSecretVisibility('webhook_secret')}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showSecrets['webhook_secret'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {selectedProvider.provider_code === 'bank_transfer' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    التحويل البنكي لا يحتاج إلى مفاتيح API. سيتم تفعيله تلقائياً ويمكن للعملاء استخدامه مباشرة.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Check className="w-5 h-5" />
                  حفظ الإعدادات
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
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
