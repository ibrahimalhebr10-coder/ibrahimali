import { supabase } from '../lib/supabase';

export interface Payment {
  id: string;
  reservation_id: string;
  user_id: string;
  farm_id: number;
  farm_name: string;
  amount: number;
  payment_method: 'mada' | 'tabby' | 'tamara';
  payment_status: 'waiting_for_payment' | 'paid' | 'failed' | 'refunded';
  transaction_id: string | null;
  payment_date: string | null;
  gateway_response: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentData {
  reservation_id: string;
  user_id: string;
  farm_id: number;
  farm_name: string;
  amount: number;
  payment_method: 'mada' | 'tabby' | 'tamara';
  metadata?: Record<string, any>;
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  waitingForPayment: number;
  paidCount: number;
  failedCount: number;
  refundedCount: number;
  madaCount: number;
  tabbyCount: number;
  tamaraCount: number;
}

export const paymentService = {
  async getAllPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Payment[];
  },

  async getPaymentById(id: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as Payment | null;
  },

  async getPaymentsByReservation(reservationId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Payment[];
  },

  async getPaymentsByUser(userId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Payment[];
  },

  async getPaymentsByFarm(farmId: number) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Payment[];
  },

  async getPaymentsByStatus(status: Payment['payment_status']) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Payment[];
  },

  async createPayment(paymentData: CreatePaymentData) {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        ...paymentData,
        payment_status: 'waiting_for_payment',
        gateway_response: {},
        metadata: paymentData.metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data as Payment;
  },

  async updatePaymentStatus(
    paymentId: string,
    status: Payment['payment_status'],
    transactionId?: string,
    gatewayResponse?: Record<string, any>
  ) {
    const updateData: any = {
      payment_status: status
    };

    if (status === 'paid') {
      updateData.payment_date = new Date().toISOString();
    }

    if (transactionId) {
      updateData.transaction_id = transactionId;
    }

    if (gatewayResponse) {
      updateData.gateway_response = gatewayResponse;
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return data as Payment;
  },

  async getPaymentStats(): Promise<PaymentStats> {
    const { data, error } = await supabase
      .from('payments')
      .select('payment_status, payment_method, amount');

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        totalPayments: 0,
        totalAmount: 0,
        waitingForPayment: 0,
        paidCount: 0,
        failedCount: 0,
        refundedCount: 0,
        madaCount: 0,
        tabbyCount: 0,
        tamaraCount: 0
      };
    }

    const stats: PaymentStats = {
      totalPayments: data.length,
      totalAmount: data.reduce((sum, p) => sum + Number(p.amount), 0),
      waitingForPayment: data.filter((p) => p.payment_status === 'waiting_for_payment').length,
      paidCount: data.filter((p) => p.payment_status === 'paid').length,
      failedCount: data.filter((p) => p.payment_status === 'failed').length,
      refundedCount: data.filter((p) => p.payment_status === 'refunded').length,
      madaCount: data.filter((p) => p.payment_method === 'mada').length,
      tabbyCount: data.filter((p) => p.payment_method === 'tabby').length,
      tamaraCount: data.filter((p) => p.payment_method === 'tamara').length
    };

    return stats;
  },

  async searchPayments(searchTerm: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .or(`farm_name.ilike.%${searchTerm}%,transaction_id.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Payment[];
  }
};
