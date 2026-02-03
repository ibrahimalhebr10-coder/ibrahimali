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
  status: 'submitted' | 'under_review' | 'technical_eval' | 'field_visit_scheduled' | 'field_visit_done' | 'approved' | 'rejected';
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
    adminNotes?: string,
    rejectionReason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        status,
        admin_notes: adminNotes,
        last_updated_at: new Date().toISOString()
      };

      if (status === 'approved' || status === 'rejected') {
        updateData.decision_at = new Date().toISOString();
      }

      if (status === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
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

  async getAcceptanceRate(): Promise<{ rate: number; total: number; accepted: number }> {
    try {
      const { data: allOffers } = await supabase
        .from('farm_offers')
        .select('status');

      if (!allOffers || allOffers.length === 0) {
        return { rate: 0, total: 0, accepted: 0 };
      }

      const accepted = allOffers.filter(o => o.status === 'approved').length;
      const rate = (accepted / allOffers.length) * 100;

      return { rate, total: allOffers.length, accepted };
    } catch (error) {
      console.error('Error getting acceptance rate:', error);
      return { rate: 0, total: 0, accepted: 0 };
    }
  }
};
