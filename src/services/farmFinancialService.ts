import { supabase } from '../lib/supabase';

export interface FarmFinancialTransaction {
  id: string;
  farm_id: string;
  path_type: 'agricultural' | 'investment';
  transaction_type: 'income' | 'expense';
  amount: number;
  description: string;
  transaction_date: string;
  created_by: string | null;
  created_at: string;
}

export interface FarmBalance {
  total_income: number;
  total_expenses: number;
  current_balance: number;
}

export const farmFinancialService = {
  async getFarmTransactions(farmId: string, pathType?: 'agricultural' | 'investment') {
    let query = supabase
      .from('farm_financial_transactions')
      .select('*')
      .eq('farm_id', farmId)
      .order('transaction_date', { ascending: false });

    if (pathType) {
      query = query.eq('path_type', pathType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as FarmFinancialTransaction[];
  },

  async getFarmBalance(farmId: string, pathType?: 'agricultural' | 'investment') {
    const { data, error } = await supabase
      .rpc('get_farm_balance', {
        p_farm_id: farmId,
        p_path_type: pathType || null
      });

    if (error) throw error;
    return data[0] as FarmBalance;
  },

  async addTransaction(transaction: {
    farm_id: string;
    path_type: 'agricultural' | 'investment';
    transaction_type: 'income' | 'expense';
    amount: number;
    description: string;
    transaction_date?: string;
  }) {
    const { data, error } = await supabase
      .from('farm_financial_transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) throw error;
    return data as FarmFinancialTransaction;
  },

  async updateTransaction(id: string, updates: {
    amount?: number;
    description?: string;
    transaction_date?: string;
  }) {
    const { data, error } = await supabase
      .from('farm_financial_transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as FarmFinancialTransaction;
  },

  async deleteTransaction(id: string) {
    const { error } = await supabase
      .from('farm_financial_transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
