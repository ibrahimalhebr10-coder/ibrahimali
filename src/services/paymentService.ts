import { supabase } from '../lib/supabase';

export type PaymentMethod = 'card' | 'apple_pay';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  reservation_id?: string;
  user_id: string;
  amount: number;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_token?: string;
  gateway_reference?: string;
  gateway_response?: any;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreatePaymentParams {
  reservationId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

export const paymentService = {
  async createPayment(params: CreatePaymentParams): Promise<Payment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('payments')
      .insert([{
        reservation_id: params.reservationId,
        user_id: user.id,
        amount: params.amount,
        status: 'pending' as PaymentStatus,
        payment_method: params.paymentMethod
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async processPayment(
    paymentId: string,
    paymentToken: string,
    gatewayReference: string
  ): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'processing' as PaymentStatus,
        payment_token: paymentToken,
        gateway_reference: gatewayReference
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async completePayment(
    paymentId: string,
    gatewayResponse?: any
  ): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'completed' as PaymentStatus,
        gateway_response: gatewayResponse,
        completed_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async failPayment(
    paymentId: string,
    failureReason: string
  ): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'failed' as PaymentStatus,
        failure_reason: failureReason
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserPayments(): Promise<Payment[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPaymentByReservation(reservationId: string): Promise<Payment | null> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  isApplePayAvailable(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);

    return (isIOS || isSafari) && 'ApplePaySession' in window;
  },

  getPaymentMethodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      card: 'بطاقة مصرفية',
      apple_pay: 'Apple Pay'
    };
    return labels[method];
  },

  getPaymentStatusLabel(status: PaymentStatus): string {
    const labels: Record<PaymentStatus, string> = {
      pending: 'قيد الانتظار',
      processing: 'جاري المعالجة',
      completed: 'مكتمل',
      failed: 'فشل',
      refunded: 'مسترد'
    };
    return labels[status];
  },

  async getActivePaymentProviders(): Promise<any[]> {
    const { data, error } = await supabase
      .from('payment_providers')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};
