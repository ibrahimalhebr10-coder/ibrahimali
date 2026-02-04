import { supabase } from '../lib/supabase';

export interface MaintenancePaymentRecord {
  payment_id: string;
  trees_count: number;
  cost_per_tree: number;
  total_amount: number;
}

export interface PaymentStatus {
  has_payment: boolean;
  payment_id?: string;
  status?: string;
  amount_due?: number;
  amount_paid?: number;
  payment_date?: string;
  transaction_id?: string;
}

export interface PaymentStats {
  total_clients: number;
  paid_count: number;
  pending_count: number;
  unpaid_count: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_percentage: number;
  collection_percentage: number;
}

export interface PaymentResult {
  success: boolean;
  payment_id: string;
  paid_at: string;
  amount_paid: number;
  transaction_id?: string;
  already_paid?: boolean;
}

export const maintenancePaymentService = {
  async createPaymentRecord(
    maintenanceFeeId: string,
    userId: string
  ): Promise<MaintenancePaymentRecord> {
    const { data, error } = await supabase.rpc('create_maintenance_payment_record', {
      p_maintenance_fee_id: maintenanceFeeId,
      p_user_id: userId
    });

    if (error) {
      console.error('Error creating payment record:', error);
      throw new Error(error.message || 'فشل في إنشاء سجل الدفع');
    }

    return data as MaintenancePaymentRecord;
  },

  async checkPaymentStatus(
    maintenanceFeeId: string,
    userId: string
  ): Promise<PaymentStatus> {
    const { data, error } = await supabase.rpc('check_maintenance_payment_status', {
      p_maintenance_fee_id: maintenanceFeeId,
      p_user_id: userId
    });

    if (error) {
      console.error('Error checking payment status:', error);
      throw new Error(error.message || 'فشل في التحقق من حالة الدفع');
    }

    return data as PaymentStatus;
  },

  async completePayment(
    paymentId: string,
    transactionId: string,
    amountPaid?: number,
    paymentMethod?: string,
    gatewayResponse?: any
  ): Promise<PaymentResult> {
    const { data, error } = await supabase.rpc('complete_maintenance_payment', {
      p_payment_id: paymentId,
      p_transaction_id: transactionId,
      p_amount_paid: amountPaid,
      p_payment_method: paymentMethod,
      p_gateway_response: gatewayResponse
    });

    if (error) {
      console.error('Error completing payment:', error);
      throw new Error(error.message || 'فشل في إتمام الدفع');
    }

    return data as PaymentResult;
  },

  async getPaymentStats(maintenanceFeeId: string): Promise<PaymentStats> {
    const { data, error } = await supabase.rpc('get_maintenance_payment_stats', {
      p_maintenance_fee_id: maintenanceFeeId
    });

    if (error) {
      console.error('Error getting payment stats:', error);
      throw new Error(error.message || 'فشل في الحصول على إحصائيات السداد');
    }

    return data as PaymentStats;
  },

  async initiatePayment(
    maintenanceFeeId: string,
    userId: string,
    useSimulation: boolean = true
  ): Promise<{
    paymentId: string;
    paymentUrl: string;
    amount: number;
  }> {
    const paymentRecord = await this.createPaymentRecord(maintenanceFeeId, userId);

    let paymentUrl: string;

    if (useSimulation) {
      const transactionId = `SIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      paymentUrl = `${window.location.origin}?payment_id=${paymentRecord.payment_id}&status=success&transaction_id=${transactionId}`;
    } else {
      const returnUrl = `${window.location.origin}?payment_id=${paymentRecord.payment_id}`;
      const cancelUrl = `${window.location.origin}`;
      paymentUrl = `/api/payment/initiate?payment_id=${paymentRecord.payment_id}&amount=${paymentRecord.total_amount}&return_url=${encodeURIComponent(returnUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;
    }

    return {
      paymentId: paymentRecord.payment_id,
      paymentUrl: paymentUrl,
      amount: paymentRecord.total_amount
    };
  },

  async simulatePaymentSuccess(
    paymentId: string,
    amount: number
  ): Promise<PaymentResult> {
    const transactionId = `SIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return await this.completePayment(
      paymentId,
      transactionId,
      amount,
      'simulation',
      {
        simulated: true,
        timestamp: new Date().toISOString(),
        status: 'success'
      }
    );
  },

  async getUserPayments(userId: string) {
    const { data, error } = await supabase
      .from('maintenance_payments')
      .select(`
        *,
        maintenance_fees:maintenance_fee_id (
          id,
          cost_per_tree,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user payments:', error);
      throw new Error(error.message || 'فشل في الحصول على سجلات الدفع');
    }

    return data;
  },

  async getPaymentById(paymentId: string) {
    const { data, error } = await supabase
      .from('maintenance_payments')
      .select(`
        *,
        maintenance_fees:maintenance_fee_id (
          id,
          cost_per_tree
        )
      `)
      .eq('id', paymentId)
      .maybeSingle();

    if (error) {
      console.error('Error getting payment:', error);
      throw new Error(error.message || 'فشل في الحصول على بيانات الدفع');
    }

    if (!data) {
      throw new Error('سجل الدفع غير موجود');
    }

    return data;
  }
};
