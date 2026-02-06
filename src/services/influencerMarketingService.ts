import { supabase } from '../lib/supabase';

export interface InfluencerPartner {
  id: string;
  name: string;
  display_name: string | null;
  phone: string | null;
  user_id: string | null;
  is_active: boolean;
  status: string | null;
  total_bookings: number;
  total_trees_booked: number;
  total_rewards_earned: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface InfluencerSettings {
  id: string;
  is_system_active: boolean;
  trees_required_for_reward: number;
  reward_type: string;
  congratulation_message_ar: string;
  congratulation_message_en: string;
  featured_package_color: string;
  featured_package_border_style: string;
  featured_package_congratulation_text: string;
  featured_package_benefit_description: string;
  featured_package_benefit_type: string;
  auto_activate_partners: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface FeaturedPackageSettings {
  color: string;
  borderStyle: 'solid' | 'dashed' | 'double' | 'gradient';
  congratulationText: string;
  name: string;
  price: number;
  contractDuration: number;
  bonusDuration: number;
  description: string;
  highlightText: string;
  successTitle: string;
  successSubtitle: string;
  successDescription: string;
  successBenefits: string[];
}

export interface CreateInfluencerPartnerData {
  name: string;
  display_name?: string;
  phone?: string;
  is_active?: boolean;
  notes?: string;
}

export interface UpdateInfluencerPartnerData {
  name?: string;
  display_name?: string;
  is_active?: boolean;
  notes?: string;
}

export interface InfluencerStats {
  name: string;
  display_name: string | null;
  total_bookings: number;
  total_trees_booked: number;
  total_rewards_earned: number;
  trees_in_current_batch: number;
  trees_until_next_reward: number;
  progress_percentage: number;
  trees_required_for_reward: number;
}

export interface InfluencerActivityLog {
  id: string;
  created_at: string;
  activity_date: string;
  farm_name: string;
  farm_location: string | null;
  trees_referred: number;
  trees_earned: number;
  trees_in_current_batch: number;
  trees_until_next_reward: number;
  notes: string | null;
}

export const influencerMarketingService = {
  async verifyInfluencerCode(code: string): Promise<{ isValid: boolean; partner: InfluencerPartner | null; message: string }> {
    if (!code || !code.trim()) {
      return {
        isValid: false,
        partner: null,
        message: 'الرجاء إدخال كود صحيح'
      };
    }

    const { data, error } = await supabase
      .from('influencer_partners')
      .select('*')
      .eq('name', code.trim())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          isValid: false,
          partner: null,
          message: 'الكود غير مسجل في النظام'
        };
      }
      throw error;
    }

    if (!data.is_active) {
      return {
        isValid: false,
        partner: null,
        message: 'هذا الكود غير نشط، يرجى التواصل مع الإدارة'
      };
    }

