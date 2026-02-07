import { supabase } from '../lib/supabase';

export interface StreamingVideo {
  id: string;
  title: string;
  description: string;
  stream_url: string;
  thumbnail_url?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const streamingVideoService = {
  async getActiveVideo(): Promise<StreamingVideo | null> {
    const { data, error } = await supabase
      .from('streaming_video')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching active video:', error);
      return null;
    }

    return data;
  },

  async getAllVideos(): Promise<StreamingVideo[]> {
    const { data, error } = await supabase
      .from('streaming_video')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching videos:', error);
      return [];
    }

    return data || [];
  },

  async createVideo(video: Omit<StreamingVideo, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<StreamingVideo | null> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('streaming_video')
      .insert({
        ...video,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating video:', error);
      return null;
    }

    return data;
  },

  async updateVideo(id: string, updates: Partial<Omit<StreamingVideo, 'id' | 'created_at' | 'updated_at' | 'created_by'>>): Promise<StreamingVideo | null> {
    const { data, error } = await supabase
      .from('streaming_video')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating video:', error);
      return null;
    }

    return data;
  },

  async deleteVideo(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('streaming_video')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting video:', error);
      return false;
    }

    return true;
  },

  async toggleVideoStatus(id: string, isActive: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('streaming_video')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      console.error('Error toggling video status:', error);
      return false;
    }

    return true;
  }
};
