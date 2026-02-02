import { supabase } from '../lib/supabase';

export interface AgriculturalPackage {
  id: string;
  contract_id: string;
  package_name: string;
  price_per_tree: number;
  base_duration_years: number;
  bonus_free_years: number;
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

export interface CreateAgriculturalPackageInput {
  contract_id: string;
  package_name: string;
  price_per_tree: number;
  base_duration_years: number;
  bonus_free_years: number;
  motivational_text?: string;
  description: string;
  what_is_included: string[];
  base_duration_info?: string;
  free_years_info?: string;
  features: string[];
  conditions: string[];
  management_info?: string;
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

  async getAllPackages(): Promise<AgriculturalPackage[]> {
    const { data, error } = await supabase
      .from('agricultural_packages')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching all agricultural packages:', error);
      throw error;
    }

    return data || [];
  },

  async getPackageById(packageId: string): Promise<AgriculturalPackage | null> {
    const { data, error } = await supabase
      .from('agricultural_packages')
      .select('*')
      .eq('id', packageId)
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
  },

  async createPackage(input: CreateAgriculturalPackageInput): Promise<AgriculturalPackage> {
    const { data, error } = await supabase
      .from('agricultural_packages')
      .insert([input])
      .select()
      .single();

    if (error) {
      console.error('Error creating agricultural package:', error);
      throw error;
    }

    return data;
  },

  async updatePackage(packageId: string, input: Partial<CreateAgriculturalPackageInput>): Promise<AgriculturalPackage> {
    const { data, error } = await supabase
      .from('agricultural_packages')
      .update(input)
      .eq('id', packageId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating agricultural package:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Failed to update package or no permission to view result');
    }

    return data;
  },

  async deletePackage(packageId: string): Promise<void> {
    const { error } = await supabase
      .from('agricultural_packages')
      .delete()
      .eq('id', packageId);

    if (error) {
      console.error('Error deleting agricultural package:', error);
      throw error;
    }
  },

  async togglePackageStatus(packageId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('agricultural_packages')
      .update({ is_active: isActive })
      .eq('id', packageId);

    if (error) {
      console.error('Error toggling package status:', error);
      throw error;
    }
  }
};
