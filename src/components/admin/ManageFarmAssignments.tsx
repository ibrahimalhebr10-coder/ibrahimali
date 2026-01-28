import { useState, useEffect } from 'react';
import { X, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Farm {
  id: string;
  name_ar: string;
  name_en: string;
  location: string;
  status: string;
}

interface Assignment {
  id: string;
  farm_id: string;
  assignment_type: string;
  is_active: boolean;
}

interface ManageFarmAssignmentsProps {
  admin: {
    id: string;
    full_name: string;
    email: string;
  };
  onClose: () => void;
  onUpdate: () => void;
}

export default function ManageFarmAssignments({ admin, onClose, onUpdate }: ManageFarmAssignmentsProps) {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [admin.id]);

  async function loadData() {
    setLoading(true);
    try {
      const [farmsResult, assignmentsResult] = await Promise.all([
        supabase
          .from('farms')
          .select('*')
          .eq('status', 'completed')
          .order('name_ar'),
        supabase
          .from('admin_farm_assignments')
          .select('*')
          .eq('admin_id', admin.id)
          .eq('is_active', true)
      ]);

      if (farmsResult.data) setFarms(farmsResult.data);
      if (assignmentsResult.data) setAssignments(assignmentsResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function isAssigned(farmId: string): boolean {
    return assignments.some(a => a.farm_id === farmId && a.is_active);
  }

  async function toggleAssignment(farmId: string) {
    setSaving(true);
    try {
      const existingAssignment = assignments.find(a => a.farm_id === farmId);

      if (existingAssignment) {
        await supabase
          .from('admin_farm_assignments')
          .update({ is_active: false })
          .eq('id', existingAssignment.id);
      } else {
        await supabase
          .from('admin_farm_assignments')
          .insert({
            admin_id: admin.id,
            farm_id: farmId,
            assignment_type: 'full_access',
            is_active: true
          });
      }

      await loadData();
      onUpdate();
    } catch (error) {
      console.error('Error toggling assignment:', error);
      alert('حدث خطأ أثناء تحديث الربط');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">إدارة المزارع التابعة</h3>
            <p className="text-sm text-green-100 mt-1">{admin.full_name} ({admin.email})</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">جاري التحميل...</p>
            </div>
          ) : farms.length === 0 ? (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-8 text-center">
              <MapPin className="w-12 h-12 text-amber-600 mx-auto mb-3" />
              <p className="text-gray-600">لا توجد مزارع مكتملة للربط</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                اختر المزارع التي يمكن لهذا المستخدم إدارتها. سيتمكن من رؤية هذه المزارع فقط في قسم "محصولي".
              </p>

              {farms.map((farm) => {
                const assigned = isAssigned(farm.id);
                return (
                  <button
                    key={farm.id}
                    onClick={() => toggleAssignment(farm.id)}
                    disabled={saving}
                    className={`w-full p-5 rounded-xl border-2 transition-all text-right ${
                      assigned
                        ? 'bg-green-50 border-green-400 hover:border-green-500'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-gray-900 text-lg">{farm.name_ar}</h4>
                          {assigned && (
                            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-medium">
                              مرتبطة
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{farm.name_en}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>{farm.location}</span>
                        </div>
                      </div>
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                        assigned ? 'bg-green-600' : 'bg-gray-200'
                      }`}>
                        {assigned ? (
                          <CheckCircle className="w-6 h-6 text-white" />
                        ) : (
                          <XCircle className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {assignments.filter(a => a.is_active).length} مزرعة مرتبطة
            </span>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              تم
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