    return {
      isValid: true,
      partner: data,
      message: 'تم التحقق من الكود بنجاح'
    };
  },

  async getAllPartners(): Promise<InfluencerPartner[]> {
    const { data, error } = await supabase
      .from('influencer_partners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPartnerById(id: string): Promise<InfluencerPartner | null> {
    const { data, error } = await supabase
      .from('influencer_partners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async getPartnerByName(name: string): Promise<InfluencerPartner | null> {
    const { data, error } = await supabase
      .rpc('get_influencer_by_name', { partner_name: name });

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async checkPartnerExists(name: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('check_influencer_exists', { partner_name: name });

    if (error) throw error;
    return data || false;
  },

  async createPartner(partnerData: CreateInfluencerPartnerData): Promise<InfluencerPartner> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('influencer_partners')
      .insert([{
        ...partnerData,
        created_by: user?.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePartner(id: string, updates: UpdateInfluencerPartnerData): Promise<InfluencerPartner> {
    const { data, error } = await supabase
      .from('influencer_partners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePartner(id: string): Promise<void> {
    const { error } = await supabase
      .from('influencer_partners')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async togglePartnerStatus(id: string, isActive: boolean): Promise<InfluencerPartner> {
    return this.updatePartner(id, { is_active: isActive });
  },

  async getSettings(): Promise<InfluencerSettings | null> {
    const { data, error } = await supabase
      .from('influencer_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async updateSettings(updates: Partial<InfluencerSettings>): Promise<InfluencerSettings> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('influencer_settings')
      .update({
        ...updates,
        updated_by: user?.id
      })
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSystemSettings() {
    const { data, error } = await supabase
      .rpc('get_influencer_system_settings');

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async getAllStats() {
    const { data, error } = await supabase
      .rpc('get_all_influencer_stats');

    if (error) throw error;
    return data || [];
  },

  async getActivePartners(): Promise<InfluencerPartner[]> {
    const { data, error } = await supabase
      .from('influencer_partners')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getMyInfluencerStats(): Promise<InfluencerStats | null> {
    const { data, error } = await supabase
      .from('influencer_rewards_details')
      .select('referral_code, partner_name, total_bookings, total_trees_booked, total_rewards_earned, trees_in_current_batch, trees_until_next_reward, progress_percentage, trees_required_for_reward')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return {
      name: data.referral_code,
      display_name: data.partner_name,
      total_bookings: data.total_bookings,
      total_trees_booked: data.total_trees_booked,
      total_rewards_earned: data.total_rewards_earned,
      trees_in_current_batch: data.trees_in_current_batch,
      trees_until_next_reward: data.trees_until_next_reward,
      progress_percentage: data.progress_percentage,
      trees_required_for_reward: data.trees_required_for_reward
    };
  },

  async getMyActivityLog(): Promise<InfluencerActivityLog[]> {
    const { data, error } = await supabase
      .from('influencer_activity_log')
      .select('id, created_at, activity_date, farm_name, farm_location, trees_referred, trees_earned, trees_in_current_batch, trees_until_next_reward, notes')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  async checkIfUserIsInfluencer(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('influencer_partners')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      throw error;
    }

    return !!data;
  },

  async getFeaturedPackageSettings(): Promise<FeaturedPackageSettings | null> {
    const [influencerSettingsResult, systemSettingsResult] = await Promise.all([
      supabase
        .from('influencer_settings')
        .select(`
          featured_package_color,
          featured_package_border_style,
          featured_package_congratulation_text,
          featured_package_name,
          featured_package_price,
          featured_package_contract_duration,
          featured_package_bonus_duration,
          featured_package_description,
          featured_package_highlight_text
        `)
        .limit(1)
        .single(),
      supabase
        .from('system_settings')
        .select('key, value')
        .in('key', [
          'influencer_success_title',
          'influencer_success_subtitle',
          'influencer_success_description',
          'influencer_success_benefits'
        ])
    ]);

    if (influencerSettingsResult.error) {
      if (influencerSettingsResult.error.code === 'PGRST116') {
        return null;
      }
      throw influencerSettingsResult.error;
    }

    const data = influencerSettingsResult.data;
    const systemSettings = systemSettingsResult.data || [];

    const getSystemSetting = (key: string, defaultValue: string): string => {
      const setting = systemSettings.find(s => s.key === key);
      return setting ? setting.value : defaultValue;
    };

    const benefitsValue = getSystemSetting(
      'influencer_success_benefits',
      '["6 أشهر إضافية على مدة العقد", "نفس السعر بدون زيادة", "أولوية في الخدمات"]'
    );

    let benefitsArray: string[];
    try {
      benefitsArray = JSON.parse(benefitsValue);
    } catch {
      benefitsArray = ['6 أشهر إضافية على مدة العقد', 'نفس السعر بدون زيادة', 'أولوية في الخدمات'];
    }

    return {
      color: data.featured_package_color || '#d4af37',
      borderStyle: data.featured_package_border_style || 'solid',
      congratulationText: data.featured_package_congratulation_text || 'مبرووووك! 🎉',
      name: data.featured_package_name || 'الباقة الذهبية',
      price: data.featured_package_price || 150,
      contractDuration: data.featured_package_contract_duration || 10,
      bonusDuration: data.featured_package_bonus_duration || 6,
      description: data.featured_package_description || 'باقة خاصة لعملاء شركاء المسيرة مع مميزات إضافية',
      highlightText: data.featured_package_highlight_text || '+6 أشهر إضافية مجاناً',
      successTitle: getSystemSetting('influencer_success_title', 'مبروووك! 🎉'),
      successSubtitle: getSystemSetting('influencer_success_subtitle', 'تم فتح باقة مميزة خصيصاً لك!'),
      successDescription: getSystemSetting('influencer_success_description', 'احصل على 6 أشهر إضافية مجاناً'),
      successBenefits: benefitsArray
    };
  },

  async updateFeaturedPackageSettings(settings: Partial<FeaturedPackageSettings>): Promise<void> {
    const updateData: any = {};

    if (settings.color !== undefined) updateData.featured_package_color = settings.color;
    if (settings.borderStyle !== undefined) updateData.featured_package_border_style = settings.borderStyle;
    if (settings.congratulationText !== undefined) updateData.featured_package_congratulation_text = settings.congratulationText;
    if (settings.name !== undefined) updateData.featured_package_name = settings.name;
    if (settings.price !== undefined) updateData.featured_package_price = settings.price;
    if (settings.contractDuration !== undefined) updateData.featured_package_contract_duration = settings.contractDuration;
    if (settings.bonusDuration !== undefined) updateData.featured_package_bonus_duration = settings.bonusDuration;
    if (settings.description !== undefined) updateData.featured_package_description = settings.description;
    if (settings.highlightText !== undefined) updateData.featured_package_highlight_text = settings.highlightText;

    const { data: currentSettings } = await supabase
      .from('influencer_settings')
      .select('id')
      .limit(1)
      .single();

    if (currentSettings) {
      const { error } = await supabase
        .from('influencer_settings')
        .update(updateData)
        .eq('id', currentSettings.id);

      if (error) throw error;
    }

    const systemSettingsUpdates: Array<{ key: string; value: string }> = [];

    if (settings.successTitle !== undefined) {
      systemSettingsUpdates.push({
        key: 'influencer_success_title',
        value: settings.successTitle
      });
    }

    if (settings.successSubtitle !== undefined) {
      systemSettingsUpdates.push({
        key: 'influencer_success_subtitle',
        value: settings.successSubtitle
      });
    }

    if (settings.successDescription !== undefined) {
      systemSettingsUpdates.push({
        key: 'influencer_success_description',
        value: settings.successDescription
      });
    }

    if (settings.successBenefits !== undefined) {
      systemSettingsUpdates.push({
        key: 'influencer_success_benefits',
        value: JSON.stringify(settings.successBenefits)
      });
    }

    for (const update of systemSettingsUpdates) {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: update.value })
        .eq('key', update.key);

      if (error) throw error;
    }
  }
};
