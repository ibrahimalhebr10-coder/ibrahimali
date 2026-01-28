import { supabase } from '../lib/supabase';

export interface HarvestStatus {
  hasActiveHarvest: boolean;
  totalTrees: number;
  reservationIds: string[];
}

export async function checkUserHarvestStatus(): Promise<HarvestStatus> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        hasActiveHarvest: false,
        totalTrees: 0,
        reservationIds: []
      };
    }

    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('id, total_trees')
      .eq('user_id', user.id)
      .eq('status', 'transferred_to_harvest');

    if (error) throw error;

    const hasActiveHarvest = (reservations && reservations.length > 0) || false;
    const totalTrees = reservations?.reduce((sum, r) => sum + r.total_trees, 0) || 0;
    const reservationIds = reservations?.map(r => r.id) || [];

    return {
      hasActiveHarvest,
      totalTrees,
      reservationIds
    };
  } catch (error) {
    console.error('Error checking harvest status:', error);
    return {
      hasActiveHarvest: false,
      totalTrees: 0,
      reservationIds: []
    };
  }
}
