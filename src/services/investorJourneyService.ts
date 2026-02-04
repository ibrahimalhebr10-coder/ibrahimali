import { supabase } from '../lib/supabase';

export type InvestorJourneyStatus =
  | 'no_reservation'
  | 'pending'
  | 'waiting_for_payment'
  | 'payment_submitted'
  | 'paid'
  | 'transferred_to_harvest'
  | 'cancelled';

export interface InvestorReservation {
  id: string;
  user_id: string;
  farm_id: number;
  farm_name: string;
  contract_name: string;
  duration_years: number;
  bonus_years: number;
  total_trees: number;
  total_price: number;
  status: string;
  tree_details: Array<{
    variety_name: string;
    type_name: string;
    quantity: number;
    price_per_tree: number;
  }>;
  created_at: string;
  updated_at: string;
  payment_receipts?: Array<{
    id: string;
    status: string;
    created_at: string;
    payment_method: string;
    review_notes?: string;
  }>;
}

export interface InvestorJourneyState {
  status: InvestorJourneyStatus;
  reservation: InvestorReservation | null;
  latestReceipt: any | null;
  canProceed: boolean;
  nextAction: string;
  message: string;
}

class InvestorJourneyService {
  async getInvestorState(userId: string): Promise<InvestorJourneyState> {
    try {
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          *,
          payment_receipts (
            id,
            status,
            payment_method,
            created_at,
            review_notes
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!reservations || reservations.length === 0) {
        return {
          status: 'no_reservation',
          reservation: null,
          latestReceipt: null,
          canProceed: true,
          nextAction: 'create_reservation',
          message: 'لا يوجد لديك حجز بعد. ابدأ رحلتك الاستثمارية الآن!'
        };
      }

      const reservation = reservations[0] as InvestorReservation;
      const receipts = reservation.payment_receipts || [];
      const latestReceipt = receipts.length > 0 ? receipts[0] : null;

      return this.determineState(reservation, latestReceipt);
    } catch (error) {
      console.error('Error getting investor state:', error);
      throw error;
    }
  }

  private determineState(
    reservation: InvestorReservation,
    latestReceipt: any
  ): InvestorJourneyState {
    const status = reservation.status as string;

    switch (status) {
      case 'pending':
        return {
          status: 'pending',
          reservation,
          latestReceipt,
          canProceed: false,
          nextAction: 'wait_approval',
          message: 'تم حجز مزرعتك بنجاح - أشجارك محفوظة باسمك'
        };

      case 'waiting_for_payment':
        return {
          status: 'waiting_for_payment',
          reservation,
          latestReceipt,
          canProceed: true,
          nextAction: 'proceed_to_payment',
          message: 'تم اعتماد حجزك! الآن يمكنك إتمام عملية السداد'
        };

      case 'payment_submitted':
        return {
          status: 'payment_submitted',
          reservation,
          latestReceipt,
          canProceed: false,
          nextAction: 'wait_receipt_review',
          message: 'تم رفع إيصال السداد وهو قيد المراجعة'
        };

      case 'paid':
        return {
          status: 'paid',
          reservation,
          latestReceipt,
          canProceed: false,
          nextAction: 'wait_harvest_transfer',
          message: 'تم تأكيد سدادك بنجاح! جاري نقل أشجارك إلى مزرعتي'
        };

      case 'transferred_to_harvest':
        return {
          status: 'transferred_to_harvest',
          reservation,
          latestReceipt,
          canProceed: true,
          nextAction: 'view_harvest',
          message: 'مبروك! أشجارك الآن في مزرعتي ويمكنك متابعتها'
        };

      case 'cancelled':
        return {
          status: 'cancelled',
          reservation,
          latestReceipt,
          canProceed: true,
          nextAction: 'create_new_reservation',
          message: 'تم إلغاء هذا الحجز. يمكنك إنشاء حجز جديد'
        };

      default:
        return {
          status: 'no_reservation',
          reservation: null,
          latestReceipt: null,
          canProceed: true,
          nextAction: 'create_reservation',
          message: 'حالة غير معروفة'
        };
    }
  }

  async getUserReservations(userId: string): Promise<InvestorReservation[]> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          payment_receipts (
            id,
            status,
            payment_method,
            created_at,
            review_notes
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InvestorReservation[];
    } catch (error) {
      console.error('Error getting user reservations:', error);
      throw error;
    }
  }

  async getReservationDetails(reservationId: string): Promise<InvestorReservation | null> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          payment_receipts (
            id,
            status,
            payment_method,
            created_at,
            review_notes
          )
        `)
        .eq('id', reservationId)
        .maybeSingle();

      if (error) throw error;
      return data as InvestorReservation;
    } catch (error) {
      console.error('Error getting reservation details:', error);
      throw error;
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      no_reservation: 'لا يوجد حجز',
      pending: 'قيد المراجعة',
      waiting_for_payment: 'بانتظار السداد',
      payment_submitted: 'تم رفع الإيصال',
      paid: 'مدفوع',
      transferred_to_harvest: 'في مزرعتي',
      cancelled: 'ملغي'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): { bg: string; text: string; border: string } {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      no_reservation: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
      pending: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
      waiting_for_payment: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
      payment_submitted: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
      transferred_to_harvest: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
    };
    return colors[status] || colors.no_reservation;
  }
}

export const investorJourneyService = new InvestorJourneyService();
