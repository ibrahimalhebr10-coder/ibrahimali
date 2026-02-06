import { supabase } from '../lib/supabase';
import type { FarmProject, FarmCategory } from './farmService';

const CACHE_KEY = 'farms_cache_v2';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface FarmCache {
  timestamp: number;
  categories: FarmCategory[];
  farms: Record<string, FarmProject[]>;
}

export interface LoadingProgress {
  stage: 'loading' | 'complete';
  loaded: number;
  total: number;
  message: string;
}

export const farmLoadingService = {
  /**
   * Main load function - SIMPLE & DIRECT
   */
  async loadWithCache(onProgress?: (progress: LoadingProgress) => void): Promise<{
    categories: FarmCategory[];
    farms: Record<string, FarmProject[]>;
    fromCache: boolean;
  }> {
    console.log('[FarmLoading] 🚀 Starting load');

    // Try cache first
    const cached = await this.getFromCache();
    if (cached && cached.categories?.length > 0 && Object.keys(cached.farms || {}).length > 0) {
      console.log('[FarmLoading] ⚡ Using cache');

      if (onProgress) {
        onProgress({
          stage: 'complete',
          loaded: Object.values(cached.farms).flat().length,
          total: Object.values(cached.farms).flat().length,
          message: 'تم التحميل'
        });
      }

      // Background refresh (silent)
      setTimeout(() => {
        this.loadFresh().then(fresh => {
          this.saveToCache(fresh.categories, fresh.farms);
        }).catch(() => {});
      }, 2000);

      return {
        categories: cached.categories,
        farms: cached.farms,
        fromCache: true
      };
    }

    // No cache - load fresh
    console.log('[FarmLoading] 📥 Loading fresh');

    if (onProgress) {
      onProgress({
        stage: 'loading',
        loaded: 0,
        total: 1,
        message: 'جاري التحميل...'
      });
    }

    const fresh = await this.loadFresh();
    this.saveToCache(fresh.categories, fresh.farms);

    if (onProgress) {
      onProgress({
        stage: 'complete',
        loaded: Object.values(fresh.farms).flat().length,
        total: Object.values(fresh.farms).flat().length,
        message: 'تم التحميل'
      });
    }

    return {
      ...fresh,
      fromCache: false
    };
  },

  /**
   * Load fresh data - ONE SIMPLE CALL
   */
  async loadFresh(): Promise<{
    categories: FarmCategory[];
    farms: Record<string, FarmProject[]>;
  }> {
    console.log('[FarmLoading] 📡 Fetching from database');

    try {
      // Load categories and farms in parallel
      const [categoriesResult, farmsResult] = await Promise.all([
        supabase
          .from('farm_categories')
          .select('name_ar, icon, display_order')
          .eq('active', true)
          .order('display_order', { ascending: true }),

        supabase
          .from('farms')
          .select(`
            *,
            farm_categories!category_id(name_ar, icon)
          `)
          .eq('status', 'active')
          .order('order_index')
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (farmsResult.error) throw farmsResult.error;

      console.log('[FarmLoading] 📊 Loaded:', {
        categories: categoriesResult.data?.length || 0,
        farms: farmsResult.data?.length || 0
      });

      // Load contracts
      const farmIds = farmsResult.data?.map(f => f.id) || [];
      const { data: contracts } = await supabase
        .from('farm_contracts')
        .select('*')
        .in('farm_id', farmIds)
        .eq('is_active', true)
        .order('display_order');

      // Format data
      const categories: FarmCategory[] = (categoriesResult.data || []).map(cat => ({
        slug: cat.name_ar?.trim().replace(/\s+/g, '-') || 'other',
        name: cat.name_ar || '',
        icon: cat.icon || '🌳'
      }));

      const farms = this.formatFarms(farmsResult.data || [], contracts || []);

      console.log('[FarmLoading] ✅ Complete:', {
        categoriesCount: categories.length,
        farmsCount: Object.values(farms).flat().length
      });

      return { categories, farms };
    } catch (error) {
      console.error('[FarmLoading] ❌ Error:', error);
      throw error;
    }
  },

  /**
   * Format farms data
   */
  formatFarms(farmsData: any[], contracts: any[]): Record<string, FarmProject[]> {
    const farmsByCategory: Record<string, FarmProject[]> = {};

    farmsData.forEach(farm => {
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

  /**
   * Get from cache - SIMPLE
   */
  async getFromCache(): Promise<FarmCache | null> {
    try {
      // Test localStorage
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
      } catch (e) {
        return null;
      }

      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cache: FarmCache = JSON.parse(cached);
      const age = Date.now() - cache.timestamp;

      if (age > CACHE_EXPIRY_MS) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      console.log('[FarmLoading] Cache valid:', Math.round(age / 1000) + 's');
      return cache;
    } catch (error) {
      return null;
    }
  },

  /**
   * Save to cache - SIMPLE
   */
  saveToCache(categories: FarmCategory[], farms: Record<string, FarmProject[]>) {
    try {
      const cache: FarmCache = {
        timestamp: Date.now(),
        categories,
        farms
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      console.log('[FarmLoading] ✅ Cached');
    } catch (error) {
      // Ignore cache errors
    }
  }
};
