import { supabase } from '../lib/supabase';
import type { FarmProject, FarmCategory } from './farmService';

const CACHE_KEY = 'farms_cache_v2';
const CACHE_EXPIRY_MS = 10 * 60 * 1000;

interface FarmCache {
  timestamp: number;
  categories: FarmCategory[];
  farms: Record<string, FarmProject[]>;
}

export interface LoadingProgress {
  stage: 'instant' | 'progressive' | 'complete';
  loaded: number;
  total: number;
  message: string;
}

export const farmLoadingService = {
  async getFromCache(): Promise<FarmCache | null> {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cache: FarmCache = JSON.parse(cached);
      const now = Date.now();
      const age = now - cache.timestamp;

      if (age > CACHE_EXPIRY_MS) {
        console.log('[FarmLoading] Cache expired, age:', Math.round(age / 1000), 'seconds');
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      console.log('[FarmLoading] Using cached data, age:', Math.round(age / 1000), 'seconds');
      return cache;
    } catch (error) {
      console.error('[FarmLoading] Error reading cache:', error);
      return null;
    }
  },

  saveToCache(categories: FarmCategory[], farms: Record<string, FarmProject[]>) {
    try {
      const cache: FarmCache = {
        timestamp: Date.now(),
        categories,
        farms
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      console.log('[FarmLoading] Data cached successfully');
    } catch (error) {
      console.error('[FarmLoading] Error saving cache:', error);
    }
  },

  async loadInstantFarms(onProgress?: (progress: LoadingProgress) => void): Promise<{
    categories: FarmCategory[];
    farms: Record<string, FarmProject[]>;
  }> {
    console.log('[FarmLoading] 🚀 Stage 1: Instant Load (first 3 farms)');

    if (onProgress) {
      onProgress({
        stage: 'instant',
        loaded: 0,
        total: 3,
        message: 'تحميل سريع...'
      });
    }

    try {
      const categoriesPromise = supabase
        .from('farm_categories')
        .select('name_ar, icon, display_order')
        .eq('active', true)
        .order('display_order', { ascending: true });

      const farmsPromise = supabase
        .from('farms')
        .select(`
          *,
          farm_categories!category_id(name_ar, icon)
        `)
        .eq('status', 'active')
        .order('order_index')
        .limit(3);

      const [categoriesResult, farmsResult] = await Promise.all([
        categoriesPromise,
        farmsPromise
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (farmsResult.error) throw farmsResult.error;

      const categories: FarmCategory[] = (categoriesResult.data || []).map(cat => ({
        slug: cat.name_ar?.trim().replace(/\s+/g, '-') || 'other',
        name: cat.name_ar || '',
        icon: cat.icon || '🌳'
      }));

      const farmIds = farmsResult.data?.map(f => f.id) || [];
      const { data: contracts } = await supabase
        .from('farm_contracts')
        .select('*')
        .in('farm_id', farmIds)
        .eq('is_active', true)
        .order('display_order');

      const farms = this.formatFarms(farmsResult.data || [], contracts || []);

      if (onProgress) {
        onProgress({
          stage: 'instant',
          loaded: 3,
          total: 3,
          message: 'تم التحميل'
        });
      }

      console.log('[FarmLoading] ✅ Stage 1 complete: 3 farms loaded');
      return { categories, farms };
    } catch (error) {
      console.error('[FarmLoading] Error in instant load:', error);
      throw error;
    }
  },

  async loadRemainingFarms(
    offset: number = 3,
    onProgress?: (progress: LoadingProgress) => void
  ): Promise<Record<string, FarmProject[]>> {
    console.log('[FarmLoading] 📦 Stage 2: Progressive Load (remaining farms)');

    try {
      const { data: allFarms, error: farmsError } = await supabase
        .from('farms')
        .select(`
          *,
          farm_categories!category_id(name_ar, icon)
        `)
        .eq('status', 'active')
        .order('order_index')
        .range(offset, 999);

      if (farmsError) throw farmsError;
      if (!allFarms || allFarms.length === 0) {
        console.log('[FarmLoading] No more farms to load');
        return {};
      }

      const totalFarms = allFarms.length;
      const chunkSize = 3;
      const chunks: any[][] = [];

      for (let i = 0; i < allFarms.length; i += chunkSize) {
        chunks.push(allFarms.slice(i, i + chunkSize));
      }

      const allFormattedFarms: Record<string, FarmProject[]> = {};

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const farmIds = chunk.map(f => f.id);

        const { data: contracts } = await supabase
          .from('farm_contracts')
          .select('*')
          .in('farm_id', farmIds)
          .eq('is_active', true)
          .order('display_order');

        const formattedFarms = this.formatFarms(chunk, contracts || []);

        Object.entries(formattedFarms).forEach(([category, farms]) => {
          if (!allFormattedFarms[category]) {
            allFormattedFarms[category] = [];
          }
          allFormattedFarms[category].push(...farms);
        });

        const loaded = Math.min((i + 1) * chunkSize, totalFarms);

        if (onProgress) {
          onProgress({
            stage: 'progressive',
            loaded: offset + loaded,
            total: offset + totalFarms,
            message: `تحميل ${loaded} من ${totalFarms}...`
          });
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('[FarmLoading] ✅ Stage 2 complete: All remaining farms loaded');
      return allFormattedFarms;
    } catch (error) {
      console.error('[FarmLoading] Error in progressive load:', error);
      throw error;
    }
  },

  formatFarms(farms: any[], contracts: any[]): Record<string, FarmProject[]> {
    const farmsByCategory: Record<string, FarmProject[]> = {};

    farms.forEach(farm => {
      const categoryData = farm.farm_categories;
      const categorySlug = categoryData?.name_ar?.trim().replace(/\s+/g, '-') || 'other';
      const treeTypes = farm.tree_types || [];
      const farmContracts = contracts.filter(c => c.farm_id === farm.id);

      const formattedTreeTypes = treeTypes.map((tree: any) => ({
        id: tree.id || `tree-${Date.now()}-${Math.random()}`,
        slug: (tree.name || '').toLowerCase().replace(/\s+/g, '-'),
        name: tree.name || '',
        varieties: [{
          id: tree.id || `variety-${Date.now()}-${Math.random()}`,
          name: tree.subtitle || tree.name || '',
          price: tree.base_price || tree.price || 0,
          icon: '🌳',
          available: tree.count || tree.available || 0,
          maintenance_fee: tree.maintenance_fee || 0
        }]
      }));

      const farmProject: FarmProject = {
        id: farm.id,
        name: farm.name_ar || farm.name_en,
        description: farm.description_ar,
        image: farm.image_url,
        heroImage: farm.hero_image_url,
        video: farm.video_url,
        location: farm.location,
        mapUrl: farm.map_url || '#',
        returnRate: farm.return_rate_display || `${farm.annual_return_rate}% سنوياً`,
        availableTrees: farm.available_trees || 0,
        reservedTrees: farm.reserved_trees || 0,
        marketingMessage: farm.marketing_message,
        comingSoonLabel: farm.coming_soon_label,
        firstYearMaintenanceFree: farm.first_year_maintenance_free ?? true,
        treeTypes: formattedTreeTypes,
        contracts: farmContracts
      };

      if (!farmsByCategory[categorySlug]) {
        farmsByCategory[categorySlug] = [];
      }
      farmsByCategory[categorySlug].push(farmProject);
    });

    return farmsByCategory;
  },

  mergeFarms(
    existing: Record<string, FarmProject[]>,
    newFarms: Record<string, FarmProject[]>
  ): Record<string, FarmProject[]> {
    const merged = { ...existing };

    Object.entries(newFarms).forEach(([category, farms]) => {
      if (!merged[category]) {
        merged[category] = [];
      }

      farms.forEach(newFarm => {
        const exists = merged[category].some(f => f.id === newFarm.id);
        if (!exists) {
          merged[category].push(newFarm);
        }
      });
    });

    return merged;
  },

  async loadWithCache(onProgress?: (progress: LoadingProgress) => void): Promise<{
    categories: FarmCategory[];
    farms: Record<string, FarmProject[]>;
    fromCache: boolean;
  }> {
    const cached = await this.getFromCache();

    if (cached) {
      console.log('[FarmLoading] ⚡ Using cached data (instant)');
      if (onProgress) {
        onProgress({
          stage: 'complete',
          loaded: Object.values(cached.farms).flat().length,
          total: Object.values(cached.farms).flat().length,
          message: 'تم التحميل من الذاكرة'
        });
      }

      setTimeout(async () => {
        console.log('[FarmLoading] 🔄 Refreshing cache in background');
        try {
          const fresh = await this.loadAllFarms();
          this.saveToCache(fresh.categories, fresh.farms);
        } catch (error) {
          console.error('[FarmLoading] Background refresh failed:', error);
        }
      }, 2000);

      return {
        categories: cached.categories,
        farms: cached.farms,
        fromCache: true
      };
    }

    console.log('[FarmLoading] 📥 No cache, loading fresh data');
    const result = await this.loadAllFarms(onProgress);
    this.saveToCache(result.categories, result.farms);

    return {
      ...result,
      fromCache: false
    };
  },

  async loadAllFarms(onProgress?: (progress: LoadingProgress) => void): Promise<{
    categories: FarmCategory[];
    farms: Record<string, FarmProject[]>;
  }> {
    const instant = await this.loadInstantFarms(onProgress);

    const remaining = await this.loadRemainingFarms(3, onProgress);
    const allFarms = this.mergeFarms(instant.farms, remaining);

    if (onProgress) {
      onProgress({
        stage: 'complete',
        loaded: Object.values(allFarms).flat().length,
        total: Object.values(allFarms).flat().length,
        message: 'اكتمل التحميل'
      });
    }

    return {
      categories: instant.categories,
      farms: allFarms
    };
  }
};
