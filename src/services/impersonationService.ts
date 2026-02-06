import { supabase } from '../lib/supabase';

interface ImpersonationData {
  partnerId: string;
  partnerName: string;
  partnerPhone: string;
  adminUserId: string;
  timestamp: number;
}

const IMPERSONATION_KEY = 'partner_impersonation';

class ImpersonationService {
  startImpersonation(data: Omit<ImpersonationData, 'timestamp'>): void {
    const impersonationData: ImpersonationData = {
      ...data,
      timestamp: Date.now()
    };

    console.log('🎭 [Impersonation] Starting impersonation:', impersonationData);
    localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(impersonationData));
  }

  getImpersonationData(): ImpersonationData | null {
    const data = localStorage.getItem(IMPERSONATION_KEY);
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  isImpersonating(): boolean {
    return this.getImpersonationData() !== null;
  }

  stopImpersonation(): void {
    console.log('🔴 [Impersonation] Stopping impersonation');
    localStorage.removeItem(IMPERSONATION_KEY);
  }

  async getImpersonatedPartnerData(partnerId: string) {
    const { data, error } = await supabase
      .from('influencer_partners')
      .select('id, name, display_name, phone, user_id, is_active, status')
      .eq('id', partnerId)
      .single();

    if (error || !data) {
      console.error('❌ [Impersonation] Failed to get partner data:', error);
      return null;
    }

    return data;
  }
}

export const impersonationService = new ImpersonationService();
