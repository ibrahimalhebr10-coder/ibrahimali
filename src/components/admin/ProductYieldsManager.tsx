import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProductYield {
  id: string;
  investor_id: string;
  farm_id: string;
  product_type: 'fruits' | 'oil' | 'secondary';
  product_name: string;
  quantity_produced: number;
  quantity_sold: number;
  unit: string;
  value_generated: number;
  season: string;
  notes: string;
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

const productTypeOptions = [
  { value: 'fruits', label: 'ثمار' },
  { value: 'oil', label: 'زيوت' },
  { value: 'secondary', label: 'منتجات ثانوية' }
];

export default function ProductYieldsManager() {
  const [yields, setYields] = useState<ProductYield[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    investor_id: '',
    farm_id: '',
    product_type: 'fruits' as 'fruits' | 'oil' | 'secondary',
    product_name: '',
    quantity_produced: 0,
    quantity_sold: 0,
    unit: 'كجم',
    value_generated: 0,
    season: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [yieldsRes, investorsRes, farmsRes] = await Promise.all([
        supabase
          .from('product_yields')
          .select(`
            *,
            user_profiles!investor_id (email),
            farms!farm_id (name)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('user_profiles').select('id, email').order('email'),
        supabase.from('farms').select('id, name').order('name')
      ]);

      if (yieldsRes.error) throw yieldsRes.error;
      if (investorsRes.error) throw investorsRes.error;
      if (farmsRes.error) throw farmsRes.error;

      const yieldsWithDetails = (yieldsRes.data || []).map(item => ({
        ...item,
        investor_email: item.user_profiles?.email,
        farm_name: item.farms?.name
      }));

      setYields(yieldsWithDetails);
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
        .from('product_yields')
        .insert([formData]);

      if (error) throw error;

      await loadData();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error adding yield:', error);
      alert('حدث خطأ في الإضافة');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;

    try {
      const { error } = await supabase
        .from('product_yields')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting yield:', error);
      alert('حدث خطأ في الحذف');
    }
  }

  function resetForm() {
    setFormData({
      investor_id: '',
      farm_id: '',
      product_type: 'fruits',
      product_name: '',
      quantity_produced: 0,
      quantity_sold: 0,
      unit: 'كجم',
      value_generated: 0,
      season: '',
      notes: ''
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
        <h3 className="text-xl font-bold text-gray-900">إدارة عوائد المنتجات</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-darkgreen text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة عائد جديد
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
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع المنتج</label>
              <select
                value={formData.product_type}
                onChange={(e) => setFormData({ ...formData, product_type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                required
              >
                {productTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم المنتج</label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الكمية المنتجة</label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity_produced}
                onChange={(e) => setFormData({ ...formData, quantity_produced: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الكمية المباعة</label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity_sold}
                onChange={(e) => setFormData({ ...formData, quantity_sold: parseFloat(e.target.value) })}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">القيمة المحققة (ريال)</label>
              <input
                type="number"
                step="0.01"
                value={formData.value_generated}
                onChange={(e) => setFormData({ ...formData, value_generated: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الموسم</label>
              <input
                type="text"
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                placeholder="مثال: شتاء 2026"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                rows={3}
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
        {yields.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">لا توجد عوائد مسجلة</p>
          </div>
        ) : (
          yields.map(item => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{item.product_name}</h4>
                  <div className="text-sm text-gray-600 mb-3">
                    {item.investor_email} • {item.farm_name}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">تم إنتاجه</div>
                      <div className="text-lg font-bold text-gray-900">{item.quantity_produced} {item.unit}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">تم بيعه</div>
                      <div className="text-lg font-bold text-gray-900">{item.quantity_sold} {item.unit}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">القيمة</div>
                      <div className="text-lg font-bold text-gray-900">{item.value_generated} ريال</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">الموسم</div>
                      <div className="text-sm text-gray-900">{item.season || '-'}</div>
                    </div>
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
