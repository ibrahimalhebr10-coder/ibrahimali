import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { leadScoringService } from '../services/leadScoringService';

export function useLeadTracking() {
  const { user } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      console.log('🎬 [useLeadTracking] Initializing lead tracking...');
      leadScoringService.initialize();
      initialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      console.log('🔗 [useLeadTracking] Linking session to user:', user.id);
      leadScoringService.linkSessionToUser(user.id);
    }
  }, [user?.id]);

  return leadScoringService;
}

export function usePageTracking(pageName?: string) {
  const leadService = useLeadTracking();

  useEffect(() => {
    leadService.trackPageView(pageName);

    const cleanup = leadService.startPageTimer();
    return cleanup;
  }, [pageName]);

  return leadService;
}