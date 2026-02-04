import { supabase } from '../lib/supabase';

export interface InvestorAsset {
  id: string;
  tree_type: string;
  quantity: number;
  farm_id: string;
  farm_name: string;
  acquisition_date: string;
}

export interface InvestorContract {
  id: string;
  farm_id: string;
  farm_name: string;
  contract_start_date: string;
  contract_duration_years: number;
  total_trees: number;
  status: string;
}

export interface ProductYield {
  id: string;
  product_type: string;
  harvest_date: string;
  value: number;
  value_unit: string;
  description: string;
}

export interface WasteYield {
  id: string;
  waste_type: string;
  collection_date: string;
  value: number;
  value_unit: string;
  description: string;
}

export interface ExpansionOpportunity {
  id: string;
  opportunity_type: string;
  title: string;
  description: string;
  estimated_investment: number;
  potential_trees: number;
  is_active: boolean;
}

export interface OperatingCost {
  id: string;
  farm_id: string;
  farm_name: string;
  operation_type: string;
  operation_date: string;
  description: string;
  cost_per_tree: number;
  investor_trees: number;
  investor_cost: number;
}

export interface OperatingCostsSummary {
  totalCost: number;
  operationsCount: number;
  averageCostPerOperation: number;
  mostExpensiveOperation: string | null;
}

export interface InvestorMyFarmData {
  assets: InvestorAsset[];
  totalTrees: number;
  contracts: InvestorContract[];
  productYields: ProductYield[];
  wasteYields: WasteYield[];
  expansionOpportunities: ExpansionOpportunity[];
  operatingCosts: OperatingCost[];
  operatingCostsSummary: OperatingCostsSummary;
}

