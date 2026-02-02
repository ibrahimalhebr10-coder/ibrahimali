import { supabase } from '../lib/supabase';

export interface InvestorAsset {
  id: string;
  treeType: string;
  totalTrees: number;
  activeContracts: number;
  assetStatus: 'active' | 'expanding' | 'completed';
  lastUpdated: string;
}

export interface AssetsSummary {
  totalTrees: number;
  totalTreeTypes: number;
  activeContracts: number;
  expandingAssets: number;
  completedAssets: number;
}

const treeTypeLabels: Record<string, string> = {
  olive: 'زيتون',
  palm: 'نخيل',
  fig: 'تين',
  pomegranate: 'رمان',
  grape: 'عنب'
};

export async function getInvestorAssets(): Promise<InvestorAsset[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('investor_assets_summary')
      .select('*')
      .eq('investor_id', user.id)
      .order('total_trees', { ascending: false });

    if (error) throw error;

    return (data || []).map(asset => ({
      id: asset.id,
      treeType: treeTypeLabels[asset.tree_type] || asset.tree_type,
      totalTrees: asset.total_trees,
      activeContracts: asset.active_contracts,
      assetStatus: asset.asset_status,
      lastUpdated: asset.last_updated
    }));
  } catch (error) {
    console.error('Error fetching investor assets:', error);
    return [];
  }
}

export async function getAssetsSummary(): Promise<AssetsSummary> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        totalTrees: 0,
        totalTreeTypes: 0,
        activeContracts: 0,
        expandingAssets: 0,
        completedAssets: 0
      };
    }

    const { data, error } = await supabase
      .from('investor_assets_summary')
      .select('*')
      .eq('investor_id', user.id);

    if (error) throw error;

    const assets = data || [];

    return {
      totalTrees: assets.reduce((sum, a) => sum + a.total_trees, 0),
      totalTreeTypes: assets.length,
      activeContracts: assets.reduce((sum, a) => sum + a.active_contracts, 0),
      expandingAssets: assets.filter(a => a.asset_status === 'expanding').length,
      completedAssets: assets.filter(a => a.asset_status === 'completed').length
    };
  } catch (error) {
    console.error('Error fetching assets summary:', error);
    return {
      totalTrees: 0,
      totalTreeTypes: 0,
      activeContracts: 0,
      expandingAssets: 0,
      completedAssets: 0
    };
  }
}

export async function syncAssetsFromReservations(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select('tree_type, trees_count, contract_duration, status')
      .eq('investor_id', user.id)
      .eq('status', 'confirmed');

    if (resError) throw resError;

    const assetsByType = new Map<string, { trees: number; contracts: number }>();

    (reservations || []).forEach(res => {
      if (!res.tree_type) return;

      const current = assetsByType.get(res.tree_type) || { trees: 0, contracts: 0 };
      assetsByType.set(res.tree_type, {
        trees: current.trees + (res.trees_count || 0),
        contracts: current.contracts + 1
      });
    });

    for (const [treeType, stats] of assetsByType) {
      const { error: upsertError } = await supabase
        .from('investor_assets_summary')
        .upsert({
          investor_id: user.id,
          tree_type: treeType,
          total_trees: stats.trees,
          active_contracts: stats.contracts,
          asset_status: 'active',
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'investor_id,tree_type',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('Error upserting asset:', upsertError);
      }
    }
  } catch (error) {
    console.error('Error syncing assets from reservations:', error);
  }
}
