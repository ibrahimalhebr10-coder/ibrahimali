import React, { useState, useEffect } from 'react';
import { Plus, Activity, Clock, CheckCircle, AlertTriangle, Edit2, Trash2, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface InvestmentStatus {
  id: string;
  user_id: string;
  contract_id: string | null;
  current_status: 'نشط' | 'فترة مجانية' | 'يقترب من الانتهاء' | 'مكتمل';
  status_start_date: string;
  status_end_date: string | null;
  free_period_remaining_days: number;
  notes: string | null;
  created_at: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface Contract {
  id: string;
  reference_number: string;
}

const InvestmentStatusTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [statuses, setStatuses] = useState<InvestmentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    contract_id: '',
    current_status: 'نشط' as InvestmentStatus['current_status'],
    status_start_date: new Date().toISOString().split('T')[0],
    status_end_date: '',
    free_period_remaining_days: 0,
    notes: '',
  });

  useEffect(() => {
    loadUsers();
    loadContracts();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadStatuses();
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .order('full_name');
    if (data) setUsers(data);
  };

  const loadContracts = async () => {
    const { data } = await supabase
      .from('reservations')
      .select('id, reference_number')
      .order('created_at', { ascending: false });
    if (data) setContracts(data);
  };

  const loadStatuses = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    const { data } = await supabase
      .from('investment_status_tracking')
      .select('*')
      .eq('user_id', selectedUserId)
      .order('created_at', { ascending: false });

    if (data) setStatuses(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    const payload = {
      ...formData,
      user_id: selectedUserId,
      contract_id: formData.contract_id || null,
      status_end_date: formData.status_end_date || null,
    };

    if (editingId) {
      await supabase
        .from('investment_status_tracking')
        .update(payload)
        .eq('id', editingId);
    } else {
      await supabase
        .from('investment_status_tracking')
        .insert([payload]);
    }

    resetForm();
    loadStatuses();
  };

  const handleEdit = (status: InvestmentStatus) => {
    setEditingId(status.id);
    setFormData({
      contract_id: status.contract_id || '',
      current_status: status.current_status,
      status_start_date: status.status_start_date,
      status_end_date: status.status_end_date || '',
      free_period_remaining_days: status.free_period_remaining_days,
      notes: status.notes || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الحالة؟')) {
      await supabase
        .from('investment_status_tracking')
        .delete()
        .eq('id', id);
      loadStatuses();
    }
  };

  const resetForm = () => {
    setFormData({
      contract_id: '',
      current_status: 'نشط',
      status_start_date: new Date().toISOString().split('T')[0],
      status_end_date: '',
      free_period_remaining_days: 0,
      notes: '',
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const getStatusIcon = (status: InvestmentStatus['current_status']) => {
    const icons = {
      'نشط': Activity,
      'فترة مجانية': Clock,
      'يقترب من الانتهاء': AlertTriangle,
      'مكتمل': CheckCircle,
    };
    return icons[status];
  };

  const getStatusColor = (status: InvestmentStatus['current_status']) => {
    const colors = {
      'نشط': 'bg-green-100 text-green-700 border-green-200',
      'فترة مجانية': 'bg-blue-100 text-blue-700 border-blue-200',
      'يقترب من الانتهاء': 'bg-amber-100 text-amber-700 border-amber-200',
      'مكتمل': 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[status];
  };

  const getContractRef = (contractId: string | null) => {
    if (!contractId) return 'بدون عقد';
    return contracts.find(c => c.id === contractId)?.reference_number || 'غير محدد';
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  const statusCounts = {
    'نشط': statuses.filter(s => s.current_status === 'نشط').length,
    'فترة مجانية': statuses.filter(s => s.current_status === 'فترة مجانية').length,
    'يقترب من الانتهاء': statuses.filter(s => s.current_status === 'يقترب من الانتهاء').length,
    'مكتمل': statuses.filter(s => s.current_status === 'مكتمل').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-darkgreen">حالة الاستثمار</h2>
          <p className="text-gray-600 text-sm mt-1">تتبع وإدارة حالات الاستثمار للمستثمرين</p>
        </div>
        {selectedUserId && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة حالة</span>
          </button>
        )}
      </div>

      {/* User Selector */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">اختر المستثمر</label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">-- اختر مستثمر --</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      {selectedUserId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-green-600" />
                <p className="text-xs text-gray-600">نشط</p>
              </div>
              <p className="text-2xl font-bold text-green-700">{statusCounts['نشط']}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-gray-600">فترة مجانية</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{statusCounts['فترة مجانية']}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <p className="text-xs text-gray-600">يقترب من الانتهاء</p>
              </div>
              <p className="text-2xl font-bold text-amber-700">{statusCounts['يقترب من الانتهاء']}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-gray-600" />
                <p className="text-xs text-gray-600">مكتمل</p>
              </div>
              <p className="text-2xl font-bold text-gray-700">{statusCounts['مكتمل']}</p>
            </div>
          </div>

          {/* Statuses List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">جاري التحميل...</p>
            </div>
          ) : statuses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد حالات مسجلة لهذا المستثمر</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                إضافة أول حالة
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {statuses.map((status) => {
                const StatusIcon = getStatusIcon(status.current_status);
                return (
                  <div key={status.id} className={`bg-white rounded-lg border-2 p-4 shadow-sm hover:shadow-md transition-shadow ${getStatusColor(status.current_status)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md">
                          <StatusIcon className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold">{status.current_status}</h3>
                            {status.free_period_remaining_days > 0 && status.current_status === 'فترة مجانية' && (
                              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">
                                {status.free_period_remaining_days} يوم متبقي
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-2">
                            <div>
                              <span className="text-gray-600">بداية الحالة:</span>
                              <span className="font-medium mr-2">
                                {new Date(status.status_start_date).toLocaleDateString('ar-SA')}
                              </span>
                            </div>
                            {status.status_end_date && (
                              <div>
                                <span className="text-gray-600">نهاية الحالة:</span>
                                <span className="font-medium mr-2">
                                  {new Date(status.status_end_date).toLocaleDateString('ar-SA')}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">العقد:</span>
                            <span className="font-medium mr-2">{getContractRef(status.contract_id)}</span>
                          </div>
                          {status.notes && (
                            <p className="text-xs mt-2 bg-white/50 p-2 rounded">{status.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(status)}
                          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(status.id)}
                          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-darkgreen">
                {editingId ? 'تعديل الحالة' : 'إضافة حالة جديدة'}
              </h3>
              {selectedUser && (
                <p className="text-sm text-gray-600 mt-1">
                  للمستثمر: {selectedUser.full_name}
                </p>
              )}
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">العقد المرتبط</label>
                <select
                  value={formData.contract_id}
                  onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">-- بدون عقد --</option>
                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.reference_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحالة الحالية *</label>
                <select
                  required
                  value={formData.current_status}
                  onChange={(e) => setFormData({ ...formData, current_status: e.target.value as InvestmentStatus['current_status'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="نشط">نشط</option>
                  <option value="فترة مجانية">فترة مجانية</option>
                  <option value="يقترب من الانتهاء">يقترب من الانتهاء</option>
                  <option value="مكتمل">مكتمل</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">بداية الحالة *</label>
                  <input
                    type="date"
                    required
                    value={formData.status_start_date}
                    onChange={(e) => setFormData({ ...formData, status_start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نهاية الحالة</label>
                  <input
                    type="date"
                    value={formData.status_end_date}
                    onChange={(e) => setFormData({ ...formData, status_end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {formData.current_status === 'فترة مجانية' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الأيام المتبقية من الفترة المجانية</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.free_period_remaining_days}
                    onChange={(e) => setFormData({ ...formData, free_period_remaining_days: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  {editingId ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentStatusTab;
