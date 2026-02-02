import { supabase } from '../lib/supabase';

export interface UserReservation {
  id: string;
  farmId: string;
  farmName: string;
  farmImage: string;
  treesCount: number;
  treeType: string;
  contractDuration: number;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: string;
}

export interface TreeOperation {
  id: string;
  farmName: string;
  operationType: 'irrigation' | 'maintenance' | 'pruning' | 'harvest';
  operationDate: string;
  treesCount: number;
  statusReport: string;
  notes?: string;
  media: {
    type: 'photo' | 'video';
    url: string;
    caption?: string;
  }[];
}

export interface UserTreesSummary {
  totalTrees: number;
  totalFarms: number;
  activeReservations: number;
  recentOperations: number;
}

const operationTypeLabels = {
  irrigation: 'ري',
  maintenance: 'صيانة',
  pruning: 'تقليم',
  harvest: 'حصاد'
};

export async function getUserReservations(): Promise<UserReservation[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id,
        farm_id,
        trees_count,
        tree_type,
        contract_duration,
        start_date,
        end_date,
        total_amount,
        status,
        farms (
          id,
          name,
          hero_image
        )
      `)
      .eq('investor_id', user.id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(reservation => ({
      id: reservation.id,
      farmId: reservation.farm_id,
      farmName: reservation.farms?.name || 'مزرعة غير معروفة',
      farmImage: reservation.farms?.hero_image || '',
      treesCount: reservation.trees_count,
      treeType: reservation.tree_type || 'غير محدد',
      contractDuration: reservation.contract_duration || 0,
      startDate: reservation.start_date || '',
      endDate: reservation.end_date || '',
      totalAmount: reservation.total_amount || 0,
      status: reservation.status
    }));
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    return [];
  }
}

export async function getTreeOperations(): Promise<TreeOperation[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: operations, error } = await supabase
      .from('tree_operations')
      .select(`
        id,
        operation_type,
        operation_date,
        trees_count,
        status_report,
        notes,
        farms (
          name
        )
      `)
      .eq('investor_id', user.id)
      .order('operation_date', { ascending: false })
      .limit(20);

    if (error) throw error;

    const operationsWithMedia = await Promise.all(
      (operations || []).map(async (op) => {
        const { data: media } = await supabase
          .from('tree_operation_media')
          .select('media_type, media_url, caption')
          .eq('operation_id', op.id);

        return {
          id: op.id,
          farmName: op.farms?.name || 'مزرعة غير معروفة',
          operationType: op.operation_type,
          operationDate: op.operation_date,
          treesCount: op.trees_count,
          statusReport: op.status_report || '',
          notes: op.notes,
          media: (media || []).map(m => ({
            type: m.media_type as 'photo' | 'video',
            url: m.media_url,
            caption: m.caption
          }))
        };
      })
    );

    return operationsWithMedia;
  } catch (error) {
    console.error('Error fetching tree operations:', error);
    return [];
  }
}

export async function getUserTreesSummary(): Promise<UserTreesSummary> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        totalTrees: 0,
        totalFarms: 0,
        activeReservations: 0,
        recentOperations: 0
      };
    }

    const [reservationsData, operationsData] = await Promise.all([
      supabase
        .from('reservations')
        .select('trees_count, farm_id')
        .eq('investor_id', user.id)
        .eq('status', 'confirmed'),
      supabase
        .from('tree_operations')
        .select('id')
        .eq('investor_id', user.id)
        .gte('operation_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    const totalTrees = (reservationsData.data || []).reduce((sum, r) => sum + (r.trees_count || 0), 0);
    const uniqueFarms = new Set((reservationsData.data || []).map(r => r.farm_id));

    return {
      totalTrees,
      totalFarms: uniqueFarms.size,
      activeReservations: (reservationsData.data || []).length,
      recentOperations: (operationsData.data || []).length
    };
  } catch (error) {
    console.error('Error fetching user trees summary:', error);
    return {
      totalTrees: 0,
      totalFarms: 0,
      activeReservations: 0,
      recentOperations: 0
    };
  }
}

export function getOperationTypeLabel(type: string): string {
  return operationTypeLabels[type as keyof typeof operationTypeLabels] || type;
}
