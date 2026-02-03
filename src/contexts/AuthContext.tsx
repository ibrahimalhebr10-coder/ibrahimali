import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { identityService, type IdentityType } from '../services/identityService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  identity: IdentityType;
  identityLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateIdentity: (newIdentity: IdentityType) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState<IdentityType>('agricultural');
  const [identityLoading, setIdentityLoading] = useState(false);

  useEffect(() => {
    async function loadIdentity(userId: string) {
      setIdentityLoading(true);
      try {
        const userIdentity = await identityService.getUserIdentity(userId);
        if (userIdentity) {
          setIdentity(userIdentity.primaryIdentity);
        } else {
          const savedMode = localStorage.getItem('appMode');
          const fallbackIdentity: IdentityType =
            (savedMode === 'agricultural' || savedMode === 'investment') ? savedMode : 'agricultural';
          setIdentity(fallbackIdentity);
          await identityService.setPrimaryIdentity(userId, fallbackIdentity);
        }
      } catch (error) {
        console.error('Error loading identity:', error);
        const savedMode = localStorage.getItem('appMode');
        const fallbackIdentity: IdentityType =
          (savedMode === 'agricultural' || savedMode === 'investment') ? savedMode : 'agricultural';
        setIdentity(fallbackIdentity);
      } finally {
        setIdentityLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
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

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateIdentity = async (newIdentity: IdentityType): Promise<boolean> => {
    if (user) {
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

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        identity,
        identityLoading,
        signUp,
        signIn,
        signOut,
        updateIdentity
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
