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
    console.log('[FarmLoading] 💾 Checking cache...');
    console.log('[FarmLoading] 🔍 localStorage available:', typeof localStorage !== 'undefined');

    try {
      // Test if localStorage is accessible (Safari private mode check)
      try {
        localStorage.setItem('test_access', 'test');
        localStorage.removeItem('test_access');
        console.log('[FarmLoading] ✅ localStorage is accessible');
      } catch (e) {
        console.error('[FarmLoading] ❌ localStorage is NOT accessible (Safari private mode?):', e);
        return null;
      }

      const cached = localStorage.getItem(CACHE_KEY);
      console.log('[FarmLoading] 📦 Cache key exists:', !!cached);

      if (!cached) {
        console.log('[FarmLoading] ⚠️ No cache found');
        return null;
      }

      console.log('[FarmLoading] 🔄 Parsing cached data...');
      const cache: FarmCache = JSON.parse(cached);
      const now = Date.now();
      const age = now - cache.timestamp;

      console.log('[FarmLoading] 📊 Cache info:', {
        timestamp: new Date(cache.timestamp).toISOString(),
        age: Math.round(age / 1000) + 's',
        expired: age > CACHE_EXPIRY_MS,
        categoriesCount: cache.categories?.length,
        farmsCount: Object.values(cache.farms || {}).flat().length
      });

      if (age > CACHE_EXPIRY_MS) {
        console.log('[FarmLoading] ⏰ Cache expired, age:', Math.round(age / 1000), 'seconds');
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      console.log('[FarmLoading] ✅ Using cached data, age:', Math.round(age / 1000), 'seconds');
      return cache;
    } catch (error) {
      console.error('[FarmLoading] ❌ Error reading cache:', error);
      console.error('[FarmLoading] Error type:', error?.constructor?.name);
      console.error('[FarmLoading] Error message:', error instanceof Error ? error.message : String(error));
      return null;
    }
  },

  saveToCache(categories: FarmCategory[], farms: Record<string, FarmProject[]>) {
    console.log('[FarmLoading] 💾 Attempting to save cache...');

    try {
      // Check localStorage availability
      if (typeof localStorage === 'undefined') {
        console.error('[FarmLoading] ❌ localStorage is not available');
        return;
      }

      // Test write access
      try {
        localStorage.setItem('test_write', 'test');
        localStorage.removeItem('test_write');
      } catch (e) {
        console.error('[FarmLoading] ❌ Cannot write to localStorage:', e);
        return;
      }

      const cache: FarmCache = {
        timestamp: Date.now(),
        categories,
        farms
      };

      const cacheString = JSON.stringify(cache);
      const cacheSize = new Blob([cacheString]).size;

      console.log('[FarmLoading] 📊 Cache info:', {
        categoriesCount: categories.length,
        farmsCount: Object.values(farms).flat().length,
        size: Math.round(cacheSize / 1024) + 'KB'
      });

      localStorage.setItem(CACHE_KEY, cacheString);
      console.log('[FarmLoading] ✅ Data cached successfully');
    } catch (error) {
      console.error('[FarmLoading] ❌ Error saving cache:', error);
      console.error('[FarmLoading] Error type:', error?.constructor?.name);
      console.error('[FarmLoading] Error message:', error instanceof Error ? error.message : String(error));

      // If quota exceeded, try to clear old data
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.log('[FarmLoading] 🧹 Attempting to clear old data...');
        try {
          localStorage.removeItem(CACHE_KEY);
          console.log('[FarmLoading] ✅ Old cache cleared');
        } catch (e) {
          console.error('[FarmLoading] ❌ Failed to clear old cache:', e);
        }
      }
    }
  },

  async loadInstantFarms(onProgress?: (progress: LoadingProgress) => void): Promise<{
    categories: FarmCategory[];
    farms: Record<string, FarmProject[]>;
  }> {
    console.log('[FarmLoading] 🚀 Stage 1: Instant Load (first 3 farms)');
    console.log('[FarmLoading] 🌐 Network status:', navigator.onLine ? 'ONLINE ✅' : 'OFFLINE ❌');
    console.log('[FarmLoading] 📱 User Agent:', navigator.userAgent);

    if (onProgress) {
      onProgress({
        stage: 'instant',
        loaded: 0,
        total: 3,
        message: 'تحميل سريع...'
      });
    }

    try {
      console.log('[FarmLoading] 📡 Starting database queries...');

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

      console.log('[FarmLoading] ⏳ Waiting for queries to complete...');
      const [categoriesResult, farmsResult] = await Promise.all([
        categoriesPromise,
        farmsPromise
      ]);

      console.log('[FarmLoading] 📊 Categories result:', {
        error: categoriesResult.error,
        dataLength: categoriesResult.data?.length,
        data: categoriesResult.data
      });

      console.log('[FarmLoading] 📊 Farms result:', {
        error: farmsResult.error,
        dataLength: farmsResult.data?.length,
        farms: farmsResult.data?.map(f => ({ id: f.id, name: f.name_ar || f.name_en }))
      });

      if (categoriesResult.error) {
        console.error('[FarmLoading] ❌ Categories error:', categoriesResult.error);
        throw categoriesResult.error;
      }

      if (farmsResult.error) {
        console.error('[FarmLoading] ❌ Farms error:', farmsResult.error);
        throw farmsResult.error;
      }

      if (!categoriesResult.data || categoriesResult.data.length === 0) {
        console.warn('[FarmLoading] ⚠️ NO categories returned from database!');
      }

      if (!farmsResult.data || farmsResult.data.length === 0) {
        console.warn('[FarmLoading] ⚠️ NO farms returned from database!');
      }

      console.log('[FarmLoading] 🔄 Processing categories...');
      const categories: FarmCategory[] = (categoriesResult.data || []).map(cat => ({
        slug: cat.name_ar?.trim().replace(/\s+/g, '-') || 'other',
        name: cat.name_ar || '',
        icon: cat.icon || '🌳'
      }));

      console.log('[FarmLoading] ✅ Processed categories:', categories);

      console.log('[FarmLoading] 🔄 Fetching contracts...');
      const farmIds = farmsResult.data?.map(f => f.id) || [];
      console.log('[FarmLoading] 📝 Farm IDs:', farmIds);

      const { data: contracts, error: contractsError } = await supabase
        .from('farm_contracts')
        .select('*')
        .in('farm_id', farmIds)
        .eq('is_active', true)
        .order('display_order');

      if (contractsError) {
        console.error('[FarmLoading] ⚠️ Contracts error:', contractsError);
      }

      console.log('[FarmLoading] 📜 Contracts loaded:', contracts?.length || 0);

      console.log('[FarmLoading] 🔄 Formatting farms...');
      const farms = this.formatFarms(farmsResult.data || [], contracts || []);
      console.log('[FarmLoading] ✅ Formatted farms:', {
        categories: Object.keys(farms),
        totalFarms: Object.values(farms).flat().length,
        farmsPerCategory: Object.entries(farms).map(([cat, f]) => `${cat}: ${f.length}`)
      });

      if (onProgress) {
        onProgress({
          stage: 'instant',
          loaded: 3,
          total: 3,
          message: 'تم التحميل'
        });
      }

      console.log('[FarmLoading] ✅ Stage 1 complete: 3 farms loaded');
      console.log('[FarmLoading] 📊 Returning:', {
        categoriesCount: categories.length,
        farmsCount: Object.values(farms).flat().length
      });

      return { categories, farms };
    } catch (error) {
      console.error('[FarmLoading] ❌❌❌ CRITICAL ERROR in instant load:');
      console.error('[FarmLoading] Error type:', error?.constructor?.name);
      console.error('[FarmLoading] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[FarmLoading] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('[FarmLoading] Full error object:', error);
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
    console.log('[FarmLoading] 🎯 loadWithCache STARTING');

    // Try cache first
    const cached = await this.getFromCache();

    if (cached && cached.categories && cached.farms && Object.keys(cached.farms).length > 0) {
      console.log('[FarmLoading] ⚡ Using cached data (instant)');
      console.log('[FarmLoading] 📊 Cached data:', {
        categoriesCount: cached.categories.length,
        farmsCount: Object.values(cached.farms).flat().length
      });

      if (onProgress) {
        onProgress({
          stage: 'complete',
          loaded: Object.values(cached.farms).flat().length,
          total: Object.values(cached.farms).flat().length,
          message: 'تم التحميل من الذاكرة'
        });
      }

      // Background refresh
      setTimeout(async () => {
        console.log('[FarmLoading] 🔄 Refreshing cache in background');
        try {
          const fresh = await this.loadAllFarms();
          this.saveToCache(fresh.categories, fresh.farms);
          console.log('[FarmLoading] ✅ Background refresh complete');
        } catch (error) {
          console.error('[FarmLoading] ⚠️ Background refresh failed:', error);
        }
      }, 2000);

      return {
        categories: cached.categories,
        farms: cached.farms,
        fromCache: true
      };
    }

    console.log('[FarmLoading] 📥 No valid cache, loading fresh data');

    try {
      // Try progressive loading
      const result = await this.loadAllFarms(onProgress);
      console.log('[FarmLoading] ✅ Progressive loading succeeded');

      // Validate result
      if (!result.categories || result.categories.length === 0) {
        console.warn('[FarmLoading] ⚠️ No categories returned from progressive loading');
      }

      if (!result.farms || Object.keys(result.farms).length === 0) {
        console.warn('[FarmLoading] ⚠️ No farms returned from progressive loading');
      }

      this.saveToCache(result.categories, result.farms);

      return {
        ...result,
        fromCache: false
      };

    } catch (progressiveError) {
      console.error('[FarmLoading] ❌ Progressive loading failed, trying fallback method');
      console.error('[FarmLoading] Error:', progressiveError);

      // Fallback: Try simple direct load without chunking
      try {
        console.log('[FarmLoading] 🔄 Attempting simple fallback load...');
        const result = await this.simpleFallbackLoad(onProgress);
        console.log('[FarmLoading] ✅ Fallback load succeeded');
        this.saveToCache(result.categories, result.farms);

        return {
          ...result,
          fromCache: false
        };
      } catch (fallbackError) {
        console.error('[FarmLoading] ❌❌❌ Fallback load also failed!');
        console.error('[FarmLoading] Fallback error:', fallbackError);
        throw fallbackError;
      }
    }
  },

  async simpleFallbackLoad(onProgress?: (progress: LoadingProgress) => void): Promise<{
    categories: FarmCategory[];
    farms: Record<string, FarmProject[]>;
  }> {
    console.log('[FarmLoading] 🆘 Simple Fallback Load (no chunking, no caching)');

    if (onProgress) {
      onProgress({
        stage: 'instant',
        loaded: 0,
        total: 1,
        message: 'تحميل مباشر...'
      });
    }

    // Load everything in one simple call
    const { data: categories, error: categoriesError } = await supabase
      .from('farm_categories')
      .select('name_ar, icon, display_order')
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (categoriesError) {
      console.error('[FarmLoading] ❌ Fallback categories error:', categoriesError);
      throw categoriesError;
    }

    const { data: farms, error: farmsError } = await supabase
      .from('farms')
      .select(`
        *,
        farm_categories!category_id(name_ar, icon)
      `)
      .eq('status', 'active')
      .order('order_index');

    if (farmsError) {
      console.error('[FarmLoading] ❌ Fallback farms error:', farmsError);
      throw farmsError;
    }

    console.log('[FarmLoading] 📊 Fallback loaded:', {
      categoriesCount: categories?.length || 0,
      farmsCount: farms?.length || 0
    });

    const formattedCategories: FarmCategory[] = (categories || []).map(cat => ({
      slug: cat.name_ar?.trim().replace(/\s+/g, '-') || 'other',
      name: cat.name_ar || '',
      icon: cat.icon || '🌳'
    }));

    const farmIds = farms?.map(f => f.id) || [];
    const { data: contracts } = await supabase
      .from('farm_contracts')
      .select('*')
      .in('farm_id', farmIds)
      .eq('is_active', true)
      .order('display_order');

    const formattedFarms = this.formatFarms(farms || [], contracts || []);

    if (onProgress) {
      onProgress({
        stage: 'complete',
        loaded: Object.values(formattedFarms).flat().length,
        total: Object.values(formattedFarms).flat().length,
        message: 'اكتمل التحميل'
      });
    }

    console.log('[FarmLoading] ✅ Fallback complete:', {
      categoriesCount: formattedCategories.length,
      farmsCount: Object.values(formattedFarms).flat().length
    });

    return {
      categories: formattedCategories,
      farms: formattedFarms
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
