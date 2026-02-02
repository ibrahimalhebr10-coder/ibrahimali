import { supabase } from '../lib/supabase';

export interface InvestmentPackage {
  id: string;
  package_name: string;
  contract_id: string;
  price_per_tree: number;
  base_duration_years: number;
  bonus_free_years: number;
  min_trees: number;
  tree_increment: number;
  quick_select_options: number[];
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

export interface CreateInvestmentPackageInput {
  package_name: string;
  contract_id: string;
  price_per_tree: number;
  base_duration_years: number;
  bonus_free_years: number;
  min_trees: number;
  tree_increment: number;
  quick_select_options: number[];
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

  async getAllPackages(): Promise<InvestmentPackage[]> {
    const { data, error } = await supabase
      .from('investment_packages')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('Error fetching all investment packages:', error);
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
  },

  async createPackage(input: CreateInvestmentPackageInput): Promise<InvestmentPackage> {
    const { data, error } = await supabase
      .from('investment_packages')
      .insert([input])
      .select()
      .single();

    if (error) {
      console.error('Error creating investment package:', error);
      throw error;
    }

    return data;
  },

  async updatePackage(packageId: string, input: Partial<CreateInvestmentPackageInput>): Promise<InvestmentPackage> {
    const { data, error } = await supabase
      .from('investment_packages')
      .update(input)
      .eq('id', packageId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating investment package:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Failed to update package or no permission to view result');
    }

    return data;
  },

  async deletePackage(packageId: string): Promise<void> {
    const { error } = await supabase
      .from('investment_packages')
      .delete()
      .eq('id', packageId);

    if (error) {
      console.error('Error deleting investment package:', error);
      throw error;
    }
  },

  async togglePackageStatus(packageId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('investment_packages')
      .update({ is_active: isActive })
      .eq('id', packageId);

    if (error) {
      console.error('Error toggling package status:', error);
      throw error;
    }
  }
};
