import { supabase } from '../lib/supabase';

export interface UserTreesSummary {
  hasGreenTrees: boolean;
  hasGoldenTrees: boolean;
  greenTreesCount: number;
  goldenTreesCount: number;
  greenTreesFarms: Array<{
    farmId: string;
    farmName: string;
    treeCount: number;
    treeTypes: string[];
  }>;
  goldenTreesFarms: Array<{
    farmId: string;
    farmName: string;
    treeCount: number;
    treeTypes: string[];
  }>;
}

export const userTreesService = {
  async getUserTreesSummary(userId: string): Promise<UserTreesSummary> {
    try {
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          id,
          farm_id,
          path_type,
          total_trees,
          tree_types,
          status,
          farms!inner (
            id,
            name_ar,
            name_en
          )
        `)
        .eq('user_id', userId)
        .in('status', ['confirmed', 'active']);

      if (error) {
        console.error('Error fetching user trees:', error);
        throw error;
      }

      const greenReservations = reservations?.filter(r => r.path_type === 'agricultural') || [];
      const goldenReservations = reservations?.filter(r => r.path_type === 'investment') || [];

      const greenTreesCount = greenReservations.reduce((sum, r) => sum + (r.total_trees || 0), 0);
      const goldenTreesCount = goldenReservations.reduce((sum, r) => sum + (r.total_trees || 0), 0);

      const greenTreesFarms = greenReservations.map(r => ({
        farmId: r.farm_id,
        farmName: (r.farms as any)?.name_ar || '',
        treeCount: r.total_trees || 0,
        treeTypes: r.tree_types || []
      }));

      const goldenTreesFarms = goldenReservations.map(r => ({
        farmId: r.farm_id,
        farmName: (r.farms as any)?.name_ar || '',
        treeCount: r.total_trees || 0,
        treeTypes: r.tree_types || []
      }));

      return {
        hasGreenTrees: greenTreesCount > 0,
        hasGoldenTrees: goldenTreesCount > 0,
        greenTreesCount,
        goldenTreesCount,
        greenTreesFarms,
        goldenTreesFarms
      };
    } catch (error) {
      console.error('Error in getUserTreesSummary:', error);
      throw error;
    }
  },

  async getTreesByPathType(userId: string, pathType: 'agricultural' | 'investment') {
    try {
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          id,
          farm_id,
          total_trees,
          tree_types,
          status,
          contract_start_date,
          contract_duration_years,
          farms!inner (
            id,
            name_ar,
            name_en,
            location
          )
        `)
        .eq('user_id', userId)
        .eq('path_type', pathType)
        .in('status', ['confirmed', 'active'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`Error fetching ${pathType} trees:`, error);
        throw error;
      }

      return reservations || [];
    } catch (error) {
      console.error(`Error in getTreesByPathType (${pathType}):`, error);
      throw error;
    }
  }
};
