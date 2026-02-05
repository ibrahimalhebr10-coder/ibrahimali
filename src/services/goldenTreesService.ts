import { supabase } from '../lib/supabase';

export type GoldenTreesMode = 'demo' | 'active' | 'no-assets';

export interface GoldenTreesContext {
  mode: GoldenTreesMode;
  hasAuth: boolean;
  hasAssets: boolean;
  message?: string;
}

export async function determineGoldenTreesMode(userId?: string): Promise<GoldenTreesContext> {
  try {
    if (!userId) {
      return {
        mode: 'demo',
        hasAuth: false,
        hasAssets: false,
        message: 'تجربة استكشافية - قم بالتسجيل لعرض أصولك الحقيقية'
      };
    }

    const { count, error } = await supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('path_type', 'investment')
      .in('status', ['confirmed', 'completed']);

    if (error) throw error;

    const hasAssets = (count || 0) > 0;

    if (!hasAssets) {
      return {
        mode: 'no-assets',
        hasAuth: true,
        hasAssets: false,
        message: 'لا توجد أصول استثمارية حالياً - ابدأ الاستثمار الآن'
      };
    }

    return {
      mode: 'active',
      hasAuth: true,
      hasAssets: true,
      message: 'عرض أصولك الاستثمارية'
    };
  } catch (error) {
    console.error('Error determining golden trees mode:', error);
    return {
      mode: 'demo',
      hasAuth: false,
      hasAssets: false,
      message: 'حدث خطأ - يتم عرض الوضع التجريبي'
    };
  }
}

export interface GoldenTreeAsset {
  id: string;
  farm_name: string;
  tree_type: string;
  trees_count: number;
  contract_start_date: string;
  contract_duration: number;
  total_price: number;
}

export interface GoldenTreeMaintenance {
  id: string;
  fee_title: string;
  amount_due: number;
  due_date: string;
  payment_status: 'pending' | 'paid' | 'overdue';
  maintenance_type: string;
}

export async function getGoldenTreeAssets(userId?: string): Promise<GoldenTreeAsset[]> {
  try {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id,
        farm_id,
        tree_types,
        total_trees,
        contract_start_date,
        duration_years,
        total_amount,
        farm_name
      `)
      .eq('user_id', userId)
      .eq('path_type', 'investment')
      .in('status', ['confirmed', 'completed'])
      .order('contract_start_date', { ascending: false });

    if (error) throw error;

    return (data || []).map(r => ({
      id: r.id,
      farm_name: r.farm_name || 'مزرعة',
      tree_type: r.tree_types || 'غير محدد',
      trees_count: r.total_trees || 0,
      contract_start_date: r.contract_start_date || '',
      contract_duration: r.duration_years || 0,
      total_price: r.total_amount || 0
    }));
  } catch (error) {
    console.error('Error fetching golden tree assets:', error);
    return [];
  }
}

export async function getGoldenTreeMaintenanceFees(userId?: string): Promise<GoldenTreeMaintenance[]> {
  try {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('maintenance_payments')
      .select(`
        id,
        amount_due,
        due_date,
        payment_status,
        maintenance_fees!inner(
          fee_title,
          maintenance_type,
          path_type
        )
      `)
      .eq('user_id', userId)
      .eq('maintenance_fees.path_type', 'investment')
      .order('due_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(p => ({
      id: p.id,
      fee_title: (p.maintenance_fees as any)?.fee_title || 'رسم صيانة',
      amount_due: p.amount_due || 0,
      due_date: p.due_date || '',
      payment_status: p.payment_status as any || 'pending',
      maintenance_type: (p.maintenance_fees as any)?.maintenance_type || 'periodic'
    }));
  } catch (error) {
    console.error('Error fetching maintenance fees:', error);
    return [];
  }
}
