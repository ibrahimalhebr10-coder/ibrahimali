import { supabase } from '../lib/supabase';

export interface InvestorInvestment {
  id: string;
  farmName: string;
  farmImage?: string;
  treeCount: number;
  durationYears: number;
  bonusYears: number;
  totalPrice: number;
  investmentNumber: string;
  status: 'confirmed' | 'pending' | 'active';
  createdAt: string;
  contractId: string;
}

export interface InvestorStats {
  totalTrees: number;
  totalInvestmentValue: number;
  activeInvestments: number;
  status: 'active' | 'pending' | 'none';
}

export const investorAccountService = {
  async getInvestorInvestments(userId: string): Promise<InvestorInvestment[]> {
    try {
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          id,
          tree_count,
          duration_years,
          bonus_years,
          total_price,
          investment_number,
          status,
          created_at,
          contract_id,
          farm_id,
          farms!fk_reservations_farm_id(
            name,
            hero_image
          )
        `)
        .eq('user_id', userId)
        .in('status', ['confirmed', 'pending'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[InvestorAccountService] Error fetching investments:', error);
        return [];
      }

      if (!reservations || reservations.length === 0) {
        return [];
      }

      return reservations.map(reservation => ({
        id: reservation.id,
        farmName: reservation.farms?.name || 'مزرعة غير محددة',
        farmImage: reservation.farms?.hero_image,
        treeCount: reservation.tree_count,
        durationYears: reservation.duration_years,
        bonusYears: reservation.bonus_years || 0,
        totalPrice: reservation.total_price,
        investmentNumber: reservation.investment_number,
        status: reservation.status as 'confirmed' | 'pending' | 'active',
        createdAt: reservation.created_at,
        contractId: reservation.contract_id
      }));
    } catch (error) {
      console.error('[InvestorAccountService] Exception:', error);
      return [];
    }
  },

  async getInvestorStats(userId: string): Promise<InvestorStats> {
    try {
      const investments = await this.getInvestorInvestments(userId);

      if (investments.length === 0) {
        return {
          totalTrees: 0,
          totalInvestmentValue: 0,
          activeInvestments: 0,
          status: 'none'
        };
      }

      const totalTrees = investments.reduce((sum, inv) => sum + inv.treeCount, 0);
      const totalInvestmentValue = investments.reduce((sum, inv) => sum + inv.totalPrice, 0);
      const activeInvestments = investments.filter(inv => inv.status === 'confirmed').length;

      const hasActive = investments.some(inv => inv.status === 'confirmed');
      const hasPending = investments.some(inv => inv.status === 'pending');

      let status: 'active' | 'pending' | 'none' = 'none';
      if (hasActive) {
        status = 'active';
      } else if (hasPending) {
        status = 'pending';
      }

      return {
        totalTrees,
        totalInvestmentValue,
        activeInvestments,
        status
      };
    } catch (error) {
      console.error('[InvestorAccountService] Error calculating stats:', error);
      return {
        totalTrees: 0,
        totalInvestmentValue: 0,
        activeInvestments: 0,
        status: 'none'
      };
    }
  }
};