export const investorMyFarmService = {
  async getInvestorFarmData(userId: string): Promise<InvestorMyFarmData> {
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (!userProfile) {
      return {
        assets: [],
        totalTrees: 0,
        contracts: [],
        productYields: [],
        wasteYields: [],
        expansionOpportunities: [],
        operatingCosts: [],
        operatingCostsSummary: {
          totalCost: 0,
          operationsCount: 0,
          averageCostPerOperation: 0,
          mostExpensiveOperation: null,
        },
      };
    }

    const [assetsData, contractsData, productsData, wasteData, expansionData, operatingCostsData] = await Promise.all([
      this.getAssets(userProfile.id),
      this.getContracts(userProfile.id),
      this.getProductYields(userProfile.id),
      this.getWasteYields(userProfile.id),
      this.getExpansionOpportunities(userProfile.id),
      this.getOperatingCosts(userProfile.id),
    ]);

    const totalTrees = assetsData.reduce((sum, asset) => sum + asset.quantity, 0);
    const operatingCostsSummary = this.calculateOperatingCostsSummary(operatingCostsData);

    return {
      assets: assetsData,
      totalTrees,
      contracts: contractsData,
      productYields: productsData,
      wasteYields: wasteData,
      expansionOpportunities: expansionData,
      operatingCosts: operatingCostsData,
      operatingCostsSummary,
    };
  },

  async getAssets(userProfileId: string): Promise<InvestorAsset[]> {
    const { data, error } = await supabase
      .from('investment_agricultural_assets')
      .select(`
        id,
        tree_type,
        quantity,
        farm_id,
        acquisition_date,
        farms:farm_id (
          name_ar
        )
      `)
      .eq('user_id', userProfileId)
      .order('acquisition_date', { ascending: false });

    if (error) {
      console.error('Error fetching assets:', error);
      return [];
    }

    return (data || []).map((asset: any) => ({
      id: asset.id,
      tree_type: asset.tree_type,
      quantity: asset.quantity,
      farm_id: asset.farm_id,
      farm_name: asset.farms?.name_ar || 'مزرعة',
      acquisition_date: asset.acquisition_date,
    }));
  },

  async getContracts(userProfileId: string): Promise<InvestorContract[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id,
        farm_id,
        contract_start_date,
        contract_duration_years,
        total_trees,
        status,
        farms:farm_id (
          name_ar
        )
      `)
      .eq('user_id', userProfileId)
      .in('status', ['active', 'confirmed'])
      .order('contract_start_date', { ascending: false });

    if (error) {
      console.error('Error fetching contracts:', error);
      return [];
    }

    return (data || []).map((contract: any) => ({
      id: contract.id,
      farm_id: contract.farm_id,
      farm_name: contract.farms?.name_ar || 'مزرعة',
      contract_start_date: contract.contract_start_date || new Date().toISOString(),
      contract_duration_years: contract.contract_duration_years || 5,
      total_trees: contract.total_trees,
      status: contract.status,
    }));
  },

  async getProductYields(userProfileId: string): Promise<ProductYield[]> {
    const { data, error } = await supabase
      .from('investment_products_yields')
      .select('*')
      .eq('user_id', userProfileId)
      .order('harvest_date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching product yields:', error);
      return [];
    }

    return data || [];
  },

  async getWasteYields(userProfileId: string): Promise<WasteYield[]> {
    const { data, error } = await supabase
      .from('investment_waste_yields')
      .select('*')
      .eq('user_id', userProfileId)
      .order('collection_date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching waste yields:', error);
      return [];
    }

    return data || [];
  },

  async getExpansionOpportunities(userProfileId: string): Promise<ExpansionOpportunity[]> {
    const { data, error } = await supabase
      .from('investment_expansion_opportunities')
      .select('*')
      .eq('user_id', userProfileId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching expansion opportunities:', error);
      return [];
    }

    return data || [];
  },

  calculateContractProgress(contract: InvestorContract) {
    const startDate = new Date(contract.contract_start_date);
    const now = new Date();
    const durationYears = contract.contract_duration_years;
    const endDate = new Date(startDate);
    endDate.setFullYear(startDate.getFullYear() + durationYears);

    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const remainingDays = totalDays - elapsedDays;

    const currentYear = Math.floor(elapsedDays / 365) + 1;
    const remainingYears = Math.floor(remainingDays / 365);
    const remainingMonths = Math.floor((remainingDays % 365) / 30);

    return {
      currentYear: Math.min(currentYear, durationYears),
      totalYears: durationYears,
      remainingYears,
      remainingMonths,
      progressPercentage: Math.min((elapsedDays / totalDays) * 100, 100),
    };
  },

  groupAssetsByType(assets: InvestorAsset[]): Record<string, number> {
    return assets.reduce((acc, asset) => {
      if (acc[asset.tree_type]) {
        acc[asset.tree_type] += asset.quantity;
      } else {
        acc[asset.tree_type] = asset.quantity;
      }
      return acc;
    }, {} as Record<string, number>);
  },

  async getOperatingCosts(userProfileId: string): Promise<OperatingCost[]> {
    const { data: assets } = await supabase
      .from('investment_agricultural_assets')
      .select('farm_id, quantity')
      .eq('user_id', userProfileId);

    if (!assets || assets.length === 0) {
      return [];
    }

    const assetsByFarm = assets.reduce((acc, asset) => {
      if (acc[asset.farm_id]) {
        acc[asset.farm_id] += asset.quantity;
      } else {
        acc[asset.farm_id] = asset.quantity;
      }
      return acc;
    }, {} as Record<string, number>);

    const farmIds = Object.keys(assetsByFarm);

    const { data: operations, error } = await supabase
      .from('agricultural_operations')
      .select(`
        id,
        farm_id,
        operation_type,
        operation_date,
        description,
        cost_per_tree,
        farms:farm_id (
          name_ar
        )
      `)
      .in('farm_id', farmIds)
      .order('operation_date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching operating costs:', error);
      return [];
    }

    return (operations || []).map((op: any) => {
      const investorTrees = assetsByFarm[op.farm_id] || 0;
      const investorCost = investorTrees * (op.cost_per_tree || 0);

      return {
        id: op.id,
        farm_id: op.farm_id,
        farm_name: op.farms?.name_ar || 'مزرعة',
        operation_type: op.operation_type,
        operation_date: op.operation_date,
        description: op.description || '',
        cost_per_tree: op.cost_per_tree || 0,
        investor_trees: investorTrees,
        investor_cost: investorCost,
      };
    });
  },

  calculateOperatingCostsSummary(costs: OperatingCost[]): OperatingCostsSummary {
    if (costs.length === 0) {
      return {
        totalCost: 0,
        operationsCount: 0,
        averageCostPerOperation: 0,
        mostExpensiveOperation: null,
      };
    }

    const totalCost = costs.reduce((sum, cost) => sum + cost.investor_cost, 0);
    const operationsCount = costs.length;
    const averageCostPerOperation = totalCost / operationsCount;

    const mostExpensive = costs.reduce((max, cost) =>
      cost.investor_cost > max.investor_cost ? cost : max
    );

    return {
      totalCost,
      operationsCount,
      averageCostPerOperation,
      mostExpensiveOperation: mostExpensive.operation_type,
    };
  },
};
