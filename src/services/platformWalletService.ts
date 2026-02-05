import { supabase } from '../lib/supabase';

export interface PlatformWalletTransfer {
  id: string;
  farm_id: string;
  transfer_amount: number;
  platform_share: number;
  charity_share: number;
  transferred_by: string;
  transferred_at: string;
}

export interface WalletSummary {
  total_transferred: number;
  platform_balance: number;
  charity_balance: number;
}

export const platformWalletService = {
  async getWalletSummary() {
    const { data, error } = await supabase
      .rpc('get_platform_wallet_summary');

    if (error) throw error;
    return data[0] as WalletSummary;
  },

  async getTransferHistory() {
    const { data, error } = await supabase
      .from('platform_wallet_transfers')
      .select(`
        *,
        farms:farm_id(name, name_ar)
      `)
      .order('transferred_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async transferToWallet(farmId: string, amount: number) {
    const { data, error } = await supabase
      .rpc('transfer_to_platform_wallet', {
        p_farm_id: farmId,
        p_amount: amount
      });

    if (error) throw error;
    return data;
  }
};
