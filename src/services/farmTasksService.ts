import { supabase } from '../lib/supabase';

export interface FarmTask {
  id: string;
  farm_id: string;
  task_type: string;
  description: string;
  assigned_to: string;
  assigned_by: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  status: 'pending' | 'in_progress' | 'completed';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FarmTaskWithDetails extends FarmTask {
  assigned_to_admin: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  assigned_by_admin?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  farm: {
    id: string;
    name_ar: string;
    name_en: string;
  } | null;
}

class FarmTasksService {
  async createTask(taskData: {
    farm_id: string;
    task_type: string;
    description: string;
    assigned_to: string;
    start_time: string;
    notes?: string;
  }): Promise<FarmTask | null> {
    try {
      const { data: currentAdmin } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { data, error } = await supabase
        .from('farm_tasks')
        .insert({
          ...taskData,
          assigned_by: currentAdmin?.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  }

  async updateTask(taskId: string, updates: {
    task_type?: string;
    description?: string;
    assigned_to?: string;
    start_time?: string;
    end_time?: string;
    status?: 'pending' | 'in_progress' | 'completed';
    notes?: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('farm_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      return false;
    }
  }

  async completeTask(taskId: string, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('farm_tasks')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          notes: notes || null
        })
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error completing task:', error);
      return false;
    }
  }

  async startTask(taskId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('farm_tasks')
        .update({
          status: 'in_progress'
        })
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error starting task:', error);
      return false;
    }
  }

  async deleteTask(taskId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('farm_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  async getFarmTasks(farmId: string): Promise<FarmTaskWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('farm_tasks')
        .select(`
          *,
          assigned_to_admin:admins!farm_tasks_assigned_to_fkey(id, full_name, email),
          assigned_by_admin:admins!farm_tasks_assigned_by_fkey(id, full_name, email),
          farm:farms!farm_tasks_farm_id_fkey(id, name_ar, name_en)
        `)
        .eq('farm_id', farmId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting farm tasks:', error);
      return [];
    }
  }

  async getMyTasks(): Promise<FarmTaskWithDetails[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', user.user.id)
        .single();

      if (!admin) return [];

      const { data, error } = await supabase
        .from('farm_tasks')
        .select(`
          *,
          assigned_to_admin:admins!farm_tasks_assigned_to_fkey(id, full_name, email),
          assigned_by_admin:admins!farm_tasks_assigned_by_fkey(id, full_name, email),
          farm:farms!farm_tasks_farm_id_fkey(id, name_ar, name_en)
        `)
        .eq('assigned_to', admin.id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting my tasks:', error);
      return [];
    }
  }

  async getTaskById(taskId: string): Promise<FarmTaskWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('farm_tasks')
        .select(`
          *,
          assigned_to_admin:admins!farm_tasks_assigned_to_fkey(id, full_name, email),
          assigned_by_admin:admins!farm_tasks_assigned_by_fkey(id, full_name, email),
          farm:farms!farm_tasks_farm_id_fkey(id, name_ar, name_en)
        `)
        .eq('id', taskId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting task by id:', error);
      return null;
    }
  }

  async canManageTask(taskId: string): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', user.user.id)
        .single();

      if (!admin) return false;

      const { data: task } = await supabase
        .from('farm_tasks')
        .select('farm_id, assigned_to')
        .eq('id', taskId)
        .single();

      if (!task) return false;

      if (task.assigned_to === admin.id) return true;

      const { data: assignment } = await supabase
        .from('admin_farm_assignments')
        .select('assignment_type')
        .eq('admin_id', admin.id)
        .eq('farm_id', task.farm_id)
        .eq('is_active', true)
        .in('assignment_type', ['full_access', 'supervisor'])
        .maybeSingle();

      return !!assignment;
    } catch (error) {
      console.error('Error checking task management permission:', error);
      return false;
    }
  }
}

export const farmTasksService = new FarmTasksService();
