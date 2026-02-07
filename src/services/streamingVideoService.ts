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

function detectDeviceType(): 'mobile' | 'desktop' {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  return isMobile ? 'mobile' : 'desktop';
}

export const streamingVideoService = {
  async getActiveVideo(): Promise<StreamingVideo | null> {
    try {
      const deviceType = detectDeviceType();

      const { data, error } = await supabase
        .from('intro_videos')
        .select('id, title, description, file_url, thumbnail_url, duration')
        .eq('is_active', true)
        .or(`device_type.eq.all,device_type.eq.${deviceType}`)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching active video:', error);
        return null;
      }

      if (data) {
        await streamingVideoService.incrementViewCount(data.id);

        return {
          id: data.id,
          title: data.title,
          description: data.description || '',
          stream_url: data.file_url,
          thumbnail_url: data.thumbnail_url || undefined,
          is_active: true,
          display_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error('Error in getActiveVideo:', error);
      return null;
    }
  },

  async incrementViewCount(videoId: string): Promise<void> {
    try {
      await supabase.rpc('increment_video_views', { video_id: videoId });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  },

  async getAllVideos(): Promise<StreamingVideo[]> {
    const { data, error } = await supabase
      .from('intro_videos')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching videos:', error);
      return [];
    }

    return (data || []).map(video => ({
      id: video.id,
      title: video.title,
      description: video.description || '',
      stream_url: video.file_url,
      thumbnail_url: video.thumbnail_url || undefined,
      is_active: video.is_active,
      display_order: video.display_order || 0,
      created_at: video.created_at,
      updated_at: video.updated_at
    }));
  },

  async createVideo(video: Omit<StreamingVideo, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<StreamingVideo | null> {
    const { data, error } = await supabase
      .from('intro_videos')
      .insert({
        title: video.title,
        description: video.description,
        file_url: video.stream_url,
        thumbnail_url: video.thumbnail_url,
        file_size: 0,
        device_type: 'all',
        is_active: video.is_active,
        display_order: video.display_order
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating video:', error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      stream_url: data.file_url,
      thumbnail_url: data.thumbnail_url || undefined,
      is_active: data.is_active,
      display_order: data.display_order || 0,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async updateVideo(id: string, updates: Partial<Omit<StreamingVideo, 'id' | 'created_at' | 'updated_at' | 'created_by'>>): Promise<StreamingVideo | null> {
    const updateData: any = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.stream_url !== undefined) updateData.file_url = updates.stream_url;
    if (updates.thumbnail_url !== undefined) updateData.thumbnail_url = updates.thumbnail_url;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
    if (updates.display_order !== undefined) updateData.display_order = updates.display_order;

    const { data, error } = await supabase
      .from('intro_videos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating video:', error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      stream_url: data.file_url,
      thumbnail_url: data.thumbnail_url || undefined,
      is_active: data.is_active,
      display_order: data.display_order || 0,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async deleteVideo(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('intro_videos')
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
      .from('intro_videos')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      console.error('Error toggling video status:', error);
      return false;
    }

    return true;
  }
};
