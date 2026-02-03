import { useState, useEffect } from 'react';
import { Recycle, Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface WasteYield {
  id: string;
  investor_id: string;
  farm_id: string;
  waste_type: 'pruning' | 'leaves' | 'pressing_residue' | 'other';
  waste_name: string;
  quantity: number;
  unit: string;
  utilization_method: 'sale' | 'conversion' | 'composting';
  value_added: number;
  collection_date: string;
  psychological_message: string;
  investor_email?: string;
  farm_name?: string;
}

interface Investor {
  id: string;
  email: string;
}

interface Farm {
  id: string;
  name: string;
}

const wasteTypeOptions = [
  { value: 'pruning', label: 'مخلفات التقليم' },
  { value: 'leaves', label: 'أوراق الأشجار' },
  { value: 'pressing_residue', label: 'بقايا العصر' },
  { value: 'other', label: 'أخرى' }
];

const utilizationOptions = [
  { value: 'sale', label: 'بيع' },
  { value: 'conversion', label: 'تحويل' },
  { value: 'composting', label: 'تسميد' }
];

export default function WasteYieldsManager() {
  const [wastes, setWastes] = useState<WasteYield[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    investor_id: '',
    farm_id: '',
    waste_type: 'pruning' as 'pruning' | 'leaves' | 'pressing_residue' | 'other',
    waste_name: '',
    quantity: 0,
    unit: 'كجم',
    utilization_method: 'composting' as 'sale' | 'conversion' | 'composting',
    value_added: 0,
    collection_date: new Date().toISOString().split('T')[0],
    psychological_message: 'كل جزء من مزرعتك له قيمة'
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [wastesRes, investorsRes, farmsRes] = await Promise.all([
        supabase
          .from('waste_yields')
          .select(`
            *,
            user_profiles!investor_id (email),
            farms!farm_id (name)
          `)
          .order('collection_date', { ascending: false }),
        supabase.from('user_profiles').select('id, email').order('email'),
        supabase.from('farms').select('id, name').order('name')
      ]);

      if (wastesRes.error) throw wastesRes.error;
      if (investorsRes.error) throw investorsRes.error;
      if (farmsRes.error) throw farmsRes.error;

      const wastesWithDetails = (wastesRes.data || []).map(item => ({
        ...item,
        investor_email: item.user_profiles?.email,
        farm_name: item.farms?.name
      }));

      setWastes(wastesWithDetails);
      setInvestors(investorsRes.data || []);
      setFarms(farmsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('waste_yields')
        .insert([formData]);

      if (error) throw error;

      await loadData();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error adding waste:', error);
      alert('حدث خطأ في الإضافة');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;

    try {
      const { error } = await supabase
        .from('waste_yields')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting waste:', error);
      alert('حدث خطأ في الحذف');
    }
  }

  function resetForm() {
    setFormData({
      investor_id: '',
      farm_id: '',
      waste_type: 'pruning',
      waste_name: '',
      quantity: 0,
      unit: 'كجم',
      utilization_method: 'composting',
      value_added: 0,
      collection_date: new Date().toISOString().split('T')[0],
      psychological_message: 'كل جزء من مزرعتك له قيمة'
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-darkgreen animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">إدارة عوائد المخلفات</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-darkgreen text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة عائد مخلفات
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المستثمر</label>
              <select
                value={formData.investor_id}
                onChange={(e) => setFormData({ ...formData, investor_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                required
              >
                <option value="">اختر المستثمر</option>
                {investors.map(inv => (
                  <option key={inv.id} value={inv.id}>{inv.email}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المزرعة</label>
              <select
                value={formData.farm_id}
                onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                required
              >
                <option value="">اختر المزرعة</option>
                {farms.map(farm => (
                  <option key={farm.id} value={farm.id}>{farm.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع المخلفات</label>
              <select
                value={formData.waste_type}
                onChange={(e) => setFormData({ ...formData, waste_type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                required
              >
                {wasteTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم المخلفات</label>
              <input
                type="text"
                value={formData.waste_name}
                onChange={(e) => setFormData({ ...formData, waste_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الكمية</label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الوحدة</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الاستفادة</label>
              <select
                value={formData.utilization_method}
                onChange={(e) => setFormData({ ...formData, utilization_method: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                required
              >
                {utilizationOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">القيمة المضافة (ريال)</label>
              <input
                type="number"
                step="0.01"
                value={formData.value_added}
                onChange={(e) => setFormData({ ...formData, value_added: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الجمع</label>
              <input
                type="date"
                value={formData.collection_date}
                onChange={(e) => setFormData({ ...formData, collection_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">رسالة نفسية</label>
              <input
                type="text"
                value={formData.psychological_message}
                onChange={(e) => setFormData({ ...formData, psychological_message: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                placeholder="مثال: كل جزء من مزرعتك له قيمة"
                required
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2 bg-darkgreen text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              حفظ
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {wastes.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Recycle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">لا توجد عوائد مخلفات مسجلة</p>
          </div>
        ) : (
          wastes.map(item => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{item.waste_name}</h4>
                  <div className="text-sm text-gray-600 mb-3">
                    {item.investor_email} • {item.farm_name}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-gray-500">الكمية</div>
                      <div className="text-lg font-bold text-gray-900">{item.quantity} {item.unit}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">القيمة المضافة</div>
                      <div className="text-lg font-bold text-gray-900">{item.value_added} ريال</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">طريقة الاستفادة</div>
                      <div className="text-sm text-gray-900">
                        {utilizationOptions.find(o => o.value === item.utilization_method)?.label}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">تاريخ الجمع</div>
                      <div className="text-sm text-gray-900">
                        {new Date(item.collection_date).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800 font-medium">{item.psychological_message}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
