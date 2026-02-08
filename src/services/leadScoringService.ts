import { supabase } from '../lib/supabase';

export interface LeadActivity {
  user_id?: string;
  session_id: string;
  activity_type: string;
  activity_data?: Record<string, any>;
  points_awarded?: number;
  page_url?: string;
}

export interface LeadScore {
  id: string;
  user_id?: string;
  session_id: string;
  total_points: number;
  temperature: 'cold' | 'warm' | 'hot' | 'burning';
  conversion_stage: string;
  last_activity_at: string;
  first_seen_at: string;
  phone?: string;
  email?: string;
  full_name?: string;
  activities_count?: number;
  last_activity_type?: string;
}

class LeadScoringService {
  private sessionId: string;
  private initialized = false;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('lead_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('lead_session_id', sessionId);
    }
    return sessionId;
  }

  async initialize() {
    if (this.initialized) {
      console.log('🔄 [Lead Tracking] Already initialized');
      return;
    }

    console.log('🚀 [Lead Tracking] Initializing...');
    console.log('📱 Session ID:', this.sessionId);

    await this.trackActivity('page_visit', {
      user_agent: navigator.userAgent,
      screen_size: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language
    });

    this.initialized = true;
    console.log('✅ [Lead Tracking] Initialized successfully');
  }

  async trackActivity(
    activityType: string,
    activityData: Record<string, any> = {},
    customPoints?: number
  ): Promise<void> {
    try {
      console.log(`📊 [Lead Tracking] Tracking activity: ${activityType}`);

      const { data: { user } } = await supabase.auth.getUser();
      console.log(`👤 [Lead Tracking] User ID: ${user?.id || 'Anonymous'}`);

      let points = customPoints;
      if (points === undefined) {
        const { data: rule } = await supabase
          .from('conversion_rules')
          .select('points')
          .eq('activity_type', activityType)
          .eq('is_active', true)
          .maybeSingle();

        points = rule?.points || 0;
        console.log(`🎯 [Lead Tracking] Points for ${activityType}: ${points}`);
      }

      const activity: LeadActivity = {
        user_id: user?.id,
        session_id: this.sessionId,
        activity_type: activityType,
        activity_data: activityData,
        points_awarded: points,
        page_url: window.location.pathname
      };

      console.log(`💾 [Lead Tracking] Inserting activity:`, activity);
      const { data, error } = await supabase.from('lead_activities').insert(activity).select();

      if (error) {
        // Ignore duplicate key errors (happens when trigger tries to create lead_score for existing session)
        if (error.code === '23505' && error.message.includes('idx_lead_scores_session_id')) {
          console.log('⚠️ [Lead Tracking] Session already exists, continuing...');
          return;
        }
        console.error('❌ [Lead Tracking] Database error:', error);
        throw error;
      }

      console.log(`✅ [Lead Tracking] Activity saved successfully:`, data);
      console.log(`✅ Activity tracked: ${activityType} (+${points} points)`);
    } catch (error: any) {
      // Ignore duplicate key errors silently
      if (error?.code === '23505') {
        console.log('⚠️ [Lead Tracking] Duplicate session, ignored');
        return;
      }
      console.error('❌ [Lead Tracking] Error tracking activity:', error);
    }
  }

  async trackPageView(pageName?: string) {
    const activityData = {
      page_name: pageName || document.title,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    };

    await this.trackActivity('page_visit', activityData);
  }

  async trackFarmView(farmId: string, farmName: string) {
    const activityData = {
      farm_id: farmId,
      farm_name: farmName
    };

    const hasVisitedBefore = await this.hasActivityType('farm_view', { farm_id: farmId });
    const activityType = hasVisitedBefore ? 'farm_view_repeat' : 'farm_view';

    await this.trackActivity(activityType, activityData);
  }

  async trackPackageView(packageId: string, packageName: string) {
    await this.trackActivity('package_details', {
      package_id: packageId,
      package_name: packageName
    });
  }

  async trackReservationStart(farmId: string, treeCount: number) {
    await this.trackActivity('reservation_start', {
      farm_id: farmId,
      tree_count: treeCount
    });
  }

  async trackReservationComplete(reservationId: string, amount: number) {
    await this.trackActivity('reservation_complete', {
      reservation_id: reservationId,
      amount: amount
    });

    await this.updateConversionStage('converted');
  }

  async trackPaymentPageView(amount: number) {
    await this.trackActivity('payment_page', {
      amount: amount
    });

    await this.updateConversionStage('payment_stuck');
  }

  async trackRegistrationComplete() {
    await this.trackActivity('registration_complete');
  }

  async trackWhatsAppClick() {
    await this.trackActivity('whatsapp_click');
  }

  async trackTimeOnPage(durationMinutes: number) {
    if (durationMinutes >= 3) {
      await this.trackActivity('time_on_page_3min');
    } else if (durationMinutes >= 1) {
      await this.trackActivity('time_on_page_1min');
    }
  }

  async updateConversionStage(stage: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const condition = user?.id
        ? { user_id: user.id }
        : { session_id: this.sessionId };

      await supabase
        .from('lead_scores')
        .update({ conversion_stage: stage })
        .match(condition);
    } catch (error) {
      console.error('Error updating conversion stage:', error);
    }
  }

  async getCurrentScore(): Promise<LeadScore | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const condition = user?.id
        ? { user_id: user.id }
        : { session_id: this.sessionId };

      const { data, error } = await supabase
        .from('lead_scores')
        .select('*')
        .match(condition)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting current score:', error);
      return null;
    }
  }

  async getHotLeads(limit = 50): Promise<LeadScore[]> {
    try {
      const { data, error } = await supabase.rpc('get_hot_leads', {
        limit_count: limit
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting hot leads:', error);
      return [];
    }
  }

  async getLeadActivities(leadScoreId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .or(`user_id.eq.${leadScoreId},session_id.eq.${leadScoreId}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting lead activities:', error);
      return [];
    }
  }

  private async hasActivityType(activityType: string, filters?: Record<string, any>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('lead_activities')
        .select('id', { count: 'exact', head: true })
        .eq('activity_type', activityType);

      if (user?.id) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', this.sessionId);
      }

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.contains('activity_data', { [key]: value });
        });
      }

      const { count } = await query;
      return (count || 0) > 0;
    } catch (error) {
      console.error('Error checking activity type:', error);
      return false;
    }
  }

  startPageTimer() {
    const startTime = Date.now();

    const checkTime = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000 / 60);

      if (elapsed >= 3) {
        this.trackTimeOnPage(3);
        clearInterval(timer);
      } else if (elapsed >= 1) {
        this.trackTimeOnPage(1);
      }
    };

    const timer = setInterval(checkTime, 60000);

    window.addEventListener('beforeunload', () => {
      clearInterval(timer);
      const finalElapsed = Math.floor((Date.now() - startTime) / 1000 / 60);
      if (finalElapsed >= 1) {
        navigator.sendBeacon('/api/track-time', JSON.stringify({
          session_id: this.sessionId,
          duration: finalElapsed
        }));
      }
    });

    return () => clearInterval(timer);
  }

  async linkSessionToUser(userId: string) {
    try {
      await supabase
        .from('lead_scores')
        .update({ user_id: userId })
        .eq('session_id', this.sessionId)
        .is('user_id', null);

      await supabase
        .from('lead_activities')
        .update({ user_id: userId })
        .eq('session_id', this.sessionId)
        .is('user_id', null);

      console.log('✅ Session linked to user:', userId);
    } catch (error) {
      console.error('Error linking session to user:', error);
    }
  }
}

export const leadScoringService = new LeadScoringService();