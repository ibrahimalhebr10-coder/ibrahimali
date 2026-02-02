import { supabase } from '../lib/supabase';

export interface AgriculturalPackage {
  id: string;
  contract_id: string;
  package_name: string;
  price_per_tree: number;
  motivational_text: string | null;
  description: string;
  what_is_included: string[];
  base_duration_info: string | null;
  free_years_info: string | null;
  features: string[];
  conditions: string[];
  management_info: string | null;
  is_active: boolean;
  sort_order: number;
}

export const agriculturalPackagesService = {
  async getActivePackages(): Promise<AgriculturalPackage[]> {
    const { data, error } = await supabase
      .from('agricultural_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching agricultural packages:', error);
      throw error;
    }

    return data || [];
  },

  async getPackageById(packageId: string): Promise<AgriculturalPackage | null> {
    const { data, error } = await supabase
      .from('agricultural_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching package:', error);
      throw error;
    }

    return data;
  },

  async getPackageByContractId(contractId: string): Promise<AgriculturalPackage | null> {
    const { data, error } = await supabase
      .from('agricultural_packages')
      .select('*')
      .eq('contract_id', contractId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching package by contract:', error);
      throw error;
    }

    return data;
  }
};
