import { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, AlertCircle, User, Calendar, X, ClipboardList } from 'lucide-react';
import { farmTasksService, type FarmTaskWithDetails } from '../../services/farmTasksService';
import { supabase } from '../../lib/supabase';

interface Farm {
  id: string;
  name_ar: string;
}

interface TasksTabProps {
  farm: Farm;
}

export default function TasksTab({ farm }: TasksTabProps) {
  const [tasks, setTasks] = useState<FarmTaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<string>('');
  const [canManageFarm, setCanManageFarm] = useState(false);
  const [formData, setFormData] = useState({
    task_type: '',
    description: '',
    assigned_to: '',
    start_time: '',
    notes: ''
  });

  useEffect(() => {
    loadTasks();
    loadAvailableUsers();
    loadCurrentAdmin();
  }, [farm.id]);

  async function loadCurrentAdmin() {
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      const { data: admin } = await supabase
        .from('admins')
        .select('id, admin_roles!inner(role_key)')
        .eq('user_id', user.user.id)
        .single();

      if (admin) {
        setCurrentAdminId(admin.id);

        const isSuperAdmin = (admin.admin_roles as any).role_key === 'super_admin';

        if (isSuperAdmin) {
          setCanManageFarm(true);
        } else {
          const { data: assignment } = await supabase
            .from('admin_farm_assignments')
            .select('assignment_type')
            .eq('admin_id', admin.id)
            .eq('farm_id', farm.id)
            .eq('is_active', true)
            .in('assignment_type', ['full_access', 'supervisor'])
            .maybeSingle();

          setCanManageFarm(!!assignment);
        }
      }
    }
  }

  async function loadTasks() {
    setLoading(true);
    const data = await farmTasksService.getFarmTasks(farm.id);
    setTasks(data);
    setLoading(false);
  }

  async function loadAvailableUsers() {
    try {
      const { data, error } = await supabase
        .from('admin_farm_assignments')
        .select(`
          admins!admin_farm_assignments_admin_id_fkey(id, full_name, email)
        `)
        .eq('farm_id', farm.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error loading available users:', error);
        return;
      }

      if (data) {
        const users = data
          .map((item: any) => item.admins)
          .filter((admin: any) => admin !== null);
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error('Error loading available users:', error);
    }
  }

  async function handleCreateTask() {
    if (!formData.task_type || !formData.description || !formData.assigned_to || !formData.start_time) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const result = await farmTasksService.createTask({
      farm_id: farm.id,
      ...formData
    });

    if (result) {
      setShowAddModal(false);
      setFormData({
        task_type: '',
        description: '',
        assigned_to: '',
        start_time: '',
        notes: ''
      });
      loadTasks();
    }
  }

  async function handleStartTask(taskId: string) {
    const result = await farmTasksService.startTask(taskId);
    if (result) loadTasks();
  }

  async function handleCompleteTask(taskId: string) {
    const notes = prompt('ملاحظات عند الإغلاق (اختياري):');
    const result = await farmTasksService.completeTask(taskId, notes || undefined);
    if (result) loadTasks();
  }

  function formatDuration(minutes: number | null): string {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours} ساعة و ${mins} دقيقة`;
    }
    return `${mins} دقيقة`;
  }

  function canCompleteTask(task: FarmTaskWithDetails): boolean {
    if (task.status === 'completed') return false;
    return task.assigned_to === currentAdminId || canManageFarm;
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
    completed: 'bg-green-100 text-green-800 border-green-300'
  };

  const statusLabels = {
    pending: 'معلقة',
    in_progress: 'جارية',
    completed: 'مكتملة'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">مهام العمل</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مهمة</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد مهام حالياً</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.filter(task => task !== null).map((task) => (
            <div
              key={task.id}
              className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-1">{task.task_type}</h4>
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[task.status]}`}>
                  {statusLabels[task.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{task.assigned_to_admin?.full_name || 'غير محدد'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(task.start_time).toLocaleString('ar-SA')}</span>
                </div>
                {task.end_time && (
                  <>
                    <div className="flex items-center gap-2 text-gray-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>{new Date(task.end_time).toLocaleString('ar-SA')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>المدة: {formatDuration(task.duration_minutes)}</span>
                    </div>
                  </>
                )}
              </div>

              {task.notes && (
                <div className="mb-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                  <strong>ملاحظات:</strong> {task.notes}
                </div>
              )}

              {task.status !== 'completed' && canCompleteTask(task) && (
                <div className="flex gap-2">
                  {task.status === 'pending' && (
                    <button
                      onClick={() => handleStartTask(task.id)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      بدء المهمة
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      إغلاق المهمة
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-green-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">إضافة مهمة جديدة</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  نوع العمل *
                </label>
                <input
                  type="text"
                  value={formData.task_type}
                  onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="مثال: ري، تسميد، تقليم..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  الوصف *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  rows={3}
                  placeholder="وصف تفصيلي للمهمة..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  المكلف *
                </label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  required
                >
                  <option value="">-- اختر المكلف --</option>
                  {availableUsers.filter(user => user !== null).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  وقت البدء *
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  rows={2}
                  placeholder="ملاحظات إضافية (اختياري)..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateTask}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  إضافة المهمة
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
