import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SmartReport {
  id: string;
  investor_id: string;
  report_type: 'quarterly' | 'annual';
  report_period: string;
  summary_what_happened: string;
  summary_what_done: string;
  summary_what_next: string;
  generated_at: string;
  investor_email?: string;
}

interface Investor {
  id: string;
  email: string;
}

const reportTypeOptions = [
  { value: 'quarterly', label: 'تقرير ربع سنوي' },
  { value: 'annual', label: 'تقرير سنوي' }
];

export default function SmartReportsManager() {
  const [reports, setReports] = useState<SmartReport[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    investor_id: '',
    report_type: 'quarterly' as 'quarterly' | 'annual',
    report_period: '',
    summary_what_happened: '',
    summary_what_done: '',
    summary_what_next: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [reportsRes, investorsRes] = await Promise.all([
        supabase
          .from('smart_reports')
          .select(`
            *,
            user_profiles!investor_id (email)
          `)
          .order('generated_at', { ascending: false }),
        supabase.from('user_profiles').select('id, email').order('email')
      ]);

      if (reportsRes.error) throw reportsRes.error;
      if (investorsRes.error) throw investorsRes.error;

      const reportsWithDetails = (reportsRes.data || []).map(item => ({
        ...item,
        investor_email: item.user_profiles?.email
      }));

      setReports(reportsWithDetails);
      setInvestors(investorsRes.data || []);
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
        .from('smart_reports')
        .insert([{
          ...formData,
          report_data: {}
        }]);

      if (error) throw error;

      await loadData();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error adding report:', error);
      alert('حدث خطأ في الإضافة');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;

    try {
      const { error } = await supabase
        .from('smart_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('حدث خطأ في الحذف');
    }
  }

  function resetForm() {
    setFormData({
      investor_id: '',
      report_type: 'quarterly',
      report_period: '',
      summary_what_happened: '',
      summary_what_done: '',
      summary_what_next: ''
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
        <h3 className="text-xl font-bold text-gray-900">إدارة التقارير الذكية</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-darkgreen text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة تقرير
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
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع التقرير</label>
              <select
                value={formData.report_type}
                onChange={(e) => setFormData({ ...formData, report_type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                required
              >
                {reportTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الفترة (مثال: Q1 2026 أو 2026)
              </label>
              <input
                type="text"
                value={formData.report_period}
                onChange={(e) => setFormData({ ...formData, report_period: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                placeholder="Q1 2026"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ماذا حدث
              </label>
              <textarea
                value={formData.summary_what_happened}
                onChange={(e) => setFormData({ ...formData, summary_what_happened: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                rows={3}
                placeholder="اكتب ملخص بلغة بشرية عما حدث في هذه الفترة..."
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ماذا تم
              </label>
              <textarea
                value={formData.summary_what_done}
                onChange={(e) => setFormData({ ...formData, summary_what_done: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                rows={3}
                placeholder="اكتب ملخص عن الإنجازات والأعمال المنفذة..."
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ماذا هو القادم
              </label>
              <textarea
                value={formData.summary_what_next}
                onChange={(e) => setFormData({ ...formData, summary_what_next: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen"
                rows={3}
                placeholder="اكتب ملخص عن الخطط والتوقعات القادمة..."
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
        {reports.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">لا توجد تقارير مسجلة</p>
          </div>
        ) : (
          reports.map(item => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      {reportTypeOptions.find(o => o.value === item.report_type)?.label}
                    </span>
                    <h4 className="text-lg font-bold text-gray-900">{item.report_period}</h4>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    {item.investor_email} • {new Date(item.generated_at).toLocaleDateString('ar-SA')}
                  </div>

                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-sm font-bold text-gray-900 mb-1">ماذا حدث</div>
                      <p className="text-sm text-gray-700">{item.summary_what_happened}</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm font-bold text-gray-900 mb-1">ماذا تم</div>
                      <p className="text-sm text-gray-700">{item.summary_what_done}</p>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <div className="text-sm font-bold text-gray-900 mb-1">ماذا هو القادم</div>
                      <p className="text-sm text-gray-700">{item.summary_what_next}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-4"
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
