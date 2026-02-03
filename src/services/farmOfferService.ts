import { supabase } from '../lib/supabase';

export interface TreeVariety {
  type: string;
  count: number;
}

export interface FarmOfferData {
  ownerName: string;
  phone: string;
  email?: string;
  location: string;
  treeVarieties: TreeVariety[];
  hasLegalDocs: 'yes' | 'no' | 'partial';
  offerType: 'sale' | 'full_lease' | 'partnership';
  proposedPrice?: number;
  partnershipAcknowledgment?: boolean;
  additionalNotes?: string;
}

export interface FarmOffer {
  id: string;
  reference_number: string;
  owner_name: string;
  phone: string;
  email?: string;
  location: string;
  current_crop_type: string;
  tree_count: number;
  tree_varieties: TreeVariety[];
  total_tree_count: number;
  has_legal_docs: 'yes' | 'no' | 'partial';
  offer_type: 'sale' | 'full_lease' | 'partnership';
  proposed_price?: number;
  partnership_acknowledgment: boolean;
  additional_notes?: string;
  status: 'under_review' | 'preliminary_accepted' | 'contacted' | 'not_suitable';
  submitted_at: string;
  last_updated_at: string;
  decision_at?: string;
  admin_notes?: string;
  rejection_reason?: string;
  field_visit_date?: string;
  field_visit_notes?: string;
}

export interface FarmOfferTimeline {
  id: string;
  offer_id: string;
  status: string;
  note?: string;
  created_by?: string;
  created_at: string;
}

export const farmOfferService = {
  async submitOffer(data: FarmOfferData): Promise<{ success: boolean; offer?: FarmOffer; error?: string }> {
    try {
      const totalTreeCount = data.treeVarieties.reduce((sum, variety) => sum + variety.count, 0);
      const firstTreeType = data.treeVarieties.length > 0 ? data.treeVarieties[0].type : '';

      const { data: offer, error } = await supabase
        .from('farm_offers')
        .insert([{
          owner_name: data.ownerName,
          phone: data.phone,
          email: data.email,
          location: data.location,
          current_crop_type: firstTreeType,
          tree_count: totalTreeCount,
          tree_varieties: data.treeVarieties,
          total_tree_count: totalTreeCount,
          has_legal_docs: data.hasLegalDocs,
          offer_type: data.offerType,
          proposed_price: data.proposedPrice,
          partnership_acknowledgment: data.partnershipAcknowledgment || false,
          additional_notes: data.additionalNotes
        }])
        .select()
        .single();

      if (error) {
        console.error('Error submitting farm offer:', error);
        return { success: false, error: error.message };
      }

      return { success: true, offer };
    } catch (error) {
      console.error('Error submitting farm offer:', error);
      return { success: false, error: 'حدث خطأ أثناء إرسال الطلب' };
    }
  },

  async getOfferByReference(referenceNumber: string): Promise<{ success: boolean; offer?: FarmOffer; error?: string }> {
    try {
      const { data: offer, error } = await supabase
        .from('farm_offers')
        .select('*')
        .eq('reference_number', referenceNumber)
        .maybeSingle();

      if (error) {
        console.error('Error fetching offer:', error);
        return { success: false, error: error.message };
      }

      if (!offer) {
        return { success: false, error: 'الطلب غير موجود' };
      }

      return { success: true, offer };
    } catch (error) {
      console.error('Error fetching offer:', error);
      return { success: false, error: 'حدث خطأ أثناء جلب البيانات' };
    }
  },

  async getOfferTimeline(offerId: string): Promise<{ success: boolean; timeline?: FarmOfferTimeline[]; error?: string }> {
    try {
      const { data: timeline, error } = await supabase
        .from('farm_offer_timeline')
        .select('*')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching timeline:', error);
        return { success: false, error: error.message };
      }

      return { success: true, timeline: timeline || [] };
    } catch (error) {
      console.error('Error fetching timeline:', error);
      return { success: false, error: 'حدث خطأ أثناء جلب التاريخ' };
    }
  },

  async getAllOffers(): Promise<{ success: boolean; offers?: FarmOffer[]; error?: string }> {
    try {
      const { data: offers, error } = await supabase
        .from('farm_offers')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching offers:', error);
        return { success: false, error: error.message };
      }

      return { success: true, offers: offers || [] };
    } catch (error) {
      console.error('Error fetching offers:', error);
      return { success: false, error: 'حدث خطأ أثناء جلب الطلبات' };
    }
  },

  async updateOfferStatus(
    offerId: string,
    status: FarmOffer['status'],
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        status,
        last_updated_at: new Date().toISOString()
      };

      if (adminNotes !== undefined) {
        updateData.admin_notes = adminNotes;
      }

      const { error } = await supabase
        .from('farm_offers')
        .update(updateData)
        .eq('id', offerId);

      if (error) {
        console.error('Error updating offer status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating offer status:', error);
      return { success: false, error: 'حدث خطأ أثناء تحديث الحالة' };
    }
  },

  async getOfferStats(): Promise<{
    total: number;
    under_review: number;
    preliminary_accepted: number;
    contacted: number;
    not_suitable: number;
  }> {
    try {
      const { data: allOffers } = await supabase
        .from('farm_offers')
        .select('status');

      if (!allOffers || allOffers.length === 0) {
        return {
          total: 0,
          under_review: 0,
          preliminary_accepted: 0,
          contacted: 0,
          not_suitable: 0
        };
      }

      return {
        total: allOffers.length,
        under_review: allOffers.filter(o => o.status === 'under_review').length,
        preliminary_accepted: allOffers.filter(o => o.status === 'preliminary_accepted').length,
        contacted: allOffers.filter(o => o.status === 'contacted').length,
        not_suitable: allOffers.filter(o => o.status === 'not_suitable').length
      };
    } catch (error) {
      console.error('Error getting offer stats:', error);
      return {
        total: 0,
        under_review: 0,
        preliminary_accepted: 0,
        contacted: 0,
        not_suitable: 0
      };
    }
  }
};
