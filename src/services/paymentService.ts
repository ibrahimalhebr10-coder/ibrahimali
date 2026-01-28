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

export interface PaymentReceipt {
  id: string;
  reservation_id: string;
  user_id: string;
  payment_method_id: string;
  amount: number;
  receipt_file_path: string;
  receipt_file_type: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  review_notes?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadReceiptData {
  reservation_id: string;
  payment_method_id: string;
  amount: number;
  file: File;
  notes?: string;
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
  },

  async confirmPayment(paymentId: string, transactionId: string) {
    const payment = await this.getPaymentById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.payment_status === 'paid') {
      throw new Error('Payment already confirmed');
    }

    const updatedPayment = await this.updatePaymentStatus(
      paymentId,
      'paid',
      transactionId,
      { confirmed_at: new Date().toISOString() }
    );

    const { error: reservationError } = await supabase
      .from('reservations')
      .update({ status: 'paid' })
      .eq('id', payment.reservation_id);

    if (reservationError) {
      console.error('Error updating reservation status:', reservationError);
      throw new Error('Failed to update reservation status');
    }

    return updatedPayment;
  },

  async markPaymentAsFailed(paymentId: string, reason?: string) {
    const payment = await this.getPaymentById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.payment_status === 'paid') {
      throw new Error('Cannot mark paid payment as failed');
    }

    const updatedPayment = await this.updatePaymentStatus(
      paymentId,
      'failed',
      undefined,
      { failed_at: new Date().toISOString(), failure_reason: reason || 'Unknown' }
    );

    return updatedPayment;
  },

  async uploadReceipt(data: UploadReceiptData): Promise<PaymentReceipt> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('المستخدم غير مسجل');
    }

    const fileExt = data.file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('payment-receipts')
      .upload(fileName, data.file, {
        contentType: data.file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('فشل رفع الملف');
    }

    const { data: receipt, error: insertError } = await supabase
      .from('payment_receipts')
      .insert({
        reservation_id: data.reservation_id,
        user_id: user.id,
        payment_method_id: data.payment_method_id,
        amount: data.amount,
        receipt_file_path: fileName,
        receipt_file_type: data.file.type,
        notes: data.notes || null,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      await supabase.storage.from('payment-receipts').remove([fileName]);
      throw new Error('فشل حفظ بيانات الإيصال');
    }

    return receipt as PaymentReceipt;
  },

  async getReceiptsByReservation(reservationId: string): Promise<PaymentReceipt[]> {
    const { data, error } = await supabase
      .from('payment_receipts')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PaymentReceipt[];
  },

  async getReceiptById(receiptId: string): Promise<PaymentReceipt | null> {
    const { data, error } = await supabase
      .from('payment_receipts')
      .select('*')
      .eq('id', receiptId)
      .maybeSingle();

    if (error) throw error;
    return data as PaymentReceipt | null;
  },

  async getReceiptFileUrl(filePath: string): Promise<string> {
    const { data } = await supabase.storage
      .from('payment-receipts')
      .createSignedUrl(filePath, 3600);

    if (!data?.signedUrl) {
      throw new Error('فشل الحصول على رابط الملف');
    }

    return data.signedUrl;
  },

  async deleteReceipt(receiptId: string): Promise<void> {
    const receipt = await this.getReceiptById(receiptId);
    if (!receipt) {
      throw new Error('الإيصال غير موجود');
    }

    if (receipt.status !== 'pending') {
      throw new Error('لا يمكن حذف إيصال تمت مراجعته');
    }

    await supabase.storage
      .from('payment-receipts')
      .remove([receipt.receipt_file_path]);

    const { error } = await supabase
      .from('payment_receipts')
      .delete()
      .eq('id', receiptId);

    if (error) throw error;
  },

  async reviewReceipt(
    receiptId: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string
  ): Promise<PaymentReceipt> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('المستخدم غير مسجل');
    }

    const { data, error } = await supabase
      .from('payment_receipts')
      .update({
        status,
        review_notes: reviewNotes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      })
      .eq('id', receiptId)
      .select()
      .single();

    if (error) throw error;
    return data as PaymentReceipt;
  },

  async getAllReceipts(): Promise<PaymentReceipt[]> {
    const { data, error } = await supabase
      .from('payment_receipts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PaymentReceipt[];
  },

  async getReceiptsByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<PaymentReceipt[]> {
    const { data, error } = await supabase
      .from('payment_receipts')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PaymentReceipt[];
  }
};
