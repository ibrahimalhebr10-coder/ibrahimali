import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, TrendingUp, Users, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { investmentCyclesService, InvestmentCycle, InvestmentCyclePaymentSummary } from '../../services/investmentCyclesService';
import InvestmentCycleWizard from './InvestmentCycleWizard';

export default function GoldenTreesInvestmentTab() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<string | undefined>();
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [paymentSummaries, setPaymentSummaries] = useState<Record<string, InvestmentCyclePaymentSummary>>({});

  useEffect(() => {
    loadCycles();
  }, []);

  const loadCycles = async () => {
    setLoading(true);
    try {
      const data = await investmentCyclesService.getAllCycles();
      setCycles(data || []);

      for (const cycle of data || []) {
        const summary = await investmentCyclesService.getPaymentSummary(cycle.id);
        setPaymentSummaries(prev => ({ ...prev, [cycle.id]: summary }));
      }
    } catch (error) {
      console.error('Error loading cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedCycleId(undefined);
    setShowWizard(true);
  };

  const handleEdit = (cycleId: string) => {
    setSelectedCycleId(cycleId);
    setShowWizard(true);
  };

  const handleDelete = async (cycleId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدورة؟')) return;

    try {
      await investmentCyclesService.deleteCycle(cycleId);
      loadCycles();
    } catch (error) {
      console.error('Error deleting cycle:', error);
      alert('فشل الحذف');
    }
  };

  const handleToggleStatus = async (cycle: any) => {
    try {
      if (cycle.status === 'published') {
        await investmentCyclesService.unpublishCycle(cycle.id);
      } else {
        const readiness = await investmentCyclesService.checkReadiness(cycle.id);
        if (!readiness.ready) {
          alert('يرجى استكمال جميع العناصر الأساسية قبل النشر');
          return;
        }
        await investmentCyclesService.publishCycle(cycle.id);
      }
      loadCycles();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('فشل تغيير الحالة');
    }
  };

  const getCycleTypeLabels = (types: string[]) => {
    const labels: Record<string, string> = {
      maintenance: 'صيانة أشجار',
      waste: 'مخلفات مزرعة',
      factory: 'مصنع'
    };
    return types.map(t => labels[t] || t).join(' + ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showWizard && (
        <InvestmentCycleWizard
          cycleId={selectedCycleId}
          onClose={() => setShowWizard(false)}
          onSuccess={() => {
            setShowWizard(false);
            loadCycles();
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">أشجاري الذهبية</h3>
          <p className="text-gray-600 mt-1">سجل واحد ذكي - رسوم موزعة - بدون تعقيد</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-xl hover:from-amber-600 hover:to-yellow-700 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة دورة استثمار</span>
        </button>
      </div>

      {cycles.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد دورات استثمارية</h3>
          <p className="text-gray-500 mb-6">ابدأ بإضافة أول دورة استثمار ذكية</p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة دورة</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {cycles.map(cycle => {
            const summary = paymentSummaries[cycle.id];
            const isExpanded = expandedCycle === cycle.id;

            return (
              <div
                key={cycle.id}
                className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-amber-300 transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xl font-bold text-gray-900">
                          {cycle.farms?.name_ar || 'مزرعة غير محددة'}
                        </h4>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            cycle.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {cycle.status === 'published' ? 'منشور' : 'مسودة'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{cycle.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(cycle.cycle_date).toLocaleDateString('ar-SA')}
                        </span>
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg font-medium">
                          {getCycleTypeLabels(cycle.cycle_types)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(cycle.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(cycle)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={cycle.status === 'published' ? 'إخفاء' : 'نشر'}
                      >
                        {cycle.status === 'published' ? (
                          <EyeOff className="w-5 h-5 text-gray-600" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(cycle.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">المبلغ الإجمالي</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {cycle.total_amount.toLocaleString('ar-SA')} ر.س
                      </p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-amber-700 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">تكلفة الشجرة</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-900">
                        {cycle.cost_per_tree.toFixed(2)} ر.س
                      </p>
                    </div>
                    {summary && (
                      <>
                        <div className="bg-green-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 text-green-700 mb-1">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">مسددين</span>
                          </div>
                          <p className="text-2xl font-bold text-green-900">
                            {summary.paid_investors}
                          </p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 text-orange-700 mb-1">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">غير مسددين</span>
                          </div>
                          <p className="text-2xl font-bold text-orange-900">
                            {summary.pending_investors}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {summary && (
                    <button
                      onClick={() => setExpandedCycle(isExpanded ? null : cycle.id)}
                      className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors"
                    >
                      {isExpanded ? 'إخفاء' : 'عرض'} ملخص المدفوعات
                    </button>
                  )}

                  {isExpanded && summary && (
                    <div className="mt-4 grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">إجمالي المستثمرين</p>
                        <p className="text-xl font-bold text-gray-900">{summary.total_investors}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">المبلغ المحصل</p>
                        <p className="text-xl font-bold text-green-600">
                          {summary.total_collected.toLocaleString('ar-SA')} ر.س
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">المبلغ المتبقي</p>
                        <p className="text-xl font-bold text-orange-600">
                          {summary.total_pending.toLocaleString('ar-SA')} ر.س
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">نسبة التحصيل</p>
                        <p className="text-xl font-bold text-blue-600">
                          {summary.total_investors > 0
                            ? Math.round((summary.paid_investors / summary.total_investors) * 100)
                            : 0}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {(cycle.images?.length > 0 || cycle.videos?.length > 0) && (
                  <div className="px-6 py-4 bg-gray-50 border-t">
                    <p className="text-sm text-gray-600 mb-2">التوثيق</p>
                    <div className="flex items-center gap-4 text-sm">
                      {cycle.images?.length > 0 && (
                        <span className="text-gray-700">
                          {cycle.images.length} صورة
                        </span>
                      )}
                      {cycle.videos?.length > 0 && (
                        <span className="text-gray-700">
                          {cycle.videos.length} فيديو
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
