import { supabase } from '../lib/supabase';

export interface ExpansionOpportunity {
  id: string;
  opportunityType: 'add_trees' | 'new_farm' | 'upgrade_contract';
  title: string;
  description: string;
  relatedFarmId?: string;
  relatedFarmName?: string;
  treesCount?: number;
  estimatedValue?: number;
  ctaButtonText: string;
  isActive: boolean;
  priority: number;
}

const opportunityTypeLabels: Record<string, string> = {
  add_trees: 'زيادة أشجار',
  new_farm: 'مزرعة جديدة',
  upgrade_contract: 'ترقية عقد'
};

export async function getExpansionOpportunities(): Promise<ExpansionOpportunity[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('expansion_opportunities')
      .select(`
        *,
        farms (
          id,
          name
        )
      `)
      .or(`investor_id.eq.${user.id},investor_id.is.null`)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(opp => ({
      id: opp.id,
      opportunityType: opp.opportunity_type,
      title: opp.title,
      description: opp.description,
      relatedFarmId: opp.related_farm_id,
      relatedFarmName: opp.farms?.name,
      treesCount: opp.trees_count,
      estimatedValue: opp.estimated_value,
      ctaButtonText: opp.cta_button_text,
      isActive: opp.is_active,
      priority: opp.priority
    }));
  } catch (error) {
    console.error('Error fetching expansion opportunities:', error);
    return [];
  }
}

export async function getPersonalizedOpportunities(): Promise<ExpansionOpportunity[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select('farm_id, farms(id, name)')
      .eq('investor_id', user.id)
      .eq('status', 'confirmed')
      .limit(1);

    if (resError || !reservations || reservations.length === 0) {
      return getExpansionOpportunities();
    }

    const currentFarmId = reservations[0].farm_id;

    const { data, error } = await supabase
      .from('expansion_opportunities')
      .select(`
        *,
        farms (
          id,
          name
        )
      `)
      .or(`investor_id.eq.${user.id},related_farm_id.eq.${currentFarmId},investor_id.is.null`)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(opp => ({
      id: opp.id,
      opportunityType: opp.opportunity_type,
      title: opp.title,
      description: opp.description,
      relatedFarmId: opp.related_farm_id,
      relatedFarmName: opp.farms?.name,
      treesCount: opp.trees_count,
      estimatedValue: opp.estimated_value,
      ctaButtonText: opp.cta_button_text,
      isActive: opp.is_active,
      priority: opp.priority
    }));
  } catch (error) {
    console.error('Error fetching personalized opportunities:', error);
    return [];
  }
}

export function getOpportunityTypeLabel(type: string): string {
  return opportunityTypeLabels[type] || type;
}
