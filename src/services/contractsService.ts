import { supabase } from '../lib/supabase';

export interface Contract {
  id: string;
  farm_id: string;
  user_id: string;
  contract_type: 'agricultural' | 'investment';
  tree_count: number;
  tree_types: string[];
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'needs_attention';
  internal_notes?: string;
  tags?: string[];
  farm_name?: string;
  user_name?: string;
}

export interface ContractStats {
  active: number;
  needsAttention: number;
  completed: number;
  activeByType: {
    agricultural: number;
    investment: number;
  };
}

export interface FarmWithContracts {
  farm_id: string;
  farm_name: string;
  location: string;
  total_contracts: number;
  active_count: number;
  needs_attention_count: number;
  completed_count: number;
  contracts: Contract[];
}

const contractsService = {
  async getContractStats(): Promise<ContractStats> {
    try {
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          id,
          status,
          contract_type,
          contract_start_date,
          contract_end_date
        `)
        .in('status', ['active', 'confirmed', 'completed']);

      if (error) throw error;

      const stats: ContractStats = {
        active: 0,
        needsAttention: 0,
        completed: 0,
        activeByType: {
          agricultural: 0,
          investment: 0
        }
      };

      const now = new Date();
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

      reservations?.forEach(reservation => {
        if (reservation.status === 'completed') {
          stats.completed++;
        } else if (reservation.status === 'active' || reservation.status === 'confirmed') {
          const endDate = new Date(reservation.contract_end_date);

          if (endDate < sixMonthsFromNow) {
            stats.needsAttention++;
          } else {
            stats.active++;
          }

          if (reservation.contract_type === 'agricultural') {
            stats.activeByType.agricultural++;
          } else {
            stats.activeByType.investment++;
          }
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching contract stats:', error);
      throw error;
    }
  },

  async getFarmsWithContracts(): Promise<FarmWithContracts[]> {
    try {
      const { data: farms, error: farmsError } = await supabase
        .from('farms')
        .select('id, name_ar, location');

      if (farmsError) throw farmsError;

      const farmsWithContracts: FarmWithContracts[] = [];

      for (const farm of farms || []) {
        const { data: reservations, error: reservationsError } = await supabase
          .from('reservations')
          .select(`
            id,
            user_id,
            status,
            contract_type,
            total_trees,
            tree_types,
            contract_start_date,
            contract_end_date,
            user_profiles:user_id (
              full_name
            )
          `)
          .eq('farm_id', farm.id)
          .in('status', ['active', 'confirmed', 'completed']);

        if (reservationsError) throw reservationsError;

        const contracts: Contract[] = [];
        let activeCount = 0;
        let needsAttentionCount = 0;
        let completedCount = 0;

        const now = new Date();
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

        reservations?.forEach(reservation => {
          let status: 'active' | 'completed' | 'needs_attention' = reservation.status === 'completed' ? 'completed' : 'active';

          if (reservation.status === 'active' || reservation.status === 'confirmed') {
            const endDate = new Date(reservation.contract_end_date);
            if (endDate < sixMonthsFromNow) {
              status = 'needs_attention';
              needsAttentionCount++;
            } else {
              status = 'active';
              activeCount++;
            }
          } else if (reservation.status === 'completed') {
            completedCount++;
          }

          const treeTypes = typeof reservation.tree_types === 'string'
            ? [reservation.tree_types]
            : Array.isArray(reservation.tree_types)
              ? reservation.tree_types
              : [];

          const userName = reservation.user_profiles?.full_name || 'عميل مؤقت';

          contracts.push({
            id: reservation.id,
            farm_id: farm.id,
            user_id: reservation.user_id || 'temp',
            contract_type: reservation.contract_type || 'agricultural',
            tree_count: reservation.total_trees || 0,
            tree_types: treeTypes,
            start_date: reservation.contract_start_date,
            end_date: reservation.contract_end_date,
            status,
            farm_name: farm.name_ar,
            user_name: userName
          });
        });

        if (contracts.length > 0) {
          farmsWithContracts.push({
            farm_id: farm.id,
            farm_name: farm.name_ar,
            location: farm.location || 'غير محدد',
            total_contracts: contracts.length,
            active_count: activeCount,
            needs_attention_count: needsAttentionCount,
            completed_count: completedCount,
            contracts
          });
        }
      }

      return farmsWithContracts;
    } catch (error) {
      console.error('Error fetching farms with contracts:', error);
      throw error;
    }
  },

  async updateContractStatus(contractId: string, status: 'active' | 'completed'): Promise<void> {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', contractId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating contract status:', error);
      throw error;
    }
  },

  calculateDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  calculateProgress(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();

    const progress = (elapsed / totalDuration) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }
};

export default contractsService;
