import { supabase } from '../lib/supabase';

export interface PendingReservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  farm_name: string;
  path_type: 'agricultural' | 'investment';
  tree_count: number;
  total_price: number;
  created_at: string;
  payment_deadline: string;
  payment_reminder_count: number;
  last_follow_up_date: string | null;
  days_remaining: number;
  hours_remaining: number;
  urgency_level: 'critical' | 'urgent' | 'medium' | 'normal';
  last_activity: {
    type: string;
    result: string;
    notes: string;
    created_at: string;
  } | null;
}

export interface FollowUpStats {
  total_pending: number;
  total_amount: number;
  critical_count: number;
  new_today: number;
  agricultural_count: number;
  investment_count: number;
}

export interface FollowUpActivity {
  id: string;
  type: string;
  result: string;
  notes: string;
  created_at: string;
  admin_name: string;
}

export interface ReservationDetails {
  reservation: any;
  customer: any;
  farm: any;
  activities: FollowUpActivity[];
  reminders: any[];
}

export const followUpService = {
  /**
   * جلب إحصائيات الحجوزات المعلقة
   */
  async getStats(): Promise<FollowUpStats> {
    const { data, error } = await supabase.rpc('get_pending_payment_stats');

    if (error) {
      console.error('Error fetching pending payment stats:', error);
      throw error;
    }

    return data || {
      total_pending: 0,
      total_amount: 0,
      critical_count: 0,
      new_today: 0,
      agricultural_count: 0,
      investment_count: 0
    };
  },

  /**
   * جلب جميع الحجوزات المعلقة
   */
  async getPendingReservations(): Promise<PendingReservation[]> {
    const { data, error } = await supabase.rpc('get_pending_payment_reservations');

    if (error) {
      console.error('Error fetching pending reservations:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * جلب تفاصيل حجز معين مع سجل المتابعة
   */
  async getReservationDetails(reservationId: string): Promise<ReservationDetails | null> {
    const { data, error } = await supabase.rpc('get_pending_reservation_details', {
      p_reservation_id: reservationId
    });

    if (error) {
      console.error('Error fetching reservation details:', error);
      throw error;
    }

    return data;
  },

  /**
   * تسجيل نشاط متابعة
   */
  async logActivity(
    reservationId: string,
    activityType: 'phone_call' | 'whatsapp' | 'sms' | 'email' | 'manual_note',
    result: string,
    notes: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('log_follow_up_activity', {
      p_reservation_id: reservationId,
      p_activity_type: activityType,
      p_activity_result: result,
      p_notes: notes
    });

    if (error) {
      console.error('Error logging activity:', error);
      throw error;
    }

    return data;
  },

  /**
   * تمديد موعد الدفع
   */
  async extendDeadline(
    reservationId: string,
    extraDays: number,
    reason: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('extend_payment_deadline', {
      p_reservation_id: reservationId,
      p_extra_days: extraDays,
      p_reason: reason
    });

    if (error) {
      console.error('Error extending deadline:', error);
      throw error;
    }

    return data;
  },

  /**
   * إرسال تذكير فوري
   */
  async sendReminder(
    reservationId: string,
    message: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('send_immediate_reminder', {
      p_reservation_id: reservationId,
      p_message: message
    });

    if (error) {
      console.error('Error sending reminder:', error);
      throw error;
    }

    return data;
  },

  /**
   * إلغاء حجز
   */
  async cancelReservation(reservationId: string, reason: string): Promise<boolean> {
    // تسجيل النشاط أولاً
    await this.logActivity(
      reservationId,
      'manual_note',
      'cancelled',
      `تم إلغاء الحجز. السبب: ${reason}`
    );

    // تحديث حالة الحجز
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId);

    if (error) {
      console.error('Error cancelling reservation:', error);
      throw error;
    }

    return true;
  },

  /**
   * توليد رابط الدفع للعميل
   */
  generatePaymentLink(reservationId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/payment?reservation=${reservationId}`;
  },

  /**
   * الحصول على رسالة التذكير الافتراضية
   */
  getDefaultReminderMessage(
    customerName: string,
    daysRemaining: number,
    hoursRemaining: number,
    paymentLink: string
  ): string {
    if (hoursRemaining < 24) {
      return `عزيزي ${customerName}، تذكير عاجل: يتبقى ${hoursRemaining} ساعة فقط لإتمام دفع حجزك!\n\nأكمل الدفع الآن: ${paymentLink}`;
    } else if (daysRemaining <= 1) {
      return `عزيزي ${customerName}، يتبقى يوم واحد لإتمام دفع حجزك.\n\nأكمل الدفع الآن: ${paymentLink}`;
    } else if (daysRemaining <= 3) {
      return `عزيزي ${customerName}، لديك ${daysRemaining} أيام متبقية لإتمام دفع حجزك.\n\nرابط الدفع: ${paymentLink}`;
    } else {
      return `شكراً لحجزك معنا عزيزي ${customerName}! لديك ${daysRemaining} أيام لإتمام الدفع.\n\nرابط الدفع: ${paymentLink}`;
    }
  },

  /**
   * فلترة الحجوزات حسب مستوى الاستعجال
   */
  filterByUrgency(
    reservations: PendingReservation[],
    urgency: 'critical' | 'urgent' | 'medium' | 'normal' | 'all'
  ): PendingReservation[] {
    if (urgency === 'all') return reservations;
    return reservations.filter(r => r.urgency_level === urgency);
  },

  /**
   * فلترة الحجوزات حسب نوع المسار
   */
  filterByPathType(
    reservations: PendingReservation[],
    pathType: 'agricultural' | 'investment' | 'all'
  ): PendingReservation[] {
    if (pathType === 'all') return reservations;
    return reservations.filter(r => r.path_type === pathType);
  },

  /**
   * البحث في الحجوزات
   */
  searchReservations(
    reservations: PendingReservation[],
    searchTerm: string
  ): PendingReservation[] {
    if (!searchTerm.trim()) return reservations;

    const term = searchTerm.toLowerCase();
    return reservations.filter(r =>
      r.customer_name?.toLowerCase().includes(term) ||
      r.customer_phone?.includes(term) ||
      r.customer_email?.toLowerCase().includes(term) ||
      r.farm_name?.toLowerCase().includes(term)
    );
  },

  /**
   * الحصول على لون حسب مستوى الاستعجال
   */
  getUrgencyColor(urgency: string): string {
    switch (urgency) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'urgent':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-green-600 bg-green-50';
    }
  },

  /**
   * الحصول على نص حسب مستوى الاستعجال
   */
  getUrgencyText(urgency: string): string {
    switch (urgency) {
      case 'critical':
        return 'حرج جداً';
      case 'urgent':
        return 'عاجل';
      case 'medium':
        return 'متوسط';
      default:
        return 'عادي';
    }
  },

  /**
   * تنسيق الوقت المتبقي
   */
  formatTimeRemaining(daysRemaining: number, hoursRemaining: number): string {
    if (daysRemaining > 0) {
      return `${daysRemaining} ${daysRemaining === 1 ? 'يوم' : 'أيام'}`;
    } else if (hoursRemaining > 0) {
      return `${hoursRemaining} ${hoursRemaining === 1 ? 'ساعة' : 'ساعات'}`;
    } else {
      return 'انتهى الوقت';
    }
  }
};
