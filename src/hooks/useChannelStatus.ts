import { useState, useEffect } from 'react';
import { messagingEngine } from '../services/messagingEngineService';

interface ChannelStatus {
  internal: { available: boolean; always_active: true };
  sms: { available: boolean; provider?: string };
  whatsapp_business: { available: boolean; provider?: string };
}

export function useChannelStatus() {
  const [status, setStatus] = useState<ChannelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadChannelStatus();
  }, []);

  const loadChannelStatus = async () => {
    try {
      setLoading(true);
      const channelStatus = await messagingEngine.getChannelStatus();
      setStatus(channelStatus);
      setError(null);
    } catch (err) {
      console.error('Error loading channel status:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadChannelStatus();
  };

  return { status, loading, error, refresh };
}
