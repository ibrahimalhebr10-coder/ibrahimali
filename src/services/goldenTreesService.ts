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

    console.log(`[SECURITY] Checking golden trees mode for user ${userId}`);

    const { count, error } = await supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('path_type', 'investment')
      .in('status', ['confirmed', 'active']);

    if (error) {
      console.error('[SECURITY] Error checking assets:', error);
      throw error;
    }

    const hasAssets = (count || 0) > 0;
    console.log(`[SECURITY] User ${userId} has ${count} investment assets`);

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

export async function getGoldenTreeAssets(userId?: string): Promise<GoldenTreeAsset[]> {
  try {
    if (!userId) {
      console.warn('[SECURITY] Attempted to fetch golden tree assets without user ID');
      return [];
    }

    console.log(`[SECURITY] Fetching golden tree assets for user ${userId}`);

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id,
        farm_id,
        tree_types,
        total_trees,
        contract_start_date,
        duration_years,
        total_price,
        farm_name
      `)
      .eq('user_id', userId)
      .eq('path_type', 'investment')
      .in('status', ['confirmed', 'active'])
      .order('contract_start_date', { ascending: false });

    if (error) {
      console.error('[SECURITY] Error fetching assets:', error);
      throw error;
    }

    console.log(`[SECURITY] Found ${data?.length || 0} assets for user ${userId}`);

    return (data || []).map(r => ({
      id: r.id,
      farm_name: r.farm_name || 'مزرعة',
      tree_type: r.tree_types || 'غير محدد',
      trees_count: r.total_trees || 0,
      contract_start_date: r.contract_start_date || '',
      contract_duration: r.duration_years || 0,
      total_price: r.total_price || 0
    }));
  } catch (error) {
    console.error('Error fetching golden tree assets:', error);
    return [];
  }
}
