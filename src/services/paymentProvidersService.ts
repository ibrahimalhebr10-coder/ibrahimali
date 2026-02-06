import { supabase } from '../lib/supabase';

export interface PaymentProvider {
  id: string;
  provider_code: string;
  provider_name_ar: string;
  provider_name_en: string;
  provider_type: string;
  is_enabled: boolean;
  environment: 'sandbox' | 'production';
  connection_status: 'connected' | 'disconnected' | 'testing' | 'error';
  is_test_mode: boolean;
  display_order: number;
  logo_url: string | null;
  description_ar: string | null;
  description_en: string | null;
  min_amount: number | null;
  max_amount: number | null;
  processing_fee_percentage: number | null;
  processing_fee_fixed: number | null;
  settlement_days: number | null;
  supported_currencies: string[] | null;
  api_key: string | null;
  secret_key: string | null;
  merchant_id: string | null;
  webhook_url: string | null;
  webhook_secret: string | null;
  configuration: any;
  last_test_at: string | null;
  last_test_status: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ProviderStatistics {
  provider_code: string;
  provider_name_ar: string;
  is_enabled: boolean;
  connection_status: string;
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  total_amount: number;
  last_transaction_at: string | null;
}

export interface ProviderConfiguration {
  api_key?: string;
  secret_key?: string;
  merchant_id?: string;
  webhook_url?: string;
  webhook_secret?: string;
  environment?: 'sandbox' | 'production';
  custom_config?: Record<string, any>;
}

export const paymentProvidersService = {
  async getAllProviders() {
    const { data, error } = await supabase
      .from('payment_providers')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data as PaymentProvider[];
  },

  async getProvider(providerId: string) {
    const { data, error } = await supabase
      .from('payment_providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (error) throw error;
    return data as PaymentProvider;
  },

  async getProviderByCode(code: string) {
    const { data, error } = await supabase
      .from('payment_providers')
      .select('*')
      .eq('provider_code', code)
      .single();

    if (error) throw error;
    return data as PaymentProvider;
  },

  async getEnabledProviders() {
    const { data, error } = await supabase
      .from('payment_providers')
      .select('*')
      .eq('is_enabled', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data as PaymentProvider[];
  },

  async updateProvider(providerId: string, updates: Partial<PaymentProvider>) {
    const { data, error } = await supabase
      .from('payment_providers')
      .update(updates)
      .eq('id', providerId)
      .select()
      .single();

    if (error) throw error;
    return data as PaymentProvider;
  },

  async updateProviderConfiguration(providerId: string, config: ProviderConfiguration) {
    const updates: Partial<PaymentProvider> = {
      api_key: config.api_key,
      secret_key: config.secret_key,
      merchant_id: config.merchant_id,
      webhook_url: config.webhook_url,
      webhook_secret: config.webhook_secret,
      environment: config.environment,
    };

    if (config.custom_config) {
      updates.configuration = config.custom_config;
    }

    return this.updateProvider(providerId, updates);
  },

  async toggleProvider(providerId: string, enabled: boolean) {
    return this.updateProvider(providerId, { is_enabled: enabled });
  },

  async switchEnvironment(providerId: string, environment: 'sandbox' | 'production') {
    return this.updateProvider(providerId, {
      environment,
      connection_status: 'disconnected'
    });
  },

  async testConnection(providerId: string) {
    const { data, error } = await supabase
      .rpc('test_provider_connection', {
        p_provider_id: providerId
      });

    if (error) throw error;
    return data;
  },

  async updateConnectionStatus(
    providerId: string,
    status: 'connected' | 'disconnected' | 'error',
    testStatus?: string
  ) {
    const updates: Partial<PaymentProvider> = {
      connection_status: status,
      last_test_at: new Date().toISOString(),
      last_test_status: testStatus || status
    };

    return this.updateProvider(providerId, updates);
  },

  async getProviderStatistics() {
    const { data, error } = await supabase
      .rpc('get_providers_statistics');

    if (error) throw error;
    return data as ProviderStatistics[];
  },

  async getProviderTransactions(providerId: string, limit = 50) {
    const { data, error } = await supabase
      .from('payment_provider_transactions_log')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async logTransaction(
    providerId: string,
    transactionType: 'payment' | 'refund' | 'test',
    status: 'success' | 'failed' | 'pending',
    details: {
      amount?: number;
      currency?: string;
      externalId?: string;
      requestData?: any;
      responseData?: any;
      errorMessage?: string;
    }
  ) {
    const { data, error } = await supabase
      .from('payment_provider_transactions_log')
      .insert([{
        provider_id: providerId,
        transaction_type: transactionType,
        transaction_status: status,
        amount: details.amount,
        currency: details.currency || 'SAR',
        external_transaction_id: details.externalId,
        request_data: details.requestData || {},
        response_data: details.responseData || {},
        error_message: details.errorMessage
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async validateProviderConfig(provider: PaymentProvider): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (provider.provider_code === 'bank_transfer') {
      return { valid: true, errors: [] };
    }

    if (!provider.api_key || provider.api_key.trim() === '') {
      errors.push('مفتاح API مطلوب');
    }

    if (!provider.secret_key || provider.secret_key.trim() === '') {
      errors.push('المفتاح السري مطلوب');
    }

    if (provider.provider_code === 'mada' || provider.provider_code === 'visa_mastercard') {
      if (!provider.merchant_id || provider.merchant_id.trim() === '') {
        errors.push('معرف التاجر مطلوب');
      }
    }

    if (provider.provider_code === 'tamara' || provider.provider_code === 'tabby') {
      if (!provider.webhook_url || provider.webhook_url.trim() === '') {
        errors.push('رابط Webhook مطلوب');
      }
      if (!provider.webhook_secret || provider.webhook_secret.trim() === '') {
        errors.push('سر Webhook مطلوب');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  getProviderIcon(code: string): string {
    const icons: Record<string, string> = {
      mada: '💳',
      visa_mastercard: '💰',
      tamara: '🛍️',
      tabby: '📱',
      bank_transfer: '🏦'
    };
    return icons[code] || '💵';
  },

  getProviderColor(code: string): string {
    const colors: Record<string, string> = {
      mada: 'text-green-600',
      visa_mastercard: 'text-blue-600',
      tamara: 'text-purple-600',
      tabby: 'text-pink-600',
      bank_transfer: 'text-gray-600'
    };
    return colors[code] || 'text-gray-600';
  },

  getConnectionStatusColor(status: string): string {
    const colors: Record<string, string> = {
      connected: 'bg-green-100 text-green-800',
      disconnected: 'bg-gray-100 text-gray-800',
      testing: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  },

  getConnectionStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      connected: 'متصل',
      disconnected: 'غير متصل',
      testing: 'جاري الاختبار',
      error: 'خطأ في الاتصال'
    };
    return labels[status] || status;
  }
};
