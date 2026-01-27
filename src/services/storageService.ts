import { supabase } from '../lib/supabase';

export const storageService = {
  async uploadFarmImage(file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `farms/${fileName}`;

      const { data, error } = await supabase.storage
        .from('farm-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('farm-images')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadFarmImage:', error);
      throw error;
    }
  },

  async deleteFarmImage(imageUrl: string): Promise<boolean> {
    try {
      const path = imageUrl.split('/farm-images/')[1];
      if (!path) return false;

      const { error } = await supabase.storage
        .from('farm-images')
        .remove([path]);

      if (error) {
        console.error('Error deleting image:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteFarmImage:', error);
      return false;
    }
  }
};
