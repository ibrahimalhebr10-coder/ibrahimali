import { supabase } from '../lib/supabase';

export interface ProductYield {
  id: string;
  farmId: string;
  farmName: string;
  productType: 'fruits' | 'oil' | 'secondary';
  productName: string;
  quantityProduced: number;
  quantitySold: number;
  unit: string;
  valueGenerated: number;
  productionDate: string;
  season: string;
  notes?: string;
}

export interface ProductYieldsSummary {
  totalProducts: number;
  totalProduced: number;
  totalSold: number;
  totalValue: number;
  byType: {
    fruits: number;
    oil: number;
    secondary: number;
  };
}

const productTypeLabels: Record<string, string> = {
  fruits: 'ثمار',
  oil: 'زيوت',
  secondary: 'منتجات ثانوية'
};

export async function getProductYields(): Promise<ProductYield[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('product_yields')
      .select(`
        *,
        farms (
          id,
          name
        )
      `)
      .eq('investor_id', user.id)
      .order('production_date', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      farmId: item.farm_id,
      farmName: item.farms?.name || 'مزرعة غير محددة',
      productType: item.product_type,
      productName: item.product_name,
      quantityProduced: item.quantity_produced,
      quantitySold: item.quantity_sold,
      unit: item.unit,
      valueGenerated: item.value_generated || 0,
      productionDate: item.production_date,
      season: item.season || '',
      notes: item.notes
    }));
  } catch (error) {
    console.error('Error fetching product yields:', error);
    return [];
  }
}

export async function getProductYieldsSummary(): Promise<ProductYieldsSummary> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        totalProducts: 0,
        totalProduced: 0,
        totalSold: 0,
        totalValue: 0,
        byType: { fruits: 0, oil: 0, secondary: 0 }
      };
    }

    const { data, error } = await supabase
      .from('product_yields')
      .select('*')
      .eq('investor_id', user.id);

    if (error) throw error;

    const yields = data || [];

    return {
      totalProducts: yields.length,
      totalProduced: yields.reduce((sum, y) => sum + Number(y.quantity_produced), 0),
      totalSold: yields.reduce((sum, y) => sum + Number(y.quantity_sold), 0),
      totalValue: yields.reduce((sum, y) => sum + Number(y.value_generated || 0), 0),
      byType: {
        fruits: yields.filter(y => y.product_type === 'fruits').length,
        oil: yields.filter(y => y.product_type === 'oil').length,
        secondary: yields.filter(y => y.product_type === 'secondary').length
      }
    };
  } catch (error) {
    console.error('Error fetching product yields summary:', error);
    return {
      totalProducts: 0,
      totalProduced: 0,
      totalSold: 0,
      totalValue: 0,
      byType: { fruits: 0, oil: 0, secondary: 0 }
    };
  }
}

export function getProductTypeLabel(type: string): string {
  return productTypeLabels[type] || type;
}
