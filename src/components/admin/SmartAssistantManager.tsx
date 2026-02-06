import { useState, useEffect } from 'react';
import {
  Sparkles,
  MessageCircle,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  TestTube,
  BarChart3,
  AlertCircle,
  Save,
  Copy,
  Download,
  Upload,
  Filter,
  RefreshCw,
  Play,
  Zap,
  TrendingUp,
  Users,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FAQ {
  id: string;
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
  question_variations: string[];
  intent_tags: string[];
  is_active: boolean;
  is_approved: boolean;
  usage_count: number;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

interface TestResult {
  question: string;
  matched: boolean;
  matchedFAQ?: FAQ;
  score: number;
  reason: string;
}

interface Stats {
  totalFAQs: number;
  activeFAQs: number;
  totalUsage: number;
  totalVariations: number;
  avgVariationsPerFAQ: number;
}

export default function SmartAssistantManager() {
  const [activeTab, setActiveTab] = useState<'faqs' | 'test' | 'stats' | 'unanswered'>('faqs');
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [filteredFAQs, setFilteredFAQs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [filterApproved, setFilterApproved] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    loadFAQs();
  }, []);

  useEffect(() => {
    filterFAQs();
  }, [searchTerm, filterActive, filterApproved, faqs]);

  const loadFAQs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assistant_faqs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setFAQs(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Error loading FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (faqs: FAQ[]) => {
    const totalFAQs = faqs.length;
    const activeFAQs = faqs.filter(f => f.is_active).length;
    const totalUsage = faqs.reduce((sum, f) => sum + (f.usage_count || 0), 0);
    const totalVariations = faqs.reduce((sum, f) => sum + (f.question_variations?.length || 0), 0);
    const avgVariationsPerFAQ = totalFAQs > 0 ? totalVariations / totalFAQs : 0;

    setStats({
      totalFAQs,
      activeFAQs,
      totalUsage,
      totalVariations,
      avgVariationsPerFAQ: Math.round(avgVariationsPerFAQ * 10) / 10
    });
  };

  const filterFAQs = () => {
    let filtered = [...faqs];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(faq =>
        faq.question_ar.toLowerCase().includes(search) ||
        faq.answer_ar.toLowerCase().includes(search) ||
        faq.question_variations?.some(v => v.toLowerCase().includes(search)) ||
        faq.intent_tags?.some(t => t.toLowerCase().includes(search))
      );
    }

    if (filterActive !== null) {
      filtered = filtered.filter(faq => faq.is_active === filterActive);
    }

    if (filterApproved !== null) {
      filtered = filtered.filter(faq => faq.is_approved === filterApproved);
    }

    setFilteredFAQs(filtered);
  };

  const toggleStatus = async (id: string, field: 'is_active' | 'is_approved', currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('assistant_faqs')
        .update({ [field]: !currentValue })
        .eq('id', id);

      if (error) throw error;
      loadFAQs();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteFAQ = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;

    try {
      const { error } = await supabase
        .from('assistant_faqs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadFAQs();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
    }
  };

  const duplicateFAQ = async (faq: FAQ) => {
    try {
      const newFAQ = {
        question_ar: `${faq.question_ar} (نسخة)`,
        question_en: `${faq.question_en} (copy)`,
        answer_ar: faq.answer_ar,
        answer_en: faq.answer_en,
        question_variations: faq.question_variations || [],
        intent_tags: faq.intent_tags || [],
        is_active: false,
        is_approved: false
      };

      const { error } = await supabase
        .from('assistant_faqs')
        .insert([newFAQ]);

      if (error) throw error;
      loadFAQs();
    } catch (error) {
      console.error('Error duplicating FAQ:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">
                    إدارة المساعد الذكي المتطور
                  </h1>
                  <p className="text-blue-100">
                    نظام متطور لإدارة الأسئلة والأجوبة مع اختبار مباشر وتحليلات ذكية
                  </p>
                </div>
              </div>
              <button
                onClick={loadFAQs}
                className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                تحديث
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          {stats && (
            <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 p-6">
              <div className="grid grid-cols-5 gap-6">
                <StatCard
                  icon={<MessageCircle className="w-6 h-6 text-blue-600" />}
                  label="إجمالي الأسئلة"
                  value={stats.totalFAQs}
                  color="blue"
                />
                <StatCard
                  icon={<Check className="w-6 h-6 text-green-600" />}
                  label="نشط"
                  value={stats.activeFAQs}
                  color="green"
                />
                <StatCard
                  icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
                  label="مرات الاستخدام"
                  value={stats.totalUsage}
                  color="purple"
                />
                <StatCard
                  icon={<Zap className="w-6 h-6 text-amber-600" />}
                  label="الصيغ البديلة"
                  value={stats.totalVariations}
                  color="amber"
                />
                <StatCard
                  icon={<BarChart3 className="w-6 h-6 text-emerald-600" />}
                  label="معدل الصيغ/سؤال"
                  value={stats.avgVariationsPerFAQ}
                  color="emerald"
                />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-white">
            <div className="flex gap-2 p-4">
              <TabButton
                active={activeTab === 'faqs'}
                onClick={() => setActiveTab('faqs')}
                icon={<MessageCircle className="w-5 h-5" />}
                label="الأسئلة والأجوبة"
                count={filteredFAQs.length}
              />
              <TabButton
                active={activeTab === 'test'}
                onClick={() => setActiveTab('test')}
                icon={<TestTube className="w-5 h-5" />}
                label="اختبار مباشر"
              />
              <TabButton
                active={activeTab === 'stats'}
                onClick={() => setActiveTab('stats')}
                icon={<BarChart3 className="w-5 h-5" />}
                label="الإحصائيات"
              />
              <TabButton
                active={activeTab === 'unanswered'}
                onClick={() => setActiveTab('unanswered')}
                icon={<AlertCircle className="w-5 h-5" />}
                label="أسئلة غير مجابة"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">جاري التحميل...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'faqs' && (
                <FAQsManagementTab
                  faqs={filteredFAQs}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  filterActive={filterActive}
                  setFilterActive={setFilterActive}
                  filterApproved={filterApproved}
                  setFilterApproved={setFilterApproved}
                  onToggleStatus={toggleStatus}
                  onDelete={deleteFAQ}
                  onDuplicate={duplicateFAQ}
                  onRefresh={loadFAQs}
                />
              )}
              {activeTab === 'test' && <TestEngineTab faqs={faqs} />}
              {activeTab === 'stats' && <StatisticsTab faqs={faqs} />}
              {activeTab === 'unanswered' && <UnansweredQuestionsTab onRefresh={loadFAQs} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    green: 'from-green-50 to-green-100 border-green-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    amber: 'from-amber-50 to-amber-100 border-amber-200',
    emerald: 'from-emerald-50 to-emerald-100 border-emerald-200'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border rounded-xl p-4`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
        active
          ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-bold ${
            active ? 'bg-white/30' : 'bg-gray-200'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function FAQsManagementTab({
  faqs,
  searchTerm,
  setSearchTerm,
  filterActive,
  setFilterActive,
  filterApproved,
  setFilterApproved,
  onToggleStatus,
  onDelete,
  onDuplicate,
  onRefresh
}: {
  faqs: FAQ[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterActive: boolean | null;
  setFilterActive: (active: boolean | null) => void;
  filterApproved: boolean | null;
  setFilterApproved: (approved: boolean | null) => void;
  onToggleStatus: (id: string, field: 'is_active' | 'is_approved', currentValue: boolean) => void;
  onDelete: (id: string) => void;
  onDuplicate: (faq: FAQ) => void;
  onRefresh: () => void;
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث في الأسئلة والأجوبة..."
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterActive(filterActive === true ? null : true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActive === true
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              نشط
            </button>
            <button
              onClick={() => setFilterActive(filterActive === false ? null : false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActive === false
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              غير نشط
            </button>
            <button
              onClick={() => setFilterApproved(filterApproved === true ? null : true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterApproved === true
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              معتمد
            </button>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={() => {
            setEditingFAQ(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white rounded-xl transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          إضافة سؤال جديد
        </button>
      </div>

      {/* FAQs List */}
      {faqs.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">لا توجد أسئلة</p>
          <p className="text-sm text-gray-500 mt-2">
            {searchTerm || filterActive !== null || filterApproved !== null
              ? 'جرب تغيير الفلاتر أو البحث'
              : 'ابدأ بإضافة سؤال جديد'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {faqs.map((faq) => (
            <FAQCard
              key={faq.id}
              faq={faq}
              onToggleStatus={onToggleStatus}
              onEdit={() => {
                setEditingFAQ(faq);
                setShowAddModal(true);
              }}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <FAQModal
          faq={editingFAQ}
          onClose={() => {
            setShowAddModal(false);
            setEditingFAQ(null);
          }}
          onSave={() => {
            setShowAddModal(false);
            setEditingFAQ(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

function FAQCard({
  faq,
  onToggleStatus,
  onEdit,
  onDelete,
  onDuplicate
}: {
  faq: FAQ;
  onToggleStatus: (id: string, field: 'is_active' | 'is_approved', currentValue: boolean) => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (faq: FAQ) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Status Badges */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                faq.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {faq.is_active ? 'نشط' : 'غير نشط'}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                faq.is_approved
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {faq.is_approved ? 'معتمد' : 'قيد المراجعة'}
            </span>
            {faq.usage_count > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                استخدم {faq.usage_count} مرة
              </span>
            )}
          </div>

          {/* Question */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">{faq.question_ar}</h3>

          {/* Variations */}
          {faq.question_variations && faq.question_variations.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">الصيغ البديلة:</span>
                {faq.question_variations.slice(0, 3).map((variation, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                  >
                    {variation}
                  </span>
                ))}
                {faq.question_variations.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{faq.question_variations.length - 3} أخرى
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Answer Preview */}
          <div className="mt-3">
            <p className="text-gray-600 text-sm leading-relaxed">
              {expanded
                ? faq.answer_ar
                : `${faq.answer_ar.substring(0, 200)}${faq.answer_ar.length > 200 ? '...' : ''}`}
            </p>
            {faq.answer_ar.length > 200 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
              >
                {expanded ? 'عرض أقل' : 'عرض المزيد'}
              </button>
            )}
          </div>

          {/* Tags */}
          {faq.intent_tags && faq.intent_tags.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {faq.intent_tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onToggleStatus(faq.id, 'is_active', faq.is_active)}
            className={`p-2 rounded-lg transition-colors ${
              faq.is_active
                ? 'bg-green-100 hover:bg-green-200 text-green-700'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
            title={faq.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
          >
            {faq.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button
            onClick={() => onToggleStatus(faq.id, 'is_approved', faq.is_approved)}
            className={`p-2 rounded-lg transition-colors ${
              faq.is_approved
                ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
            }`}
            title={faq.is_approved ? 'إلغاء الاعتماد' : 'اعتماد'}
          >
            <Check className="w-5 h-5" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            title="تعديل"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDuplicate(faq)}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            title="نسخ"
          >
            <Copy className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(faq.id)}
            className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
            title="حذف"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FAQModal({
  faq,
  onClose,
  onSave
}: {
  faq: FAQ | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    question_ar: faq?.question_ar || '',
    question_en: faq?.question_en || '',
    answer_ar: faq?.answer_ar || '',
    answer_en: faq?.answer_en || '',
    question_variations: faq?.question_variations || [],
    intent_tags: faq?.intent_tags || [],
    is_active: faq?.is_active ?? true,
    is_approved: faq?.is_approved ?? false
  });

  const [newVariation, setNewVariation] = useState('');
  const [newTag, setNewTag] = useState('');

  const handleSave = async () => {
    if (!formData.question_ar || !formData.answer_ar) {
      alert('يرجى إدخال السؤال والجواب بالعربية');
      return;
    }

    try {
      if (faq) {
        const { error } = await supabase
          .from('assistant_faqs')
          .update(formData)
          .eq('id', faq.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('assistant_faqs')
          .insert([formData]);
        if (error) throw error;
      }
      onSave();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const addVariation = () => {
    if (newVariation.trim()) {
      setFormData({
        ...formData,
        question_variations: [...formData.question_variations, newVariation.trim()]
      });
      setNewVariation('');
    }
  };

  const removeVariation = (index: number) => {
    setFormData({
      ...formData,
      question_variations: formData.question_variations.filter((_, i) => i !== index)
    });
  };

  const addTag = () => {
    if (newTag.trim()) {
      setFormData({
        ...formData,
        intent_tags: [...formData.intent_tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData({
      ...formData,
      intent_tags: formData.intent_tags.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-emerald-500 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">
              {faq ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Question */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                السؤال بالعربية <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.question_ar}
                onChange={(e) => setFormData({ ...formData, question_ar: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="مثل: ما هو الاستثمار الزراعي؟"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Question in English
              </label>
              <input
                type="text"
                value={formData.question_en}
                onChange={(e) => setFormData({ ...formData, question_en: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g: What is agricultural investment?"
              />
            </div>
          </div>

          {/* Variations */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              الصيغ البديلة للسؤال
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newVariation}
                onChange={(e) => setNewVariation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addVariation()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أضف صيغة بديلة واضغط Enter"
              />
              <button
                onClick={addVariation}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.question_variations.map((variation, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg"
                >
                  <span className="text-sm">{variation}</span>
                  <button
                    onClick={() => removeVariation(idx)}
                    className="hover:bg-blue-200 rounded p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Answers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                الجواب بالعربية <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.answer_ar}
                onChange={(e) => setFormData({ ...formData, answer_ar: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="الجواب التفصيلي..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Answer in English
              </label>
              <textarea
                value={formData.answer_en}
                onChange={(e) => setFormData({ ...formData, answer_en: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Detailed answer..."
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              الكلمات المفتاحية (Tags)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أضف كلمة مفتاحية واضغط Enter"
              />
              <button
                onClick={addTag}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.intent_tags.map((tag, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg"
                >
                  <span className="text-sm">#{tag}</span>
                  <button
                    onClick={() => removeTag(idx)}
                    className="hover:bg-gray-200 rounded p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">نشط</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_approved}
                onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">معتمد</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white rounded-xl transition-all shadow-lg font-medium"
          >
            <Save className="w-5 h-5" />
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}

function TestEngineTab({ faqs }: { faqs: FAQ[] }) {
  const [testQuestion, setTestQuestion] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const testAssistant = async () => {
    if (!testQuestion.trim()) return;

    setTesting(true);
    try {
      const { data, error } = await supabase.rpc('search_faqs', {
        search_query: testQuestion
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const match = data[0];
        setTestResult({
          question: testQuestion,
          matched: true,
          matchedFAQ: match,
          score: match.score || 0,
          reason: 'تم العثور على تطابق'
        });
      } else {
        setTestResult({
          question: testQuestion,
          matched: false,
          score: 0,
          reason: 'لم يتم العثور على إجابة مطابقة'
        });
      }
    } catch (error) {
      console.error('Test error:', error);
      setTestResult({
        question: testQuestion,
        matched: false,
        score: 0,
        reason: 'حدث خطأ أثناء الاختبار'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border-2 border-blue-200 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
            <TestTube className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">محرك الاختبار المباشر</h3>
            <p className="text-sm text-gray-600">اختبر المساعد الذكي بأي سؤال</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={testQuestion}
              onChange={(e) => setTestQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && testAssistant()}
              placeholder="اكتب سؤالاً لاختبار المساعد..."
              className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
            <button
              onClick={testAssistant}
              disabled={testing || !testQuestion.trim()}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white rounded-xl transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  جاري الاختبار...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  اختبار
                </>
              )}
            </button>
          </div>

          {testResult && (
            <div
              className={`p-6 rounded-xl border-2 ${
                testResult.matched
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                {testResult.matched ? (
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <X className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-gray-900">
                    {testResult.matched ? 'تم العثور على إجابة!' : 'لم يتم العثور على إجابة'}
                  </h4>
                  <p className="text-sm text-gray-600">{testResult.reason}</p>
                </div>
              </div>

              {testResult.matched && testResult.matchedFAQ && (
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">السؤال المطابق:</p>
                    <p className="font-bold text-gray-900">{testResult.matchedFAQ.question_ar}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">الإجابة:</p>
                    <p className="text-gray-700">{testResult.matchedFAQ.answer_ar}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">درجة التطابق:</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                      {Math.round(testResult.score * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h4 className="font-bold text-gray-900 mb-4">أمثلة اختبارية</h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            'ما الاستثمار',
            'كم الربح',
            'هل آمن',
            'المدة',
            'الصيانة',
            'الزيارة'
          ].map((example) => (
            <button
              key={example}
              onClick={() => {
                setTestQuestion(example);
                setTestResult(null);
              }}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-right font-medium"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatisticsTab({ faqs }: { faqs: FAQ[] }) {
  const mostUsed = [...faqs].sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0)).slice(0, 5);
  const mostHelpful = [...faqs].sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            الأسئلة الأكثر استخداماً
          </h4>
          <div className="space-y-3">
            {mostUsed.map((faq, idx) => (
              <div key={faq.id} className="flex items-start gap-3">
                <span className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{faq.question_ar}</p>
                  <p className="text-xs text-gray-500 mt-1">{faq.usage_count} مرة</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            الأسئلة الأكثر فائدة
          </h4>
          <div className="space-y-3">
            {mostHelpful.map((faq, idx) => (
              <div key={faq.id} className="flex items-start gap-3">
                <span className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{faq.question_ar}</p>
                  <p className="text-xs text-gray-500 mt-1">{faq.helpful_count} شخص وجدها مفيدة</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UnansweredQuestionsTab({ onRefresh }: { onRefresh: () => void }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnansweredQuestions();
  }, []);

  const loadUnansweredQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('unanswered_questions')
        .select('*')
        .eq('status', 'new')
        .order('frequency', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (data) setQuestions(data);
    } catch (error) {
      console.error('Error loading unanswered questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsReviewed = async (id: string) => {
    try {
      const { error } = await supabase
        .from('unanswered_questions')
        .update({ status: 'reviewed' })
        .eq('id', id);

      if (error) throw error;
      loadUnansweredQuestions();
    } catch (error) {
      console.error('Error marking as reviewed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">لا توجد أسئلة غير مجابة</p>
          <p className="text-sm text-gray-500 mt-2">جميع الأسئلة تمت الإجابة عليها</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className="bg-white border-2 border-orange-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                      جديد
                    </span>
                    {q.frequency > 1 && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                        تكرر {q.frequency} مرة
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-gray-900 text-lg">{q.question}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(q.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <button
                  onClick={() => markAsReviewed(q.id)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  تمت المراجعة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
