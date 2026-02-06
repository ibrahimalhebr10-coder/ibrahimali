import { supabase } from '../lib/supabase';

export type IdentityType = 'agricultural' | 'investment';

export interface UserIdentity {
  userId: string;
  primaryIdentity: IdentityType;
  secondaryIdentity: IdentityType | null;
  secondaryIdentityEnabled: boolean;
}

class IdentityService {
  async getUserIdentity(userId: string): Promise<UserIdentity | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, primary_identity, secondary_identity, secondary_identity_enabled')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user identity:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        userId: data.id,
        primaryIdentity: data.primary_identity as IdentityType,
        secondaryIdentity: data.secondary_identity as IdentityType | null,
        secondaryIdentityEnabled: data.secondary_identity_enabled
      };
    } catch (error) {
      console.error('Error in getUserIdentity:', error);
      return null;
    }
  }

  async setPrimaryIdentity(userId: string, identity: IdentityType): Promise<boolean> {
    try {
      const currentProfile = await this.getUserIdentity(userId);

      if (!currentProfile) {
        console.error('User profile not found');
        return false;
      }

      if (currentProfile.secondaryIdentity && currentProfile.secondaryIdentity === identity) {
        const { error } = await supabase
          .from('user_profiles')
          .update({
            primary_identity: identity,
            secondary_identity: null
          })
          .eq('id', userId);

        if (error) {
          console.error('Error setting primary identity (with secondary reset):', error);
          return false;
        }
      } else {
        const { error } = await supabase
          .from('user_profiles')
          .update({ primary_identity: identity })
          .eq('id', userId);

        if (error) {
          console.error('Error setting primary identity:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error in setPrimaryIdentity:', error);
      return false;
    }
  }

  async setSecondaryIdentity(
    userId: string,
    secondaryIdentity: IdentityType | null
  ): Promise<boolean> {
    try {
      const identity = await this.getUserIdentity(userId);

      if (!identity) {
        console.error('User profile not found');
        return false;
      }

      if (secondaryIdentity && secondaryIdentity === identity.primaryIdentity) {
        console.error('Secondary identity cannot be the same as primary identity');
        return false;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          secondary_identity: secondaryIdentity,
          secondary_identity_enabled: false
        })
        .eq('id', userId);

      if (error) {
        console.error('Error setting secondary identity:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in setSecondaryIdentity:', error);
      return false;
    }
  }

  async enableSecondaryIdentity(userId: string, secondaryIdentity: IdentityType): Promise<boolean> {
    try {
      const identity = await this.getUserIdentity(userId);

      if (!identity) {
        console.error('User profile not found');
        return false;
      }

      if (secondaryIdentity === identity.primaryIdentity) {
        console.error('Secondary identity cannot be the same as primary identity');
        return false;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          secondary_identity: secondaryIdentity,
          secondary_identity_enabled: true
        })
        .eq('id', userId);

      if (error) {
        console.error('Error enabling secondary identity:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in enableSecondaryIdentity:', error);
      return false;
    }
  }

  async disableSecondaryIdentity(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          secondary_identity: null,
          secondary_identity_enabled: false
        })
        .eq('id', userId);

      if (error) {
        console.error('Error disabling secondary identity:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in disableSecondaryIdentity:', error);
      return false;
    }
  }

  async switchIdentities(userId: string): Promise<boolean> {
    try {
      const identity = await this.getUserIdentity(userId);

      if (!identity) {
        console.error('User profile not found');
        return false;
      }

      if (!identity.secondaryIdentity || !identity.secondaryIdentityEnabled) {
        console.error('Secondary identity is not enabled');
        return false;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          primary_identity: identity.secondaryIdentity,
          secondary_identity: identity.primaryIdentity
        })
        .eq('id', userId);

      if (error) {
        console.error('Error switching identities:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in switchIdentities:', error);
      return false;
    }
  }

  async hasSecondaryIdentity(userId: string): Promise<boolean> {
    try {
      const identity = await this.getUserIdentity(userId);

      if (!identity) {
        return false;
      }

      return identity.secondaryIdentity !== null && identity.secondaryIdentityEnabled;
    } catch (error) {
      console.error('Error in hasSecondaryIdentity:', error);
      return false;
    }
  }

  async getCurrentIdentity(userId: string): Promise<IdentityType> {
    try {
      const identity = await this.getUserIdentity(userId);
      return identity?.primaryIdentity || 'agricultural';
    } catch (error) {
      console.error('Error in getCurrentIdentity:', error);
      return 'agricultural';
    }
  }

  getIdentityLabel(identity: IdentityType): string {
    return identity === 'agricultural' ? 'مزارع' : 'مستثمر';
  }

  getIdentityColor(identity: IdentityType): string {
    return identity === 'agricultural' ? '#3aa17e' : '#d4af37';
  }

  getIdentityDescription(identity: IdentityType): string {
    return identity === 'agricultural' ? 'أنت في رحلة زراعية' : 'أنت في رحلة استثمارية';
  }
}

export const identityService = new IdentityService();
