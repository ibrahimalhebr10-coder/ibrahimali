import { supabase } from '../lib/supabase'
import type { FarmWithCategory } from '../types/database.types'

export interface TreeVariety {
  id: string
  name: string
  price: number
  icon: string
  available: number
  maintenance_fee?: number
}

export interface TreeType {
  id: string
  slug: string
  name: string
  varieties: TreeVariety[]
}

export interface FarmContract {
  id: string
  farm_id: string
  contract_name: string
  duration_years: number
  investor_price: number
  farmer_price?: number
  bonus_years: number
  has_bonus_years?: boolean
  is_active: boolean
  display_order: number
  created_at?: string
  updated_at?: string
}

export interface FarmProject {
  id: string
  name: string
  description: string
  image: string
  heroImage?: string
  video?: string
  videoTitle?: string
  location?: string
  mapUrl: string
  returnRate: string
  availableTrees: number
  reservedTrees: number
  marketingMessage?: string
  comingSoonLabel?: string
  firstYearMaintenanceFree?: boolean
  treeTypes: TreeType[]
  contracts?: FarmContract[]
}

export interface FarmCategory {
  slug: string
  name: string
  icon: string
}

export const farmService = {
  async getAllFarms(status?: string) {
    let query = supabase
      .from('farms')
      .select(`
        *,
        category:farm_categories(*)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error
    return data as FarmWithCategory[]
  },

  async getFarmById(farmId: string) {
    const { data, error } = await supabase
      .from('farms')
      .select(`
        *,
        category:farm_categories(*)
      `)
      .eq('id', farmId)
      .single()

    if (error) throw error
    return data as FarmWithCategory
  },

  async getFarmsByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('farms')
      .select(`
        *,
        category:farm_categories(*)
      `)
      .eq('category_id', categoryId)
      .eq('status', 'active')
      .order('annual_return_rate', { ascending: false })

    if (error) throw error
    return data as FarmWithCategory[]
  },

  async getFeaturedFarms(limit: number = 3) {
    const { data, error } = await supabase
      .from('farms')
      .select(`
        *,
        category:farm_categories(*)
      `)
      .eq('status', 'active')
      .order('annual_return_rate', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as FarmWithCategory[]
  },

  async getAllCategories() {
    const { data, error } = await supabase
      .from('farm_categories')
      .select('*')
      .eq('active', true)
      .order('name_ar')

    if (error) throw error
    return data
  },

  async getDisplayCategories(): Promise<FarmCategory[]> {
    try {
      console.log('[farmService] Fetching display categories...')

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      const fetchPromise = supabase
        .from('farm_categories')
        .select('name_ar, icon, display_order')
        .eq('active', true)
        .order('display_order', { ascending: true });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        console.error('[farmService] Error fetching display categories:', error)
        throw error;
      }

      const categories: FarmCategory[] = (data || []).map((cat, index) => ({
        slug: cat.name_ar.trim().replace(/\s+/g, '-'),
        name: cat.name_ar.trim(),
        icon: cat.icon
      }));

      console.log(`[farmService] Found ${categories.length} categories:`, categories.map(c => c.slug))
      return categories
    } catch (error) {
      console.error('[farmService] Error in getDisplayCategories:', error)
      throw error;
    }
  },

  async getAllDisplayProjects(): Promise<Record<string, FarmProject[]>> {
    try {
      console.log('[farmService] Starting getAllDisplayProjects...')

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000);
      });

      const fetchProjectsPromise = supabase
        .from('farms')
        .select(`
          *,
          farm_categories!category_id(name_ar, icon)
        `)
        .eq('status', 'active')
        .order('order_index');

      const { data: projects, error: projectsError } = await Promise.race([fetchProjectsPromise, timeoutPromise]);

      if (projectsError) {
        console.error('[farmService] Error fetching all projects:', projectsError)
        throw projectsError;
      }

      if (!projects || projects.length === 0) {
        console.warn('[farmService] No projects found')
        return {}
      }

      console.log(`[farmService] Found ${projects.length} projects`)
      console.log('[farmService] First project structure:', JSON.stringify(projects[0], null, 2))
      const farmIds = projects.map(p => p.id)

      const { data: allContracts } = await supabase
        .from('farm_contracts')
        .select('*')
        .in('farm_id', farmIds)
        .eq('is_active', true)
        .order('display_order')

      console.log(`[farmService] Found ${allContracts?.length || 0} contracts`)

      const projectsByCategory: Record<string, FarmProject[]> = {}

      projects.forEach(project => {
        const categoryData = project.farm_categories;
        console.log(`[farmService] Project "${project.name_ar}" -> category object:`, JSON.stringify(categoryData));
        const categorySlug = categoryData?.name_ar?.trim().replace(/\s+/g, '-') || 'other';
        const treeTypes = project.tree_types || []
        const projectContracts = (allContracts || []).filter(c => c.farm_id === project.id)

        console.log(`[farmService] Project "${project.name_ar}" -> category slug: "${categorySlug}"`)

        const formattedTreeTypes: TreeType[] = treeTypes.map((tree: any) => ({
          id: tree.id || `tree-${Date.now()}-${Math.random()}`,
          slug: tree.name?.toLowerCase().replace(/\s+/g, '-') || '',
          name: tree.name || '',
          varieties: [{
            id: tree.id || `variety-${Date.now()}-${Math.random()}`,
            name: tree.subtitle || tree.name || '',
            price: tree.base_price || tree.price || 0,
            icon: '🌳',
            available: tree.count || tree.available || 0,
            maintenance_fee: tree.maintenance_fee || 0
          }]
        }))

        const farmProject: FarmProject = {
          id: project.id,
          name: project.name_ar || project.name_en,
          description: project.description_ar,
          image: project.image_url,
          heroImage: project.hero_image_url,
          video: project.video_url,
          location: project.location,
          mapUrl: project.map_url || '#',
          returnRate: project.return_rate_display || `${project.annual_return_rate}% سنوياً`,
          availableTrees: project.available_trees || 0,
          reservedTrees: project.reserved_trees || 0,
          marketingMessage: project.marketing_message,
          comingSoonLabel: project.coming_soon_label,
          firstYearMaintenanceFree: project.first_year_maintenance_free ?? true,
          treeTypes: formattedTreeTypes,
          contracts: projectContracts
        }

        if (!projectsByCategory[categorySlug]) {
          projectsByCategory[categorySlug] = []
        }
        projectsByCategory[categorySlug].push(farmProject)
      })

      console.log('[farmService] Successfully organized projects by category:', Object.keys(projectsByCategory))
      return projectsByCategory
    } catch (error) {
      console.error('[farmService] Error in getAllDisplayProjects:', error)
      throw error;
    }
  },

  async getDisplayProjectsByCategory(categorySlug: string): Promise<FarmProject[]> {
    try {
      const { data: projects, error } = await supabase
        .from('farm_display_projects')
        .select('*')
        .eq('category_slug', categorySlug)
        .eq('active', true)
        .order('order_index')

      if (error) {
        console.error('Error fetching display projects:', error)
        return []
      }

      if (!projects || projects.length === 0) {
        return []
      }

      const farmIds = projects.map(p => p.id)

      const { data: allTreeTypes, error: treeTypesError } = await supabase
        .from('farm_tree_types')
        .select('*')
        .in('farm_id', farmIds)
        .order('order_index')

      if (treeTypesError) {
        console.error('Error fetching tree types:', treeTypesError)
      }

      const treeTypeIds = allTreeTypes?.map(t => t.id) || []

      const { data: allVarieties, error: varietiesError } = await supabase
        .from('farm_tree_varieties')
        .select('*')
        .in('tree_type_id', treeTypeIds)
        .order('order_index')

      if (varietiesError) {
        console.error('Error fetching varieties:', varietiesError)
      }

      const projectsWithTrees = projects.map(project => {
        const projectTreeTypes = (allTreeTypes || []).filter(t => t.farm_id === project.id)

        const treeTypes: TreeType[] = projectTreeTypes.map(type => {
          const typeVarieties = (allVarieties || []).filter(v => v.tree_type_id === type.id)

          return {
            id: type.id,
            slug: type.slug,
            name: type.name,
            varieties: typeVarieties.map(v => ({
              id: v.id,
              name: v.name,
              price: parseFloat(v.price.toString()),
              icon: v.icon,
              available: v.available,
              maintenance_fee: parseFloat(v.maintenance_fee?.toString() || '0')
            }))
          }
        })

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          image: project.image,
          heroImage: project.hero_image,
          video: project.video,
          location: project.location,
          mapUrl: project.map_url,
          returnRate: project.return_rate,
          availableTrees: project.available_trees,
          reservedTrees: project.reserved_trees,
          marketingMessage: project.marketing_message,
          comingSoonLabel: project.coming_soon_label,
          treeTypes
        }
      })

      return projectsWithTrees
    } catch (error) {
      console.error('Error in getDisplayProjectsByCategory:', error)
      return []
    }
  },

  async getTreeTypesForFarm(farmId: string): Promise<TreeType[]> {
    const { data: types, error } = await supabase
      .from('farms_tree_types')
      .select('*')
      .eq('farm_id', farmId)
      .order('order_index')

    if (error) {
      console.error('Error fetching tree types:', error)
      return []
    }

    if (!types || types.length === 0) {
      return []
    }

    const typesWithVarieties = await Promise.all(
      types.map(async (type) => {
        const { data: varieties, error: varietiesError } = await supabase
          .from('farms_tree_varieties')
          .select('*')
          .eq('tree_type_id', type.id)
          .order('order_index')

        if (varietiesError) {
          console.error('Error fetching varieties:', varietiesError)
          return {
            id: type.id,
            slug: type.slug,
            name: type.name,
            varieties: []
          }
        }

        return {
          id: type.id,
          slug: type.slug,
          name: type.name,
          varieties: (varieties || []).map(v => ({
            id: v.id,
            name: v.name,
            price: parseFloat(v.price.toString()),
            icon: v.icon,
            available: v.available,
            maintenance_fee: parseFloat(v.maintenance_fee?.toString() || '0')
          }))
        }
      })
    )

    return typesWithVarieties
  },

  async getFarmProjectById(farmId: string): Promise<FarmProject | null> {
    const { data: project, error } = await supabase
      .from('farms')
      .select('*')
      .eq('id', farmId)
      .eq('status', 'active')
      .maybeSingle()

    if (error || !project) {
      console.error('Error fetching farm project:', error)
      return null
    }

    const { data: contracts } = await supabase
      .from('farm_contracts')
      .select('*')
      .eq('farm_id', farmId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    const treeTypes = project.tree_types || []

    const formattedTreeTypes: TreeType[] = treeTypes.map((tree: any) => ({
      id: tree.id || `tree-${Date.now()}-${Math.random()}`,
      slug: tree.name?.toLowerCase().replace(/\s+/g, '-') || '',
      name: tree.name || '',
      varieties: [{
        id: tree.id || `variety-${Date.now()}-${Math.random()}`,
        name: tree.subtitle || tree.name || '',
        price: tree.base_price || tree.price || 0,
        icon: '🌳',
        available: tree.count || tree.available || 0,
        maintenance_fee: tree.maintenance_fee || 0
      }]
    }))

    return {
      id: project.id,
      name: project.name_ar || project.name_en,
      description: project.description_ar,
      image: project.image_url,
      heroImage: project.hero_image_url,
      video: project.video_url,
      videoTitle: project.video_title || 'شاهد جولة المزرعة',
      location: project.location,
      mapUrl: project.map_url || '#',
      returnRate: project.return_rate_display || `${project.annual_return_rate}% سنوياً`,
      availableTrees: project.available_trees || 0,
      reservedTrees: project.reserved_trees || 0,
      marketingMessage: project.marketing_message,
      firstYearMaintenanceFree: project.first_year_maintenance_free ?? true,
      treeTypes: formattedTreeTypes,
      contracts: contracts || []
    }
  }
}
