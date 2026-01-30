import { supabase } from '../lib/supabase';

export interface VideoIntro {
  id: string;
  video_type: 'upload' | 'youtube' | 'tiktok';
  video_url: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateVideoIntroInput {
  video_type: 'upload' | 'youtube' | 'tiktok';
  video_url: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  is_active?: boolean;
  display_order?: number;
}

export const videoIntroService = {
  async getActiveVideo(): Promise<VideoIntro | null> {
    try {
      const { data, error } = await supabase
        .from('video_intro')
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
    } catch (error) {
      console.error('Error in getActiveVideo:', error);
      return null;
    }
  },

  async getAllVideos(): Promise<VideoIntro[]> {
    try {
      const { data, error } = await supabase
        .from('video_intro')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching all videos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllVideos:', error);
      return [];
    }
  },

  async createVideo(input: CreateVideoIntroInput): Promise<VideoIntro | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      const { data, error } = await supabase
        .from('video_intro')
        .insert({
          ...input,
          description: input.description || '',
          is_active: input.is_active ?? true,
          display_order: input.display_order ?? 0,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating video:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createVideo:', error);
      throw error;
    }
  },

  async updateVideo(id: string, updates: Partial<CreateVideoIntroInput>): Promise<VideoIntro | null> {
    try {
      const { data, error } = await supabase
        .from('video_intro')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating video:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateVideo:', error);
      throw error;
    }
  },

  async deleteVideo(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('video_intro')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting video:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteVideo:', error);
      throw error;
    }
  },

  async uploadVideoFile(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('intro-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading video file:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('intro-videos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadVideoFile:', error);
      throw error;
    }
  },

  async deleteVideoFile(videoUrl: string): Promise<boolean> {
    try {
      const fileName = videoUrl.split('/').pop();
      if (!fileName) return false;

      const { error } = await supabase.storage
        .from('intro-videos')
        .remove([fileName]);

      if (error) {
        console.error('Error deleting video file:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteVideoFile:', error);
      return false;
    }
  },

  extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  },

  extractTikTokId(url: string): string | null {
    const patterns = [
      /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
      /tiktok\.com\/v\/(\d+)/,
      /vm\.tiktok\.com\/([a-zA-Z0-9]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  },

  getEmbedUrl(videoType: 'youtube' | 'tiktok', videoUrl: string): string | null {
    if (videoType === 'youtube') {
      const videoId = this.extractYouTubeId(videoUrl);
      if (!videoId) return null;
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`;
    } else if (videoType === 'tiktok') {
      const videoId = this.extractTikTokId(videoUrl);
      if (!videoId) return null;
      return `https://www.tiktok.com/embed/v2/${videoId}`;
    }
    return null;
  }
};
