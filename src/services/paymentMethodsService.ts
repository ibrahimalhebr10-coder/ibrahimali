import { supabase } from '../lib/supabase';

export type PaymentMethodType = 'mada' | 'tabby' | 'tamara' | 'bank_transfer';

export interface PaymentMethod {
  id: string;
  method_type: PaymentMethodType;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en?: string;
  is_active: boolean;
  priority: number;
  config: Record<string, any>;
  icon?: string;
  features: string[];
  requirements: string[];
  created_at: string;
  updated_at: string;
}

export interface UpdatePaymentMethodData {
  name_ar?: string;
  name_en?: string;
  description_ar?: string;
  description_en?: string;
  is_active?: boolean;
  priority?: number;
  config?: Record<string, any>;
  icon?: string;
  features?: string[];
  requirements?: string[];
}

class PaymentMethodsService {
  async getAllMethods(): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }

    return data || [];
  }

  async getActiveMethods(): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching active payment methods:', error);
      throw error;
    }

    return data || [];
  }

  async getMethodById(id: string): Promise<PaymentMethod | null> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching payment method:', error);
      throw error;
    }

    return data;
  }

  async getMethodByType(methodType: PaymentMethodType): Promise<PaymentMethod | null> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('method_type', methodType)
      .maybeSingle();

    if (error) {
      console.error('Error fetching payment method by type:', error);
      throw error;
    }

    return data;
  }

  async updateMethod(id: string, updates: UpdatePaymentMethodData): Promise<PaymentMethod> {
    const { data, error } = await supabase
      .from('payment_methods')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment method:', error);
      throw error;
    }

    return data;
  }

  async toggleMethodStatus(id: string, isActive: boolean): Promise<PaymentMethod> {
    return this.updateMethod(id, { is_active: isActive });
  }

  async updateMethodConfig(id: string, config: Record<string, any>): Promise<PaymentMethod> {
    return this.updateMethod(id, { config });
  }

  async updateMethodPriority(id: string, priority: number): Promise<PaymentMethod> {
    return this.updateMethod(id, { priority });
  }

  async updateGatewayConfig(id: string, gatewayConfig: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('payment_methods')
      .update({ gateway_config: gatewayConfig })
      .eq('id', id);

    if (error) {
      console.error('Error updating gateway config:', error);
      throw error;
    }
  }

  async isMethodAvailable(methodType: PaymentMethodType): Promise<boolean> {
    const method = await this.getMethodByType(methodType);
    return method?.is_active || false;
  }

  async getAvailableMethodsForInvestor(): Promise<PaymentMethod[]> {
    return this.getActiveMethods();
  }

  async validateMethodConfig(methodType: PaymentMethodType, config: Record<string, any>): Promise<{
    isValid: boolean;
    missingFields: string[];
  }> {
    const requiredFields: Record<PaymentMethodType, string[]> = {
      mada: ['provider', 'merchant_id', 'api_key'],
      tabby: ['merchant_code', 'public_key', 'secret_key'],
      tamara: ['merchant_url', 'api_token', 'notification_key'],
      bank_transfer: ['bank_name', 'account_name', 'account_number', 'iban']
    };

    const required = requiredFields[methodType] || [];
    const missingFields = required.filter(field => !config[field] || config[field] === '');

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  async getMethodStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<PaymentMethodType, { name: string; active: boolean }>;
  }> {
    const methods = await this.getAllMethods();

    const stats = {
      total: methods.length,
      active: methods.filter(m => m.is_active).length,
      inactive: methods.filter(m => !m.is_active).length,
      byType: {} as Record<PaymentMethodType, { name: string; active: boolean }>
    };

    methods.forEach(method => {
      stats.byType[method.method_type] = {
        name: method.name_ar,
        active: method.is_active
      };
    });

    return stats;
  }
}

export const paymentMethodsService = new PaymentMethodsService();
