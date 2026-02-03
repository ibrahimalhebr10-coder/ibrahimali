import { useState, useEffect } from 'react';
import { Rocket, Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ExpansionOpportunity {
  id: string;
  investor_id: string;
  opportunity_type: 'add_trees' | 'new_farm' | 'upgrade_contract';
  title: string;
  description: string;
  related_farm_id: string | null;
  trees_count: number | null;
  estimated_value: number | null;
  cta_button_text: string;
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

const opportunityTypeOptions = [
  { value: 'add_trees', label: 'زيادة أشجار' },
  { value: 'new_farm', label: 'مزرعة جديدة' },
  { value: 'upgrade_contract', label: 'ترقية عقد' }
];

export default function ExpansionOpportunitiesManager() {
  const [opportunities, setOpportunities] = useState<ExpansionOpportunity[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    investor_id: '',
    opportunity_type: 'add_trees' as 'add_trees' | 'new_farm' | 'upgrade_contract',
    title: '',
    description: '',
    related_farm_id: '',
    trees_count: 0,
    estimated_value: 0,
    cta_button_text: 'استكشف الفرصة'
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [oppsRes, investorsRes, farmsRes] = await Promise.all([
        supabase
          .from('expansion_opportunities')
          .select(`
            *,
            user_profiles!investor_id (email),
            farms!related_farm_id (name)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('user_profiles').select('id, email').order('email'),
        supabase.from('farms').select('id, name').order('name')
      ]);

      if (oppsRes.error) throw oppsRes.error;
      if (investorsRes.error) throw investorsRes.error;
      if (farmsRes.error) throw farmsRes.error;

      const oppsWithDetails = (oppsRes.data || []).map(item => ({
        ...item,
        investor_email: item.user_profiles?.email,
        farm_name: item.farms?.name
      }));

      setOpportunities(oppsWithDetails);
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
      const dataToInsert = {
        ...formData,
        related_farm_id: formData.related_farm_id || null,
        trees_count: formData.trees_count || null,
        estimated_value: formData.estimated_value || null
      };

      const { error } = await supabase
        .from('expansion_opportunities')
        .insert([dataToInsert]);

      if (error) throw error;

      await loadData();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error adding opportunity:', error);
      alert('حدث خطأ في الإضافة');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;

    try {
      const { error } = await supabase
        .from('expansion_opportunities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      alert('حدث خطأ في الحذف');
    }
  }

  function resetForm() {
    setFormData({
      investor_id: '',
      opportunity_type: 'add_trees',
      title: '',
      description: '',
      related_farm_id: '',
      trees_count: 0,
      estimated_value: 0,
      cta_button_text: 'استكشف الفرصة'
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
        <h3 className="text-xl font-bold text-gray-900">إدارة فرص التوسعة</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-darkgreen text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة فرصة توسعة
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
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع الفرصة</label>
              <select
                value={formData.opportunity_type}
                onChange={(e) => setFormData({ ...formData, opportunity_type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                required
              >
                {opportunityTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">عنوان الفرصة</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المزرعة المرتبطة (اختياري)</label>
              <select
                value={formData.related_farm_id}
                onChange={(e) => setFormData({ ...formData, related_farm_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
              >
                <option value="">لا يوجد</option>
                {farms.map(farm => (
                  <option key={farm.id} value={farm.id}>{farm.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">عدد الأشجار (اختياري)</label>
              <input
                type="number"
                min="0"
                value={formData.trees_count}
                onChange={(e) => setFormData({ ...formData, trees_count: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">القيمة التقديرية (ريال)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.estimated_value}
                onChange={(e) => setFormData({ ...formData, estimated_value: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نص الزر</label>
              <input
                type="text"
                value={formData.cta_button_text}
                onChange={(e) => setFormData({ ...formData, cta_button_text: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
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
        {opportunities.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Rocket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">لا توجد فرص توسعة مسجلة</p>
          </div>
        ) : (
          opportunities.map(item => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-bold text-gray-900">{item.title}</h4>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {opportunityTypeOptions.find(o => o.value === item.opportunity_type)?.label}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {item.investor_email}
                    {item.farm_name && ` • ${item.farm_name}`}
                  </div>
                  <p className="text-gray-700 mb-3">{item.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {item.trees_count && (
                      <div>
                        <div className="text-xs text-gray-500">عدد الأشجار</div>
                        <div className="text-lg font-bold text-gray-900">{item.trees_count}</div>
                      </div>
                    )}
                    {item.estimated_value && (
                      <div>
                        <div className="text-xs text-gray-500">القيمة التقديرية</div>
                        <div className="text-lg font-bold text-gray-900">{item.estimated_value} ريال</div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-gray-500">نص الزر</div>
                      <div className="text-sm text-gray-900">{item.cta_button_text}</div>
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
