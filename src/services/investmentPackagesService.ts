import { supabase } from '../lib/supabase';

export interface InvestmentPackage {
  id: string;
  package_name: string;
  contract_id: string;
  price_per_tree: number;
  motivational_text?: string;
  description: string;
  investment_duration_title: string;
  investor_rights: string[];
  management_approach: string;
  returns_info: string;
  disclaimer: string;
  action_button_text: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const investmentPackagesService = {
  async getActivePackages(): Promise<InvestmentPackage[]> {
    const { data, error } = await supabase
      .from('investment_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching investment packages:', error);
      throw error;
    }

    return data || [];
  },

  async getPackageById(id: string): Promise<InvestmentPackage | null> {
    const { data, error } = await supabase
      .from('investment_packages')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching investment package:', error);
      throw error;
    }

    return data;
  },

  async getPackagesByContractId(contractId: string): Promise<InvestmentPackage[]> {
    const { data, error } = await supabase
      .from('investment_packages')
      .select('*')
      .eq('contract_id', contractId)
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching packages by contract:', error);
      throw error;
    }

    return data || [];
  }
};
