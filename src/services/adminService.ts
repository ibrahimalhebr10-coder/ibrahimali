import { supabase } from '../lib/supabase';

export interface Admin {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'farm_manager' | 'financial_manager' | 'support';
  role_id?: string;
  permissions: {
    view_farms: boolean;
    manage_farms: boolean;
    view_reservations: boolean;
    manage_reservations: boolean;
    view_payments: boolean;
    manage_payments: boolean;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action_type: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'view' | 'export';
  entity_type: 'farm' | 'reservation' | 'payment' | 'user' | 'message' | 'settings';
  entity_id: string | null;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  reservation_id: string;
  user_id: string;
  amount: number;
  payment_method: 'mada' | 'bank_transfer' | 'tamara' | 'tabby' | 'cash';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  transaction_reference: string | null;
  payment_date: string | null;
  approved_by: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeInvestors: number;
  totalTreesBooked: number;
  activeHarvestOperations: number;
  pendingActions: number;
  todayPayments: number;
  pendingPayments: number;
}

export interface FarmStats {
  id: string;
  name: string;
  category: string;
  image: string;
  totalTrees: number;
  availableTrees: number;
  reservedTrees: number;
  bookingPercentage: number;
  status: string;
  isOpenForBooking: boolean;
  maintenanceStatus: string;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
}

class AdminService {
  async getCurrentAdmin(): Promise<Admin | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting current admin:', error);
      return null;
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [
        { count: totalUsers },
        { count: activeInvestors },
        reservations,
        { count: pendingPayments },
        todayPayments
      ] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).gt('total_invested', 0),
        supabase.from('reservations').select('total_trees'),
        supabase.from('payment_transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('payment_transactions')
          .select('amount')
          .eq('status', 'completed')
          .gte('payment_date', new Date().toISOString().split('T')[0])
      ]);

      const totalTreesBooked = reservations.data?.reduce((sum, r) => sum + (r.total_trees || 0), 0) || 0;
      const todayPaymentsTotal = todayPayments.data?.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0) || 0;

      return {
        totalUsers: totalUsers || 0,
        activeInvestors: activeInvestors || 0,
        totalTreesBooked,
        activeHarvestOperations: 0,
        pendingActions: pendingPayments || 0,
        todayPayments: todayPaymentsTotal,
        pendingPayments: pendingPayments || 0
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalUsers: 0,
        activeInvestors: 0,
        totalTreesBooked: 0,
        activeHarvestOperations: 0,
        pendingActions: 0,
        todayPayments: 0,
        pendingPayments: 0
      };
    }
  }

  async getAllFarms(): Promise<FarmStats[]> {
    try {
      const { data, error } = await supabase
        .from('farms')
        .select(`
          *,
          category:farm_categories(name_ar)
        `)
        .order('order_index', { ascending: true });

      if (error) throw error;

      return (data || []).map(farm => {
        const totalTrees = (farm.available_trees || 0) + (farm.reserved_trees || 0);
        const bookingPercentage = totalTrees > 0 ? (farm.reserved_trees / totalTrees) * 100 : 0;

        return {
          id: farm.id,
          name: farm.name_ar || farm.name_en,
          category: farm.category?.name_ar || '',
          image: farm.image_url || '',
          totalTrees,
          availableTrees: farm.available_trees || 0,
          reservedTrees: farm.reserved_trees || 0,
          bookingPercentage: Math.round(bookingPercentage),
          status: farm.status,
          isOpenForBooking: true,
          maintenanceStatus: 'active',
          lastMaintenanceDate: null,
          nextMaintenanceDate: null
        };
      });
    } catch (error) {
      console.error('Error getting all farms:', error);
      return [];
    }
  }

  async getFarmReservations(farmId: string) {
    try {
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          *,
          items:reservation_items(*)
        `)
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!reservations) return [];

      const userIds = [...new Set(reservations.map(r => r.user_id))];

      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone')
        .in('id', userIds);

      if (usersError) throw usersError;

      const usersMap = new Map(users?.map(u => [u.id, u]) || []);

      return reservations.map(reservation => ({
        ...reservation,
        user: usersMap.get(reservation.user_id) || null
      }));
    } catch (error) {
      console.error('Error getting farm reservations:', error);
      return [];
    }
  }

  async updateFarmStatus(farmId: string, isOpenForBooking: boolean) {
    try {
      const newStatus = isOpenForBooking ? 'active' : 'upcoming';
      const { error } = await supabase
        .from('farms')
        .update({ status: newStatus })
        .eq('id', farmId);

      if (error) throw error;

      await this.logAction('update', 'farm', farmId.toString(), `تم ${isOpenForBooking ? 'فتح' : 'إغلاق'} الحجز للمزرعة`);

      return true;
    } catch (error) {
      console.error('Error updating farm status:', error);
      return false;
    }
  }

  async toggleFarmActive(farmId: string, active: boolean) {
    try {
      const newStatus = active ? 'active' : 'closed';
      const { error } = await supabase
        .from('farms')
        .update({ status: newStatus })
        .eq('id', farmId);

      if (error) throw error;

      await this.logAction('update', 'farm', farmId.toString(), `تم ${active ? 'تشغيل' : 'إيقاف'} المزرعة`);

      return true;
    } catch (error) {
      console.error('Error toggling farm active:', error);
      return false;
    }
  }

  async updateFarmMaintenance(farmId: string, maintenanceData: {
    maintenance_status?: string;
    last_maintenance_date?: string;
    next_maintenance_date?: string;
    admin_notes?: string;
  }) {
    try {
      const { error } = await supabase
        .from('farm_display_projects')
        .update(maintenanceData)
        .eq('id', farmId);

      if (error) throw error;

      await this.logAction('update', 'farm', farmId.toString(), 'تم تحديث بيانات الصيانة للمزرعة');

      return true;
    } catch (error) {
      console.error('Error updating farm maintenance:', error);
      return false;
    }
  }

  async approveReservation(reservationId: string, adminNotes?: string) {
    try {
      const admin = await this.getCurrentAdmin();
      if (!admin) throw new Error('Admin not found');

      const { error } = await supabase
        .from('reservations')
        .update({
          status: 'confirmed',
          approved_by: admin.id,
          approved_at: new Date().toISOString(),
          admin_notes: adminNotes
        })
        .eq('id', reservationId);

      if (error) throw error;

      await this.logAction('approve', 'reservation', reservationId, 'تم تأكيد الحجز');

      return true;
    } catch (error) {
      console.error('Error approving reservation:', error);
      return false;
    }
  }

  async rejectReservation(reservationId: string, reason: string) {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          admin_notes: reason
        })
        .eq('id', reservationId);

      if (error) throw error;

      await this.logAction('reject', 'reservation', reservationId, `تم رفض الحجز: ${reason}`);

      return true;
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      return false;
    }
  }

  async getPaymentTransactions(filters?: {
    status?: string;
    payment_method?: string;
    date_from?: string;
    date_to?: string;
  }) {
    try {
      let query = supabase
        .from('payment_transactions')
        .select(`
          *,
          reservation:reservations(farm_name, total_trees)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }
      if (filters?.date_from) {
        query = query.gte('payment_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('payment_date', filters.date_to);
      }

      const { data: transactions, error } = await query;

      if (error) throw error;
      if (!transactions) return [];

      const userIds = [...new Set(transactions.map(t => t.user_id))];

      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone')
        .in('id', userIds);

      if (usersError) throw usersError;

      const usersMap = new Map(users?.map(u => [u.id, u]) || []);

      return transactions.map(transaction => ({
        ...transaction,
        user: usersMap.get(transaction.user_id) || null
      }));
    } catch (error) {
      console.error('Error getting payment transactions:', error);
      return [];
    }
  }

  async approvePayment(transactionId: string) {
    try {
      const admin = await this.getCurrentAdmin();
      if (!admin) throw new Error('Admin not found');

      const { error } = await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          payment_date: new Date().toISOString(),
          approved_by: admin.id
        })
        .eq('id', transactionId);

      if (error) throw error;

      await this.logAction('approve', 'payment', transactionId, 'تم تأكيد الدفع');

      return true;
    } catch (error) {
      console.error('Error approving payment:', error);
      return false;
    }
  }

  async getAdminLogs(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select(`
          *,
          admin:admins(full_name, role)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting admin logs:', error);
      return [];
    }
  }

  async createFarm(farmData: {
    name: string;
    category_slug: string;
    description: string;
    location: string;
    area_size?: string;
    image: string;
    hero_image?: string;
    marketing_text?: string;
    video_url?: string;
    video_title?: string;
    map_url?: string;
    total_trees: number;
    tree_types: any[];
    contracts?: any[];
    status: string;
    order_index: number;
    first_year_maintenance_free?: boolean;
  }) {
    try {
      const { data: category } = await supabase
        .from('farm_categories')
        .select('id')
        .eq('name_ar', farmData.category_slug)
        .maybeSingle();

      if (!category) {
        return { success: false, error: 'Category not found' };
      }

      const totalTreeCount = farmData.tree_types.reduce((sum: number, tree: any) => sum + (tree.count || 0), 0);

      const { data, error } = await supabase
        .from('farms')
        .insert({
          category_id: category.id,
          name_ar: farmData.name,
          name_en: farmData.name,
          description_ar: farmData.description,
          image_url: farmData.image,
          hero_image_url: farmData.hero_image,
          marketing_text: farmData.marketing_text,
          video_url: farmData.video_url,
          video_title: farmData.video_title || 'شاهد جولة المزرعة',
          map_url: farmData.map_url || '#',
          location: farmData.location,
          area_size: farmData.area_size,
          annual_return_rate: 25,
          min_investment: 100,
          max_investment: 10000,
          total_capacity: 1000000,
          current_invested: 0,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: farmData.status,
          total_trees: farmData.total_trees,
          available_trees: totalTreeCount,
          reserved_trees: 0,
          return_rate_display: '25% سنوياً',
          order_index: farmData.order_index,
          tree_types: farmData.tree_types || [],
          first_year_maintenance_free: farmData.first_year_maintenance_free ?? true
        })
        .select()
        .single();

      if (error) throw error;

      if (farmData.contracts && farmData.contracts.length > 0) {
        const contractsToInsert = farmData.contracts.map((contract: any) => ({
          farm_id: data.id,
          contract_name: contract.contract_name,
          duration_years: contract.duration_years,
          investor_price: contract.investor_price,
          bonus_years: contract.bonus_years || 0,
          is_active: contract.is_active !== false,
          display_order: contract.display_order || 0
        }));

        const { error: contractsError } = await supabase
          .from('farm_contracts')
          .insert(contractsToInsert);

        if (contractsError) {
          console.error('Error inserting contracts:', contractsError);
        }
      }

      await this.logAction('create', 'farm', data.id.toString(), `تم إنشاء مزرعة جديدة: ${farmData.name}`);

      return { success: true, data };
    } catch (error) {
      console.error('Error creating farm:', error);
      return { success: false, error };
    }
  }

  async updateFarm(farmId: string, farmData: {
    name?: string;
    category_slug?: string;
    description?: string;
    location?: string;
    area_size?: string;
    image?: string;
    hero_image?: string;
    marketing_text?: string;
    video_url?: string;
    video_title?: string;
    map_url?: string;
    total_trees?: number;
    tree_types?: any[];
    contracts?: any[];
    status?: string;
    order_index?: number;
    first_year_maintenance_free?: boolean;
  }) {
    try {
      let updateData: any = {};

      if (farmData.name) {
        updateData.name_ar = farmData.name;
        updateData.name_en = farmData.name;
      }
      if (farmData.description) updateData.description_ar = farmData.description;
      if (farmData.location) updateData.location = farmData.location;
      if (farmData.area_size !== undefined) updateData.area_size = farmData.area_size;
      if (farmData.image) updateData.image_url = farmData.image;
      if (farmData.hero_image !== undefined) updateData.hero_image_url = farmData.hero_image;
      if (farmData.marketing_text !== undefined) updateData.marketing_text = farmData.marketing_text;
      if (farmData.video_url !== undefined) updateData.video_url = farmData.video_url;
      if (farmData.video_title !== undefined) updateData.video_title = farmData.video_title;
      if (farmData.map_url !== undefined) updateData.map_url = farmData.map_url;
      if (farmData.total_trees !== undefined) updateData.total_trees = farmData.total_trees;
      if (farmData.order_index !== undefined) updateData.order_index = farmData.order_index;
      if (farmData.first_year_maintenance_free !== undefined) updateData.first_year_maintenance_free = farmData.first_year_maintenance_free;
      if (farmData.tree_types !== undefined) {
        updateData.tree_types = farmData.tree_types;
        const totalTreeCount = farmData.tree_types.reduce((sum: number, tree: any) => sum + (tree.count || 0), 0);
        updateData.available_trees = totalTreeCount;
      }
      if (farmData.status !== undefined) updateData.status = farmData.status;

      if (farmData.category_slug) {
        const { data: category } = await supabase
          .from('farm_categories')
          .select('id')
          .eq('name_ar', farmData.category_slug)
          .maybeSingle();

        if (category) {
          updateData.category_id = category.id;
        }
      }

      const { data, error } = await supabase
        .from('farms')
        .update(updateData)
        .eq('id', farmId)
        .select()
        .single();

      if (error) throw error;

      if (farmData.contracts !== undefined) {
        const { data: existingContracts } = await supabase
          .from('farm_contracts')
          .select('id')
          .eq('farm_id', farmId);

        const existingIds = new Set(existingContracts?.map(c => c.id) || []);
        const incomingIds = new Set(
          farmData.contracts
            .map((c: any) => c.id)
            .filter((id: string) => id && !id.startsWith('contract-'))
        );

        const contractsToDelete = Array.from(existingIds).filter(id => !incomingIds.has(id));

        if (contractsToDelete.length > 0) {
          const { data: referencedContracts } = await supabase
            .from('reservations')
            .select('contract_id')
            .in('contract_id', contractsToDelete);

          const referencedIds = new Set(referencedContracts?.map(r => r.contract_id) || []);
          const safeToDelete = contractsToDelete.filter(id => !referencedIds.has(id));

          if (safeToDelete.length > 0) {
            await supabase
              .from('farm_contracts')
              .delete()
              .in('id', safeToDelete);
          }

          const toDeactivate = contractsToDelete.filter(id => referencedIds.has(id));
          if (toDeactivate.length > 0) {
            await supabase
              .from('farm_contracts')
              .update({ is_active: false })
              .in('id', toDeactivate);
          }
        }

        for (const contract of farmData.contracts) {
          const contractData = {
            farm_id: farmId,
            contract_name: contract.contract_name,
            duration_years: contract.duration_years,
            investor_price: contract.investor_price,
            bonus_years: contract.bonus_years || 0,
            is_active: contract.is_active !== false,
            display_order: contract.display_order || 0
          };

          if (contract.id && !contract.id.startsWith('contract-')) {
            const { error: updateError } = await supabase
              .from('farm_contracts')
              .update(contractData)
              .eq('id', contract.id);

            if (updateError) {
              console.error('Error updating contract:', updateError);
            }
          } else {
            const { error: insertError } = await supabase
              .from('farm_contracts')
              .insert(contractData);

            if (insertError) {
              console.error('Error inserting contract:', insertError);
            }
          }
        }
      }

      await this.logAction('update', 'farm', farmId.toString(), `تم تحديث بيانات المزرعة`);

      return { success: true, data };
    } catch (error) {
      console.error('Error updating farm:', error);
      return { success: false, error };
    }
  }

  async deleteFarm(farmId: string) {
    try {
      const { count, error: countError } = await supabase
        .from('reservations')
        .select('id', { count: 'exact', head: false })
        .eq('farm_id', farmId);

      if (countError) throw countError;

      if (count && count > 0) {
        return {
          success: false,
          error: 'لا يمكن حذف هذه المزرعة لأنها تحتوي على حجوزات',
          hasReservations: true
        };
      }

      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', farmId);

      if (error) throw error;

      await this.logAction('delete', 'farm', farmId.toString(), 'تم حذف المزرعة');

      return { success: true };
    } catch (error) {
      console.error('Error deleting farm:', error);
      return { success: false, error };
    }
  }

  async getFarmById(farmId: string) {
    try {
      const { data, error } = await supabase
        .from('farms')
        .select(`
          *,
          category:farm_categories(name_ar)
        `)
        .eq('id', farmId)
        .single();

      if (error) throw error;

      const { data: contracts } = await supabase
        .from('farm_contracts')
        .select('*')
        .eq('farm_id', farmId)
        .order('display_order', { ascending: true });

      return {
        ...data,
        name: data.name_ar,
        category_slug: data.category?.name_ar || '',
        description: data.description_ar,
        image: data.image_url,
        total_trees: data.total_trees || 0,
        tree_types: data.tree_types || [],
        contracts: contracts || []
      };
    } catch (error) {
      console.error('Error getting farm by id:', error);
      return null;
    }
  }

  async logAction(
    actionType: AdminLog['action_type'],
    entityType: AdminLog['entity_type'],
    entityId: string,
    description: string,
    metadata: Record<string, any> = {}
  ) {
    try {
      const admin = await this.getCurrentAdmin();
      if (!admin) return;

      const { error } = await supabase
        .from('admin_logs')
        .insert({
          admin_id: admin.id,
          action_type: actionType,
          entity_type: entityType,
          entity_id: entityId,
          description,
          metadata
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }

  async getAllAdmins(): Promise<Admin[]> {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all admins:', error);
      return [];
    }
  }

  async createAdmin(adminData: {
    full_name: string;
    email: string;
    role_id: string;
    password: string;
  }): Promise<boolean> {
    try {
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: adminData.email,
        password: adminData.password,
        options: {
          data: {
            full_name: adminData.full_name
          }
        }
      });

      if (authError) throw authError;
      if (!authUser.user) throw new Error('Failed to create user');

      const { error: adminError } = await supabase
        .from('admins')
        .insert({
          user_id: authUser.user.id,
          email: adminData.email,
          full_name: adminData.full_name,
          role_id: adminData.role_id,
          role: 'support',
          is_active: true
        });

      if (adminError) throw adminError;

      await this.logAction('create', 'user', authUser.user.id, `تم إنشاء مستخدم إداري جديد: ${adminData.full_name}`);

      return true;
    } catch (error) {
      console.error('Error creating admin:', error);
      return false;
    }
  }

  async updateAdmin(adminId: string, updates: {
    full_name?: string;
    email?: string;
    role_id?: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admins')
        .update(updates)
        .eq('id', adminId);

      if (error) throw error;

      await this.logAction('update', 'user', adminId, 'تم تحديث بيانات المستخدم الإداري');

      return true;
    } catch (error) {
      console.error('Error updating admin:', error);
      return false;
    }
  }

  async toggleAdminStatus(adminId: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admins')
        .update({ is_active: isActive })
        .eq('id', adminId);

      if (error) throw error;

      await this.logAction(
        'update',
        'user',
        adminId,
        `تم ${isActive ? 'تفعيل' : 'إيقاف'} المستخدم الإداري`
      );

      return true;
    } catch (error) {
      console.error('Error toggling admin status:', error);
      return false;
    }
  }
}

export const adminService = new AdminService();
