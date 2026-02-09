import { supabase } from '../lib/supabase';

export interface FarmFollowUpStats {
  farm_id: string;
  farm_name: string;
  farm_category: string;
  farm_status: string;
  total_trees: number;
  reserved_trees: number;
  remaining_trees: number;
  pending_reservations_count: number;
  pending_amount: number;
  confirmed_reservations_count: number;
  confirmed_amount: number;
  critical_reservations_count: number;
  urgent_reservations_count: number;
  total_follow_ups: number;
  last_reservation_date: string | null;
  is_open_for_booking: boolean;
  default_payment_mode: 'flexible' | 'immediate';
}

export interface FarmReservationDetail {
  reservation_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  path_type: 'agricultural' | 'investment';
  trees_count: number;
  total_amount: number;
  status: string;
  created_at: string;
  payment_deadline: string;
  hours_remaining: number;
  urgency_level: 'overdue' | 'critical' | 'urgent' | 'medium' | 'normal';
  flexible_payment_enabled: boolean;
  payment_reminder_count: number;
  follow_up_count: number;
  last_activity_type: string | null;
  last_activity_date: string | null;
}

export interface QuickStats {
  total_farms_with_pending: number;
  total_pending_reservations: number;
  total_pending_amount: number;
  critical_farms_count: number;
  urgent_farms_count: number;
  farms_nearly_full: number;
}

class FarmFollowUpService {
  // احصائيات جميع المزارع
  async getFarmsStats(): Promise<FarmFollowUpStats[]> {
    const { data, error } = await supabase.rpc('get_farms_follow_up_stats');

    if (error) {
      console.error('Error fetching farms follow-up stats:', error);
      throw error;
    }

    return data || [];
  }

  // تفاصيل حجوزات مزرعة معينة
  async getFarmReservations(farmId: string): Promise<FarmReservationDetail[]> {
    const { data, error } = await supabase.rpc('get_farm_reservations_details', {
      p_farm_id: farmId
    });

    if (error) {
      console.error('Error fetching farm reservations:', error);
      throw error;
    }

    return data || [];
  }

  // تبديل وضع الدفع لجميع حجوزات مزرعة
  async toggleFarmPaymentMode(
    farmId: string,
    enableFlexible: boolean,
    paymentDays: number = 7,
    adminNote: string = ''
  ): Promise<{
    success: boolean;
    message: string;
    affected_count?: number;
    farm_name?: string;
    new_mode?: string;
  }> {
    const { data, error } = await supabase.rpc('toggle_farm_payment_mode', {
      p_farm_id: farmId,
      p_enable_flexible: enableFlexible,
      p_payment_days: paymentDays,
      p_admin_note: adminNote
    });

    if (error) {
      console.error('Error toggling farm payment mode:', error);
      throw error;
    }

    return data as any;
  }

  // احصائيات سريعة
  async getQuickStats(): Promise<QuickStats> {
    const { data, error } = await supabase.rpc('get_follow_up_quick_stats');

    if (error) {
      console.error('Error fetching quick stats:', error);
      throw error;
    }

    return data as QuickStats;
  }

  // الفلترة حسب الحالة
  filterByUrgency(farms: FarmFollowUpStats[], urgencyFilter: string): FarmFollowUpStats[] {
    if (urgencyFilter === 'all') return farms;

    if (urgencyFilter === 'critical') {
      return farms.filter(f => f.critical_reservations_count > 0);
    }

    if (urgencyFilter === 'urgent') {
      return farms.filter(f => f.urgent_reservations_count > 0);
    }

    if (urgencyFilter === 'nearly_full') {
      return farms.filter(f => {
        const percentage = (f.reserved_trees / f.total_trees) * 100;
        return percentage >= 90;
      });
    }

    if (urgencyFilter === 'has_pending') {
      return farms.filter(f => f.pending_reservations_count > 0);
    }

    return farms;
  }

  // البحث في المزارع
  searchFarms(farms: FarmFollowUpStats[], searchTerm: string): FarmFollowUpStats[] {
    if (!searchTerm.trim()) return farms;

    const term = searchTerm.toLowerCase();
    return farms.filter(farm =>
      farm.farm_name.toLowerCase().includes(term) ||
      farm.farm_category.toLowerCase().includes(term)
    );
  }

  // حساب نسبة الامتلاء
  getOccupancyPercentage(farm: FarmFollowUpStats): number {
    if (farm.total_trees === 0) return 0;
    return (farm.reserved_trees / farm.total_trees) * 100;
  }

  // الحصول على لون الحالة
  getUrgencyColor(urgencyLevel: string): string {
    switch (urgencyLevel) {
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'critical':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-yellow-100 text-yellow-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // الحصول على نص الحالة
  getUrgencyText(urgencyLevel: string): string {
    switch (urgencyLevel) {
      case 'overdue':
        return 'متأخر';
      case 'critical':
        return 'حرج جداً';
      case 'urgent':
        return 'عاجل';
      case 'medium':
        return 'متوسط';
      default:
        return 'عادي';
    }
  }

  // تنسيق الوقت المتبقي
  formatTimeRemaining(hours: number): string {
    if (hours < 0) {
      const absHours = Math.abs(hours);
      const days = Math.floor(absHours / 24);
      const remainingHours = Math.floor(absHours % 24);

      if (days > 0) {
        return `متأخر ${days} يوم`;
      }
      return `متأخر ${remainingHours} ساعة`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);

    if (days > 0) {
      return `${days} يوم، ${remainingHours} ساعة`;
    }
    return `${remainingHours} ساعة`;
  }

  // الحصول على لون نسبة الامتلاء
  getOccupancyColor(percentage: number): string {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-orange-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  }

  // الحصول على لون شريط التقدم
  getProgressBarColor(percentage: number): string {
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 70) return 'bg-orange-600';
    if (percentage >= 50) return 'bg-yellow-600';
    return 'bg-green-600';
  }
}

export const farmFollowUpService = new FarmFollowUpService();
