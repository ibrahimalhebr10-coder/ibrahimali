import { supabase } from '../lib/supabase';

export interface MomentumIndicators {
  registrations: {
    count: number;
    status: 'high' | 'medium' | 'quiet';
  };
  operations: {
    count: number;
    status: 'active' | 'moderate' | 'quiet';
  };
  engagement: {
    total_reservations: number;
    status: 'high' | 'medium' | 'low';
  };
  capacity: {
    farms_near_full: number;
    status: 'urgent' | 'attention' | 'healthy';
  };
  suggestion: string;
}

export interface MomentumDecision {
  id: string;
  decision_type: 'push' | 'silence';
  action_taken: string;
  reason: string | null;
  admin_name: string;
  created_at: string;
}

export const momentumCenterService = {
  async getMomentumIndicators() {
    const { data, error } = await supabase
      .rpc('get_momentum_indicators');

    if (error) throw error;
    return data as MomentumIndicators;
  },

  async recordDecision(decisionType: 'push' | 'silence', actionTaken: string, reason?: string) {
    const { data, error } = await supabase
      .rpc('record_momentum_decision', {
        p_decision_type: decisionType,
        p_action_taken: actionTaken,
        p_reason: reason || null
      });

    if (error) throw error;
    return data;
  },

  async getDecisionsLog(limit = 50) {
    const { data, error } = await supabase
      .rpc('get_momentum_decisions_log', {
        p_limit: limit
      });

    if (error) throw error;
    return data as MomentumDecision[];
  }
};
