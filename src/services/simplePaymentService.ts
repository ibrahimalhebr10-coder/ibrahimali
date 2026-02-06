import { supabase } from '../lib/supabase';

export interface PaymentRecord {
  id: string;
  reservationId: string;
  userId: string | null;
  amount: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  referenceNumber?: string;
  notes?: string;
  receiptUrl?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentData {
  reservationId: string;
  userId: string | null;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

class SimplePaymentService {
  async createPaymentRecord(data: CreatePaymentData): Promise<PaymentRecord | null> {
    try {
      const { data: payment, error } = await supabase
        .from('payment_records')
        .insert({
          reservation_id: data.reservationId,
          user_id: data.userId,
          amount: data.amount,
          payment_method: data.paymentMethod,
          reference_number: data.referenceNumber,
          notes: data.notes,
          payment_status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating payment record:', error);
        return null;
      }

      return this.mapPaymentRecord(payment);
    } catch (error) {
      console.error('Error in createPaymentRecord:', error);
      return null;
    }
  }

  async updatePaymentStatus(
    paymentId: string,
    status: 'pending' | 'completed' | 'failed' | 'refunded',
    paidAt?: string
  ): Promise<boolean> {
    try {
      const updateData: any = { payment_status: status };

      if (paidAt) {
        updateData.paid_at = paidAt;
      }

      const { error } = await supabase
        .from('payment_records')
        .update(updateData)
        .eq('id', paymentId);

      if (error) {
        console.error('Error updating payment status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updatePaymentStatus:', error);
      return false;
    }
  }

  async getPaymentByReservation(reservationId: string): Promise<PaymentRecord | null> {
    try {
      const { data, error } = await supabase
        .from('payment_records')
        .select('*')
        .eq('reservation_id', reservationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return this.mapPaymentRecord(data);
    } catch (error) {
      console.error('Error in getPaymentByReservation:', error);
      return null;
    }
  }

  async getUserPayments(userId: string): Promise<PaymentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('payment_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user payments:', error);
        return [];
      }

      return data ? data.map(this.mapPaymentRecord) : [];
    } catch (error) {
      console.error('Error in getUserPayments:', error);
      return [];
    }
  }

  private mapPaymentRecord(data: any): PaymentRecord {
    return {
      id: data.id,
      reservationId: data.reservation_id,
      userId: data.user_id,
      amount: parseFloat(data.amount),
      paymentMethod: data.payment_method,
      paymentStatus: data.payment_status,
      referenceNumber: data.reference_number,
      notes: data.notes,
      receiptUrl: data.receipt_url,
      paidAt: data.paid_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

export const simplePaymentService = new SimplePaymentService();
