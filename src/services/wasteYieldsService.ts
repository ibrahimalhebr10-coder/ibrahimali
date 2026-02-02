import { supabase } from '../lib/supabase';

export interface WasteYield {
  id: string;
  farmId: string;
  farmName: string;
  wasteType: 'pruning' | 'leaves' | 'pressing_residue' | 'other';
  wasteName: string;
  utilizationMethod: 'sale' | 'conversion' | 'composting';
  quantity: number;
  unit: string;
  valueAdded: number;
  collectionDate: string;
  psychologicalMessage: string;
}

export interface WasteYieldsSummary {
  totalWasteTypes: number;
  totalQuantity: number;
  totalValueAdded: number;
  byUtilization: {
    sale: number;
    conversion: number;
    composting: number;
  };
}

const wasteTypeLabels: Record<string, string> = {
  pruning: 'مخلفات التقليم',
  leaves: 'أوراق الأشجار',
  pressing_residue: 'بقايا العصر',
  other: 'أخرى'
};

const utilizationLabels: Record<string, string> = {
  sale: 'بيع',
  conversion: 'تحويل',
  composting: 'تسميد'
};

export async function getWasteYields(): Promise<WasteYield[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('waste_yields')
      .select(`
        *,
        farms (
          id,
          name
        )
      `)
      .eq('investor_id', user.id)
      .order('collection_date', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      farmId: item.farm_id,
      farmName: item.farms?.name || 'مزرعة غير محددة',
      wasteType: item.waste_type,
      wasteName: item.waste_name,
      utilizationMethod: item.utilization_method,
      quantity: item.quantity,
      unit: item.unit,
      valueAdded: item.value_added || 0,
      collectionDate: item.collection_date,
      psychologicalMessage: item.psychological_message || 'ولا شيء يضيع'
    }));
  } catch (error) {
    console.error('Error fetching waste yields:', error);
    return [];
  }
}

export async function getWasteYieldsSummary(): Promise<WasteYieldsSummary> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        totalWasteTypes: 0,
        totalQuantity: 0,
        totalValueAdded: 0,
        byUtilization: { sale: 0, conversion: 0, composting: 0 }
      };
    }

    const { data, error } = await supabase
      .from('waste_yields')
      .select('*')
      .eq('investor_id', user.id);

    if (error) throw error;

    const wastes = data || [];

    return {
      totalWasteTypes: wastes.length,
      totalQuantity: wastes.reduce((sum, w) => sum + Number(w.quantity), 0),
      totalValueAdded: wastes.reduce((sum, w) => sum + Number(w.value_added || 0), 0),
      byUtilization: {
        sale: wastes.filter(w => w.utilization_method === 'sale').length,
        conversion: wastes.filter(w => w.utilization_method === 'conversion').length,
        composting: wastes.filter(w => w.utilization_method === 'composting').length
      }
    };
  } catch (error) {
    console.error('Error fetching waste yields summary:', error);
    return {
      totalWasteTypes: 0,
      totalQuantity: 0,
      totalValueAdded: 0,
      byUtilization: { sale: 0, conversion: 0, composting: 0 }
    };
  }
}

export function getWasteTypeLabel(type: string): string {
  return wasteTypeLabels[type] || type;
}

export function getUtilizationLabel(method: string): string {
  return utilizationLabels[method] || method;
}
