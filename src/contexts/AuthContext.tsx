import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { identityService, type IdentityType } from '../services/identityService';
import { deviceRecognitionService } from '../services/deviceRecognitionService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  identity: IdentityType;
  identityLoading: boolean;
  secondaryIdentity: IdentityType | null;
  secondaryIdentityEnabled: boolean;
  isTrustedDevice: boolean;
  signUp: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signOut: (fullLogout?: boolean) => Promise<void>;
  updateIdentity: (newIdentity: IdentityType) => Promise<boolean>;
  enableSecondaryIdentity: (secondaryIdentity: IdentityType) => Promise<boolean>;
  switchToSecondaryIdentity: () => Promise<boolean>;
  disableSecondaryIdentity: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState<IdentityType>('agricultural');
  const [identityLoading, setIdentityLoading] = useState(false);
  const [secondaryIdentity, setSecondaryIdentity] = useState<IdentityType | null>(null);
  const [secondaryIdentityEnabled, setSecondaryIdentityEnabled] = useState(false);
  const [isTrustedDevice, setIsTrustedDevice] = useState(false);

  useEffect(() => {
    async function loadIdentity(userId: string) {
      console.log('');
      console.log('🔐'.repeat(40));
      console.log('🔐 [AuthContext] Loading identity for user:', userId);
      console.log('🔐'.repeat(40));

      setIdentityLoading(true);
      try {
        // Check if user is an admin
        const { data: adminData } = await supabase
          .from('admins')
          .select('id, role')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle();

        if (adminData) {
          console.log('👤 [AuthContext] User is Admin - using localStorage mode only');
          const savedMode = localStorage.getItem('appMode');
          const fallbackIdentity: IdentityType =
            (savedMode === 'agricultural' || savedMode === 'investment') ? savedMode : 'agricultural';

          console.log('🔄 [AuthContext] Admin mode:', fallbackIdentity);
          setIdentity(fallbackIdentity);
          setSecondaryIdentity(null);
          setSecondaryIdentityEnabled(false);
          setIdentityLoading(false);
          console.log('🔐'.repeat(40));
          console.log('');
          return;
        }

        const userIdentity = await identityService.getUserIdentity(userId);
        console.log('📊 [AuthContext] getUserIdentity result:', userIdentity);

        if (userIdentity) {
          console.log('✅ [AuthContext] Identity found in database:');
          console.log('   Primary:', userIdentity.primaryIdentity);
          console.log('   Secondary:', userIdentity.secondaryIdentity);
          console.log('   Secondary Enabled:', userIdentity.secondaryIdentityEnabled);

          setIdentity(userIdentity.primaryIdentity);
          setSecondaryIdentity(userIdentity.secondaryIdentity);
          setSecondaryIdentityEnabled(userIdentity.secondaryIdentityEnabled);
        } else {
          console.log('⚠️ [AuthContext] No identity in database - using fallback');
          const savedMode = localStorage.getItem('appMode');
          console.log('📦 [AuthContext] localStorage appMode:', savedMode);

          const fallbackIdentity: IdentityType =
            (savedMode === 'agricultural' || savedMode === 'investment') ? savedMode : 'agricultural';

          console.log('🔄 [AuthContext] Using fallback identity:', fallbackIdentity);

          setIdentity(fallbackIdentity);
          setSecondaryIdentity(null);
          setSecondaryIdentityEnabled(false);
          await identityService.setPrimaryIdentity(userId, fallbackIdentity);
        }
      } catch (error) {
        console.error('❌ [AuthContext] Error loading identity:', error);
        const savedMode = localStorage.getItem('appMode');
        const fallbackIdentity: IdentityType =
          (savedMode === 'agricultural' || savedMode === 'investment') ? savedMode : 'agricultural';

        console.log('🔄 [AuthContext] Using emergency fallback:', fallbackIdentity);

        setIdentity(fallbackIdentity);
        setSecondaryIdentity(null);
        setSecondaryIdentityEnabled(false);
      } finally {
        setIdentityLoading(false);
        console.log('🔐'.repeat(40));
        console.log('');
      }
    }

    setIsTrustedDevice(deviceRecognitionService.isTrustedDevice());

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        loadIdentity(session.user.id);

        if (!deviceRecognitionService.getDeviceFingerprint()) {
          const fingerprint = deviceRecognitionService.generateFingerprint();
          deviceRecognitionService.saveDeviceFingerprint(fingerprint);
        }
      } else {
        const savedMode = localStorage.getItem('appMode');
        const fallbackIdentity: IdentityType =
          (savedMode === 'agricultural' || savedMode === 'investment') ? savedMode : 'agricultural';
        setIdentity(fallbackIdentity);
      }

      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        loadIdentity(session.user.id);
      } else {
        const savedMode = localStorage.getItem('appMode');
        const fallbackIdentity: IdentityType =
          (savedMode === 'agricultural' || savedMode === 'investment') ? savedMode : 'agricultural';
        setIdentity(fallbackIdentity);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (rememberMe) {
        deviceRecognitionService.setRememberMe(true);
        deviceRecognitionService.markAsTrustedDevice();
        setIsTrustedDevice(true);

        const fingerprint = deviceRecognitionService.generateFingerprint();
        deviceRecognitionService.saveDeviceFingerprint(fingerprint);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (rememberMe) {
        deviceRecognitionService.setRememberMe(true);
        deviceRecognitionService.markAsTrustedDevice();
        setIsTrustedDevice(true);

        const fingerprint = deviceRecognitionService.generateFingerprint();
        deviceRecognitionService.saveDeviceFingerprint(fingerprint);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async (fullLogout: boolean = false) => {
    await supabase.auth.signOut();

    if (fullLogout) {
      deviceRecognitionService.clearDeviceData();
      setIsTrustedDevice(false);
    }
  };

  const updateIdentity = async (newIdentity: IdentityType): Promise<boolean> => {
    if (user) {
      // Check if user is admin
      const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (adminData) {
        // Admin - only update localStorage and state
        console.log('👤 [AuthContext] Admin identity switch to:', newIdentity);
        setIdentity(newIdentity);
        localStorage.setItem('appMode', newIdentity);

        // Trigger a state change to force re-render
        window.dispatchEvent(new CustomEvent('admin-identity-changed', { detail: { identity: newIdentity } }));
        return true;
      }

      // Regular user - update database
      const success = await identityService.setPrimaryIdentity(user.id, newIdentity);
      if (success) {
        setIdentity(newIdentity);
        localStorage.setItem('appMode', newIdentity);
        return true;
      }
      return false;
    } else {
      setIdentity(newIdentity);
      localStorage.setItem('appMode', newIdentity);
      return true;
    }
  };

  const enableSecondaryIdentity = async (newSecondaryIdentity: IdentityType): Promise<boolean> => {
    if (!user) {
      return false;
    }

    const success = await identityService.enableSecondaryIdentity(user.id, newSecondaryIdentity);
    if (success) {
      setSecondaryIdentity(newSecondaryIdentity);
      setSecondaryIdentityEnabled(true);
      return true;
    }
    return false;
  };

  const switchToSecondaryIdentity = async (): Promise<boolean> => {
    if (!user || !secondaryIdentity || !secondaryIdentityEnabled) {
      return false;
    }

    const success = await identityService.switchIdentities(user.id);
    if (success) {
      const temp = identity;
      setIdentity(secondaryIdentity);
      setSecondaryIdentity(temp);
      localStorage.setItem('appMode', secondaryIdentity);
      return true;
    }
    return false;
  };

  const disableSecondaryIdentity = async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    const success = await identityService.disableSecondaryIdentity(user.id);
    if (success) {
      setSecondaryIdentity(null);
      setSecondaryIdentityEnabled(false);
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        identity,
        identityLoading,
        secondaryIdentity,
        secondaryIdentityEnabled,
        isTrustedDevice,
        signUp,
        signIn,
        signOut,
        updateIdentity,
        enableSecondaryIdentity,
        switchToSecondaryIdentity,
        disableSecondaryIdentity
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
