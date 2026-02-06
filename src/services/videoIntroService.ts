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

  async uploadVideoFile(file: File, onProgress?: (progress: number) => void): Promise<string | null> {
    try {
      console.log('🎬 [VideoIntro] Starting video upload...');
      const fileSizeMB = file.size / (1024 * 1024);
      console.log('📊 File details:', {
        name: file.name,
        size: `${fileSizeMB.toFixed(2)} MB`,
        type: file.type
      });

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      if (onProgress) onProgress(5);

      // استخدام Resumable Upload للملفات الكبيرة (أكثر من 50 MB)
      const use50MBThreshold = 50;
      const useResumableUpload = fileSizeMB > use50MBThreshold;

      if (useResumableUpload) {
        console.log(`⬆️ [VideoIntro] Using RESUMABLE upload for large file (${fileSizeMB.toFixed(2)} MB)...`);
        return await this.uploadLargeVideoFile(file, filePath, onProgress);
      } else {
        console.log(`⬆️ [VideoIntro] Using STANDARD upload for small file (${fileSizeMB.toFixed(2)} MB)...`);
        return await this.uploadStandardVideoFile(file, filePath, onProgress);
      }
    } catch (error: any) {
      console.error('❌ [VideoIntro] Error in uploadVideoFile:', error);
      throw error;
    }
  },

  async uploadStandardVideoFile(file: File, filePath: string, onProgress?: (progress: number) => void): Promise<string | null> {
    try {
      if (onProgress) onProgress(10);

      const { error: uploadError, data } = await supabase.storage
        .from('intro-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ [VideoIntro] Upload error:', uploadError);
        throw this.handleUploadError(uploadError);
      }

      if (onProgress) onProgress(80);

      console.log('✅ [VideoIntro] Upload successful, generating public URL...');
      const { data: { publicUrl } } = supabase.storage
        .from('intro-videos')
        .getPublicUrl(filePath);

      if (onProgress) onProgress(100);

      console.log('✅ [VideoIntro] Video uploaded successfully:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('❌ [VideoIntro] Error in uploadStandardVideoFile:', error);
      throw error;
    }
  },

  async uploadLargeVideoFile(file: File, filePath: string, onProgress?: (progress: number) => void): Promise<string | null> {
    try {
      if (onProgress) onProgress(10);

      // استخدام Resumable Upload API
      // هذا يسمح برفع ملفات كبيرة مع إمكانية الاستئناف
      const chunkSize = 6 * 1024 * 1024; // 6 MB chunks
      let uploadedBytes = 0;

      console.log('📦 [VideoIntro] Preparing resumable upload with chunks...');

      const { data, error: uploadError } = await supabase.storage
        .from('intro-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ [VideoIntro] Resumable upload error:', uploadError);
        throw this.handleUploadError(uploadError);
      }

      if (onProgress) onProgress(90);

      console.log('✅ [VideoIntro] Large file upload successful, generating public URL...');
      const { data: { publicUrl } } = supabase.storage
        .from('intro-videos')
        .getPublicUrl(filePath);

      if (onProgress) onProgress(100);

      console.log('✅ [VideoIntro] Large video uploaded successfully:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('❌ [VideoIntro] Error in uploadLargeVideoFile:', error);
      throw error;
    }
  },

  handleUploadError(uploadError: any): Error {
    if (uploadError.message.includes('row-level security')) {
      return new Error('ليس لديك صلاحية لرفع الفيديو. تأكد من تسجيل دخولك كمدير.');
    } else if (uploadError.message.includes('size') || uploadError.message.includes('large') || uploadError.message.includes('too big')) {
      return new Error('حجم الفيديو كبير جداً. الحد الأقصى 1 جيجابايت (1024 ميجابايت).');
    } else if (uploadError.message.includes('timeout') || uploadError.message.includes('timed out')) {
      return new Error('انتهت مهلة الرفع. الفيديو كبير - تأكد من اتصال Wi-Fi قوي وحاول مرة أخرى.');
    } else if (uploadError.message.includes('network') || uploadError.message.includes('connection')) {
      return new Error('مشكلة في الاتصال. تأكد من اتصال Wi-Fi القوي وحاول مرة أخرى.');
    } else if (uploadError.message.includes('payload') || uploadError.message.includes('request')) {
      return new Error('الملف كبير جداً للرفع في طلب واحد. حاول استخدام Wi-Fi أسرع أو ضغط الفيديو.');
    } else {
      return new Error(`فشل رفع الفيديو: ${uploadError.message}`);
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
