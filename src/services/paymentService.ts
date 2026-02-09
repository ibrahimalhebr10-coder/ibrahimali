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
    console.log('🆕 [paymentService] createPayment called');
    console.log('🆕 [paymentService] Params:', params);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ [paymentService] User not authenticated');
      throw new Error('User not authenticated');
    }

    console.log('👤 [paymentService] User ID:', user.id);

    const paymentData = {
      reservation_id: params.reservationId,
      user_id: user.id,
      amount: params.amount,
      status: 'pending' as PaymentStatus,
      payment_method: params.paymentMethod
    };

    console.log('📝 [paymentService] Inserting payment:', paymentData);

    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (error) {
      console.error('❌ [paymentService] createPayment error:', error);
      throw error;
    }

    console.log('✅ [paymentService] createPayment success:', data);
    return data;
  },

  async processPayment(
    paymentId: string,
    paymentToken: string,
    gatewayReference: string
  ): Promise<Payment> {
    console.log('🔄 [paymentService] processPayment called');
    console.log('🔄 [paymentService] Payment ID:', paymentId);
    console.log('🔄 [paymentService] Token:', paymentToken);
    console.log('🔄 [paymentService] Reference:', gatewayReference);

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

    if (error) {
      console.error('❌ [paymentService] processPayment error:', error);
      throw error;
    }

    console.log('✅ [paymentService] processPayment success:', data);
    return data;
  },

  async completePayment(
    paymentId: string,
    gatewayResponse?: any
  ): Promise<Payment> {
    console.log('✨ [paymentService] completePayment called');
    console.log('✨ [paymentService] Payment ID:', paymentId);

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

    if (error) {
      console.error('❌ [paymentService] completePayment error:', error);
      throw error;
    }

    console.log('🎉 [paymentService] completePayment success:', data);

    // تحديث حالة الحجز إلى confirmed
    if (data.reservation_id) {
      console.log('📝 [paymentService] Updating reservation status to confirmed...');

      const { data: reservationData, error: reservationError } = await supabase
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', data.reservation_id)
        .select('id, tree_count, influencer_code')
        .single();

      if (reservationError) {
        console.error('❌ [paymentService] Error updating reservation:', reservationError);
      } else {
        console.log('✅ [paymentService] Reservation updated successfully');

        // تحديث إحصائيات المؤثر إذا كان هناك كود مؤثر
        if (reservationData.influencer_code) {
          console.log('🎯 [paymentService] Influencer code found:', reservationData.influencer_code);
          console.log('🎯 [paymentService] Updating influencer stats...');

          try {
            const { data: influencerResult, error: influencerError } = await supabase
              .rpc('update_influencer_stats_after_payment', {
                p_influencer_code: reservationData.influencer_code,
                p_trees_count: reservationData.tree_count,
                p_reservation_id: reservationData.id
              });

            if (influencerError) {
              console.error('❌ [paymentService] Error updating influencer stats:', influencerError);
            } else {
              console.log('🎉 [paymentService] Influencer stats updated successfully:', influencerResult);

              // إرسال إشعار للمؤثر
              if (influencerResult && influencerResult.success) {
                console.log('🔔 [paymentService] New rewards earned:', influencerResult.new_rewards_earned);

                // إذا كسب مكافآت جديدة، أرسل إشعاراً
                if (influencerResult.new_rewards_earned > 0) {
                  console.log('🎊 [paymentService] Partner earned new rewards! Sending notification...');

                  // يمكن إرسال notification هنا إذا كان هناك نظام إشعارات
                  if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('🎉 مكافأة جديدة!', {
                      body: `تهانينا! لقد كسبت ${influencerResult.new_rewards_earned} شجرة مكافأة جديدة`,
                      icon: '/logo.png'
                    });
                  }
                }
              }
            }
          } catch (influencerError) {
            console.error('❌ [paymentService] Exception updating influencer stats:', influencerError);
          }
        } else {
          console.log('ℹ️ [paymentService] No influencer code in reservation');
        }
      }
    }

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
