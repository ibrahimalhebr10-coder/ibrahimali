import { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AccountLoginSelector from './AccountLoginSelector';
import DualAccountSelector from './DualAccountSelector';

interface QuickAccountAccessProps {
  onLogin: () => void;
  onRegister: () => void;
  onOpenRegularAccount: () => void;
  onOpenPartnerAccount: () => void;
  onClose: () => void;
}

type AccountType = 'none' | 'regular' | 'partner' | 'both';

export default function QuickAccountAccess({
  onLogin,
  onRegister,
  onOpenRegularAccount,
  onOpenPartnerAccount,
  onClose
}: QuickAccountAccessProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState<AccountType>('none');

  useEffect(() => {
    checkAccountType();
  }, [user]);

  const checkAccountType = async () => {
    try {
      setLoading(true);

      console.log('🔍 [QuickAccountAccess] Checking account type...');
      console.log('   User:', user?.id || 'NO USER');

      // If user is not logged in, show login selector
      if (!user) {
        console.log('❌ [QuickAccountAccess] No user - showing login selector');
        setAccountType('none');
        setLoading(false);
        return;
      }

      console.log('✅ [QuickAccountAccess] User found - calling RPC...');

      // Check account types
      const { data, error } = await supabase.rpc('get_user_account_types');

      if (error) {
        console.error('❌ [QuickAccountAccess] RPC Error:', error);
        setAccountType('none');
        return;
      }

      const result = data as any;
      const type = result?.account_type || 'none';

      console.log('📊 [QuickAccountAccess] RPC Result:');
      console.log('   Account Type:', type);
      console.log('   Primary Identity:', result?.primary_identity);
      console.log('   Has Regular:', result?.has_regular_account);
      console.log('   Has Partner:', result?.has_partner_account);

      setAccountType(type);

      // Smart routing based on account type
      if (type === 'regular') {
        console.log('🌳 [QuickAccountAccess] Opening regular account...');
        // Has regular account only - open it directly
        setTimeout(() => {
          onOpenRegularAccount();
          onClose();
        }, 100);
      } else if (type === 'partner') {
        console.log('⭐ [QuickAccountAccess] Opening partner account...');
        // Has partner account only - open it directly
        setTimeout(() => {
          onOpenPartnerAccount();
          onClose();
        }, 100);
      } else if (type === 'both') {
        console.log('🔀 [QuickAccountAccess] Has both accounts - showing selector');
        // Has both accounts - show selector
        // Keep selector visible
      } else {
        console.log('❓ [QuickAccountAccess] No account found - showing login selector');
        // No account - show login selector
        // Keep login selector visible
      }
    } catch (err) {
      console.error('Error in checkAccountType:', err);
      setAccountType('none');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-[60000] bg-black/60 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <Loader className="w-12 h-12 mx-auto text-emerald-600 animate-spin" />
          <p className="mt-4 text-emerald-800 font-semibold text-center">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show login selector
  if (!user || accountType === 'none') {
    return (
      <AccountLoginSelector
        onLogin={onLogin}
        onRegister={onRegister}
        onClose={onClose}
      />
    );
  }

  // Has both accounts - show dual selector
  if (accountType === 'both') {
    return (
      <DualAccountSelector
        onSelectRegular={() => {
          onOpenRegularAccount();
          onClose();
        }}
        onSelectPartner={() => {
          onOpenPartnerAccount();
          onClose();
        }}
      />
    );
  }

  // Single account types are handled in checkAccountType with auto-routing
  // This should not render, but just in case:
  return null;
}
