import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, AlertCircle, RefreshCw, Eye, EyeOff, Save, TestTube } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PaymentProvider {
  id: string;
  provider_code: string;
  provider_name_ar: string;
  provider_name_en: string;
  display_order: number;
  is_enabled: boolean;
  environment: 'sandbox' | 'production';
  connection_status: 'connected' | 'disconnected' | 'testing' | 'error';
  api_key?: string;
  secret_key?: string;
  merchant_id?: string;
  webhook_url?: string;
  webhook_secret?: string;
  last_test_at?: string;
  last_test_status?: string;
}

const PaymentProvidersManager: React.FC = () => {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editForm, setEditForm] = useState<Partial<PaymentProvider>>({});

  useEffect(() => {
    loadProviders();

    // Listen for admin identity changes to refresh data
    const handleIdentityChange = () => {
      console.log('🔄 [PaymentProvidersManager] Identity changed, reloading data...');
      loadProviders();
    };

    window.addEventListener('admin-identity-changed', handleIdentityChange);

    return () => {
      window.removeEventListener('admin-identity-changed', handleIdentityChange);
    };
  }, []);

  const loadProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_providers')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (provider: PaymentProvider) => {
    setEditingId(provider.id);
    setEditForm(provider);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveProvider = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('payment_providers')
        .update({
          is_enabled: editForm.is_enabled,
          environment: editForm.environment,
          api_key: editForm.api_key,
          secret_key: editForm.secret_key,
          merchant_id: editForm.merchant_id,
          webhook_url: editForm.webhook_url,
          webhook_secret: editForm.webhook_secret,
        })
        .eq('id', editingId);

      if (error) throw error;

      await loadProviders();
      cancelEdit();
    } catch (error) {
      console.error('Error saving provider:', error);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const toggleEnabled = async (provider: PaymentProvider) => {
    try {
      const { error } = await supabase
        .from('payment_providers')
        .update({ is_enabled: !provider.is_enabled })
        .eq('id', provider.id);

      if (error) throw error;
      await loadProviders();
    } catch (error) {
      console.error('Error toggling provider:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-gray-400" />;
      case 'testing':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-darkgreen animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {providers.map((provider) => {
        const isEditing = editingId === provider.id;

        return (
          <div
            key={provider.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`
                    w-16 h-16 rounded-xl flex items-center justify-center
                    ${provider.is_enabled ? 'bg-green-100' : 'bg-gray-100'}
                  `}>
                    <CreditCard className={`w-8 h-8 ${provider.is_enabled ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{provider.provider_name_ar}</h3>
                    <p className="text-sm text-gray-600">{provider.provider_name_en}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusIcon(provider.connection_status)}
                      <span className="text-sm text-gray-600">
                        {provider.connection_status === 'connected' && 'متصل'}
                        {provider.connection_status === 'disconnected' && 'غير متصل'}
                        {provider.connection_status === 'testing' && 'جاري الاختبار'}
                        {provider.connection_status === 'error' && 'خطأ في الاتصال'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleEnabled(provider)}
                  className={`
                    px-4 py-2 rounded-lg font-semibold transition-all
                    ${provider.is_enabled
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }
                  `}
                >
                  {provider.is_enabled ? 'مفعّل' : 'معطّل'}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        البيئة
                      </label>
                      <select
                        value={editForm.environment}
                        onChange={(e) => setEditForm({ ...editForm, environment: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
                      >
                        <option value="sandbox">تجريبية (Sandbox)</option>
                        <option value="production">فعلية (Production)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Merchant ID
                      </label>
                      <input
                        type="text"
                        value={editForm.merchant_id || ''}
                        onChange={(e) => setEditForm({ ...editForm, merchant_id: e.target.value })}
                        placeholder="أدخل معرف التاجر"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showSecrets[provider.id] ? 'text' : 'password'}
                          value={editForm.api_key || ''}
                          onChange={(e) => setEditForm({ ...editForm, api_key: e.target.value })}
                          placeholder="أدخل مفتاح API"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecrets({ ...showSecrets, [provider.id]: !showSecrets[provider.id] })}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showSecrets[provider.id] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Secret Key
                      </label>
                      <div className="relative">
                        <input
                          type={showSecrets[provider.id] ? 'text' : 'password'}
                          value={editForm.secret_key || ''}
                          onChange={(e) => setEditForm({ ...editForm, secret_key: e.target.value })}
                          placeholder="أدخل المفتاح السري"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Webhook URL
                      </label>
                      <input
                        type="url"
                        value={editForm.webhook_url || ''}
                        onChange={(e) => setEditForm({ ...editForm, webhook_url: e.target.value })}
                        placeholder="https://example.com/webhook"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Webhook Secret
                      </label>
                      <input
                        type={showSecrets[provider.id] ? 'text' : 'password'}
                        value={editForm.webhook_secret || ''}
                        onChange={(e) => setEditForm({ ...editForm, webhook_secret: e.target.value })}
                        placeholder="أدخل سر Webhook"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={saveProvider}
                      className="flex items-center gap-2 px-6 py-2 bg-darkgreen text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      <Save className="w-5 h-5" />
                      حفظ
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => startEdit(provider)}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    تكوين البوابة
                  </button>
                  {provider.is_enabled && (
                    <button
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      <TestTube className="w-5 h-5" />
                      اختبار الاتصال
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className={`
              px-6 py-3 text-sm
              ${provider.environment === 'production' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}
            `}>
              <span className="font-semibold">البيئة الحالية:</span> {provider.environment === 'production' ? 'فعلية (Production)' : 'تجريبية (Sandbox)'}
            </div>
          </div>
        );
      })}

      {providers.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد بوابات دفع</h3>
          <p className="text-gray-600">لم يتم تكوين أي بوابات دفع بعد</p>
        </div>
      )}
    </div>
  );
};

export default PaymentProvidersManager;
