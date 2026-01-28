import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle, MessageCircle, Key, Globe, Webhook, Info, Phone } from 'lucide-react';
import { messagingChannelsService, WhatsAppProviderConfig, MessagingProvider } from '../../services/messagingChannelsService';

interface WhatsAppBusinessConfigProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function WhatsAppBusinessConfigModal({ onClose, onSaved }: WhatsAppBusinessConfigProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [existingProvider, setExistingProvider] = useState<MessagingProvider | null>(null);
  const [providerName, setProviderName] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState('https://graph.facebook.com/v18.0');
  const [apiKey, setApiKey] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [webhookVerifyToken, setWebhookVerifyToken] = useState('');
  const [webhookEndpoint, setWebhookEndpoint] = useState('/webhook/whatsapp/messages');

  useEffect(() => {
    loadExistingProvider();
  }, []);

  const loadExistingProvider = async () => {
    try {
      setLoading(true);
      const providers = await messagingChannelsService.getProviders('whatsapp_business');

      if (providers.length > 0) {
        const provider = providers[0];
        setExistingProvider(provider);
        setProviderName(provider.provider_name);
        setIsActive(provider.is_active);

        const config = provider.config as WhatsAppProviderConfig;
        setApiBaseUrl(config.api_base_url || 'https://graph.facebook.com/v18.0');
        setApiKey(config.api_key || '');
        setPhoneNumberId(config.phone_number_id || '');
        setBusinessAccountId(config.business_account_id || '');
        setWebhookVerifyToken(config.webhook_verify_token || '');
        setWebhookEndpoint(config.webhook_endpoint || '/webhook/whatsapp/messages');
      }
    } catch (err) {
      console.error('Error loading provider:', err);
      setError('فشل تحميل إعدادات المزود');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      if (!providerName.trim()) {
        setError('يرجى إدخال اسم المزود');
        return;
      }

      if (!apiBaseUrl.trim()) {
        setError('يرجى إدخال رابط API الأساسي');
        return;
      }

      if (!apiKey.trim()) {
        setError('يرجى إدخال Access Token');
        return;
      }

      if (!phoneNumberId.trim()) {
        setError('يرجى إدخال Phone Number ID');
        return;
      }

      if (!businessAccountId.trim()) {
        setError('يرجى إدخال Business Account ID');
        return;
      }

      const config: WhatsAppProviderConfig = {
        api_base_url: apiBaseUrl,
        api_key: apiKey,
        phone_number_id: phoneNumberId,
        business_account_id: businessAccountId,
        webhook_verify_token: webhookVerifyToken,
        webhook_endpoint: webhookEndpoint
      };

      if (existingProvider) {
        await messagingChannelsService.updateProvider(existingProvider.id, {
          provider_name: providerName,
          is_active: isActive,
          config
        });
      } else {
        await messagingChannelsService.createProvider({
          channel_type: 'whatsapp_business',
          provider_name: providerName,
          is_active: isActive,
          is_default: true,
          config
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error saving provider:', err);
      setError(err.message || 'فشل حفظ إعدادات المزود');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full my-8">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                إعدادات WhatsApp Business API
              </h2>
              <p className="text-sm text-gray-600">تكوين الربط مع واتساب للأعمال</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
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
                <p className="text-green-700 text-sm">تم حفظ إعدادات WhatsApp Business بنجاح</p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">معلومات مهمة</p>
                <ul className="space-y-1 text-blue-800 text-xs">
                  <li>• يتطلب حساب WhatsApp Business API معتمد من Meta</li>
                  <li>• يجب التسجيل في Meta Business Platform والحصول على الموافقات</li>
                  <li>• احصل على Access Token من Meta App Dashboard</li>
                  <li>• جميع البيانات الحساسة يتم تخزينها بشكل آمن ومشفر</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                اسم المزود <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="مثال: WhatsApp Business, Meta Business"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">اسم مميز للتعريف بهذا التكوين</p>
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-900">
                  تفعيل المزود
                </span>
              </label>
              <p className="text-xs text-gray-500 mr-7">
                عند التفعيل، سيتم استخدام WhatsApp لإرسال الرسائل للمستثمرين
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-green-600" />
                إعدادات API
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    API Base URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    value={apiBaseUrl}
                    onChange={(e) => setApiBaseUrl(e.target.value)}
                    placeholder="https://graph.facebook.com/v18.0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-left font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">عادة: https://graph.facebook.com/v18.0</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4 text-green-600" />
                    Access Token <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-left font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">احصل عليه من Meta App Dashboard</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-600" />
                    Phone Number ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    placeholder="123456789012345"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-left font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">معرف رقم الهاتف من WhatsApp Business</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Business Account ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={businessAccountId}
                    onChange={(e) => setBusinessAccountId(e.target.value)}
                    placeholder="987654321098765"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-left font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">معرف حساب الأعمال من Meta Business</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Webhook className="w-4 h-4 text-green-600" />
                إعدادات Webhook
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Webhook Verify Token
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    value={webhookVerifyToken}
                    onChange={(e) => setWebhookVerifyToken(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-left font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">استخدم رمز قوي وآمن للتحقق من Webhook</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Webhook Endpoint
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={webhookEndpoint}
                    onChange={(e) => setWebhookEndpoint(e.target.value)}
                    placeholder="/webhook/whatsapp/messages"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-left font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">مسار Webhook لتلقي الرسائل والتحديثات</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-1">متطلبات WhatsApp Business API</p>
                  <ol className="space-y-1 text-amber-800 text-xs list-decimal list-inside">
                    <li>التسجيل في Meta Business Platform</li>
                    <li>إنشاء تطبيق WhatsApp Business</li>
                    <li>إضافة رقم هاتف والحصول على الموافقة</li>
                    <li>الحصول على Access Token دائم</li>
                    <li>تكوين Webhook وتسجيله في Meta</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex gap-3 sticky bottom-0 bg-white rounded-b-xl">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
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
            onClick={onClose}
            disabled={saving}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
