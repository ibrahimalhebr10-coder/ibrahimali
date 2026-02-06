import { useState, useEffect } from 'react';
import {
  Sparkles,
  Brain,
  MessageCircle,
  FileText,
  HelpCircle,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Eye,
  BarChart3,
  Lightbulb,
  AlertCircle,
  Save
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Domain {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  icon: string | null;
  color: string;
  display_order: number;
  is_active: boolean;
}

interface Topic {
  id: string;
  domain_id: string;
  title_ar: string;
  title_en: string;
  summary_ar: string | null;
  content_ar: string | null;
  target_audience: string;
  is_active: boolean;
  views_count: number;
  helpful_count: number;
}

interface FAQ {
  id: string;
  question_ar: string;
  answer_ar: string;
  target_audience: string;
  is_active: boolean;
  is_approved: boolean;
  usage_count: number;
  helpful_count: number;
}

interface UnansweredQuestion {
  id: string;
  question: string;
  frequency: number;
  status: string;
  created_at: string;
}

interface LearningSuggestion {
  id: string;
  suggestion_type: string;
  subject_ar: string;
  description: string;
  frequency: number;
  status: string;
  priority: string;
  created_at: string;
}

export default function AdvancedAssistantManager() {
  const [activeTab, setActiveTab] = useState<'domains' | 'topics' | 'faqs' | 'unanswered' | 'suggestions' | 'analytics'>('domains');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [unansweredQuestions, setUnansweredQuestions] = useState<UnansweredQuestion[]>([]);
  const [suggestions, setSuggestions] = useState<LearningSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'domains':
          await loadDomains();
          break;
        case 'topics':
          await loadTopics();
          break;
        case 'faqs':
          await loadFAQs();
          break;
        case 'unanswered':
          await loadUnansweredQuestions();
          break;
        case 'suggestions':
          await loadSuggestions();
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDomains = async () => {
    const { data } = await supabase
      .from('knowledge_domains')
      .select('*')
      .order('display_order');
    if (data) setDomains(data);
  };

  const loadTopics = async () => {
    const { data } = await supabase
      .from('knowledge_topics')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTopics(data);
  };

  const loadFAQs = async () => {
    const { data } = await supabase
      .from('assistant_faqs')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setFAQs(data);
  };

  const loadUnansweredQuestions = async () => {
    const { data } = await supabase
      .from('unanswered_questions')
      .select('*')
      .eq('status', 'new')
      .order('frequency', { ascending: false })
      .limit(50);
    if (data) setUnansweredQuestions(data);
  };

  const loadSuggestions = async () => {
    const { data } = await supabase
      .from('learning_suggestions')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('frequency', { ascending: false });
    if (data) setSuggestions(data);
  };

  const approveFAQ = async (id: string) => {
    await supabase
      .from('assistant_faqs')
      .update({ is_approved: true, approved_at: new Date().toISOString() })
      .eq('id', id);
    loadFAQs();
  };

  const markQuestionAsReviewed = async (id: string) => {
    await supabase
      .from('unanswered_questions')
      .update({ status: 'reviewed', reviewed_at: new Date().toISOString() })
      .eq('id', id);
    loadUnansweredQuestions();
  };

  const approveSuggestion = async (id: string) => {
    await supabase
      .from('learning_suggestions')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);
    loadSuggestions();
  };

  const rejectSuggestion = async (id: string) => {
    await supabase
      .from('learning_suggestions')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);
    loadSuggestions();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  المساعد الذكي المتقدم
                </h1>
                <p className="text-emerald-100 text-sm">
                  إدارة منظومة المساعد الذكي والمعرفة
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 bg-white">
            <div className="flex gap-2 p-4 overflow-x-auto">
              <TabButton
                active={activeTab === 'domains'}
                onClick={() => setActiveTab('domains')}
                icon={<Brain className="w-4 h-4" />}
                label="المجالات المعرفية"
                count={domains.length}
              />
              <TabButton
                active={activeTab === 'topics'}
                onClick={() => setActiveTab('topics')}
                icon={<FileText className="w-4 h-4" />}
                label="المواضيع"
                count={topics.length}
              />
              <TabButton
                active={activeTab === 'faqs'}
                onClick={() => setActiveTab('faqs')}
                icon={<HelpCircle className="w-4 h-4" />}
                label="الأسئلة الشائعة"
                count={faqs.length}
              />
              <TabButton
                active={activeTab === 'unanswered'}
                onClick={() => setActiveTab('unanswered')}
                icon={<AlertCircle className="w-4 h-4" />}
                label="أسئلة غير مجابة"
                count={unansweredQuestions.length}
              />
              <TabButton
                active={activeTab === 'suggestions'}
                onClick={() => setActiveTab('suggestions')}
                icon={<Lightbulb className="w-4 h-4" />}
                label="اقتراحات التحسين"
                count={suggestions.length}
              />
              <TabButton
                active={activeTab === 'analytics'}
                onClick={() => setActiveTab('analytics')}
                icon={<BarChart3 className="w-4 h-4" />}
                label="الإحصائيات"
              />
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <>
                {activeTab === 'domains' && (
                  <DomainsTab domains={domains} onRefresh={loadDomains} />
                )}

                {activeTab === 'topics' && (
                  <TopicsTab topics={topics} domains={domains} onRefresh={loadTopics} />
                )}

                {activeTab === 'faqs' && (
                  <FAQsTab faqs={faqs} onApprove={approveFAQ} onRefresh={loadFAQs} />
                )}

                {activeTab === 'unanswered' && (
                  <UnansweredTab
                    questions={unansweredQuestions}
                    onMarkReviewed={markQuestionAsReviewed}
                    onRefresh={loadUnansweredQuestions}
                  />
                )}

                {activeTab === 'suggestions' && (
                  <SuggestionsTab
                    suggestions={suggestions}
                    onApprove={approveSuggestion}
                    onReject={rejectSuggestion}
                    onRefresh={loadSuggestions}
                  />
                )}

                {activeTab === 'analytics' && <AnalyticsTab />}
              </>
            )}
          </div>
        </div>
      </div>
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
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
        active
          ? 'bg-emerald-500 text-white shadow-md'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            active ? 'bg-white/20' : 'bg-gray-200'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function DomainsTab({ domains, onRefresh }: { domains: Domain[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    icon: '',
    color: '#10b981',
    display_order: 0,
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      name_ar: '',
      name_en: '',
      description_ar: '',
      description_en: '',
      icon: '',
      color: '#10b981',
      display_order: 0,
      is_active: true
    });
    setEditingDomain(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (domain: Domain) => {
    setEditingDomain(domain);
    setFormData({
      name_ar: domain.name_ar,
      name_en: domain.name_en,
      description_ar: domain.description_ar || '',
      description_en: domain.description_en || '',
      icon: domain.icon || '',
      color: domain.color,
      display_order: domain.display_order,
      is_active: domain.is_active
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingDomain) {
        await supabase
          .from('knowledge_domains')
          .update(formData)
          .eq('id', editingDomain.id);
      } else {
        await supabase
          .from('knowledge_domains')
          .insert([formData]);
      }
      setShowModal(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving domain:', error);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المجال؟ سيتم حذف جميع المواضيع المرتبطة به.')) {
      return;
    }
    try {
      await supabase.from('knowledge_domains').delete().eq('id', id);
      onRefresh();
    } catch (error) {
      console.error('Error deleting domain:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('knowledge_domains')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">المجالات المعرفية</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة مجال جديد
        </button>
      </div>

      <div className="grid gap-4">
        {domains.map((domain) => (
          <div
            key={domain.id}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${domain.color}20` }}
                >
                  {domain.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{domain.name_ar}</h3>
                  <p className="text-sm text-gray-500">{domain.description_ar}</p>
                  <p className="text-xs text-gray-400 mt-1">{domain.name_en}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleStatus(domain.id, domain.is_active)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    domain.is_active
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {domain.is_active ? 'نشط' : 'غير نشط'}
                </button>
                <button
                  onClick={() => handleEdit(domain)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(domain.id)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingDomain ? 'تعديل المجال المعرفي' : 'إضافة مجال معرفي جديد'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم بالعربية
                </label>
                <input
                  type="text"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="مثل: الاستثمار الزراعي"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name in English
                </label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g: Agricultural Investment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف بالعربية
                </label>
                <textarea
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="وصف مختصر للمجال المعرفي"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description in English
                </label>
                <textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Short description of the domain"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الأيقونة (Emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-2xl text-center"
                    placeholder="🌾"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اللون
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ترتيب العرض
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  نشط
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TopicsTab({
  topics,
  domains,
  onRefresh
}: {
  topics: Topic[];
  domains: Domain[];
  onRefresh: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [formData, setFormData] = useState({
    domain_id: '',
    title_ar: '',
    title_en: '',
    summary_ar: '',
    content_ar: '',
    target_audience: 'all',
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      domain_id: '',
      title_ar: '',
      title_en: '',
      summary_ar: '',
      content_ar: '',
      target_audience: 'all',
      is_active: true
    });
    setEditingTopic(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setFormData({
      domain_id: topic.domain_id,
      title_ar: topic.title_ar,
      title_en: topic.title_en,
      summary_ar: topic.summary_ar || '',
      content_ar: topic.content_ar || '',
      target_audience: topic.target_audience,
      is_active: topic.is_active
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.domain_id) {
      alert('يرجى اختيار المجال المعرفي');
      return;
    }
    if (!formData.title_ar) {
      alert('يرجى إدخال العنوان بالعربية');
      return;
    }

    try {
      if (editingTopic) {
        await supabase
          .from('knowledge_topics')
          .update(formData)
          .eq('id', editingTopic.id);
      } else {
        await supabase
          .from('knowledge_topics')
          .insert([formData]);
      }
      setShowModal(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving topic:', error);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموضوع؟')) {
      return;
    }
    try {
      await supabase.from('knowledge_topics').delete().eq('id', id);
      onRefresh();
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('knowledge_topics')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    onRefresh();
  };

  const getDomainName = (domainId: string) => {
    const domain = domains.find((d) => d.id === domainId);
    return domain?.name_ar || 'غير محدد';
  };

  const getDomainIcon = (domainId: string) => {
    const domain = domains.find((d) => d.id === domainId);
    return domain?.icon || '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">المواضيع</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة موضوع جديد
        </button>
      </div>

      <div className="grid gap-3">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                    {getDomainIcon(topic.domain_id)} {getDomainName(topic.domain_id)}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {topic.target_audience === 'all' ? 'الجميع' : topic.target_audience}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      topic.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {topic.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900">{topic.title_ar}</h3>
                {topic.summary_ar && (
                  <p className="text-sm text-gray-500 mt-1">{topic.summary_ar}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {topic.views_count} مشاهدة
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    {topic.helpful_count} مفيد
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleStatus(topic.id, topic.is_active)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    topic.is_active
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {topic.is_active ? 'نشط' : 'غير نشط'}
                </button>
                <button
                  onClick={() => handleEdit(topic)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(topic.id)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingTopic ? 'تعديل الموضوع' : 'إضافة موضوع جديد'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المجال المعرفي
                </label>
                <select
                  value={formData.domain_id}
                  onChange={(e) => setFormData({ ...formData, domain_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">اختر المجال المعرفي</option>
                  {domains.filter(d => d.is_active).map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.icon} {domain.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان بالعربية
                </label>
                <input
                  type="text"
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="مثل: كيف تبدأ الاستثمار في المزارع"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title in English
                </label>
                <input
                  type="text"
                  value={formData.title_en}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g: How to Start Farm Investment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملخص الموضوع
                </label>
                <textarea
                  value={formData.summary_ar}
                  onChange={(e) => setFormData({ ...formData, summary_ar: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="ملخص قصير عن الموضوع"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المحتوى التفصيلي
                </label>
                <textarea
                  value={formData.content_ar}
                  onChange={(e) => setFormData({ ...formData, content_ar: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="المحتوى الكامل للموضوع"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الجمهور المستهدف
                </label>
                <select
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">الجميع</option>
                  <option value="visitor">الزوار</option>
                  <option value="investor">المستثمرون</option>
                  <option value="partner">شركاء النجاح</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="topic_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="topic_active" className="text-sm font-medium text-gray-700">
                  نشط
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FAQsTab({
  faqs,
  onApprove,
  onRefresh
}: {
  faqs: FAQ[];
  onApprove: (id: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">الأسئلة الشائعة</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          إضافة سؤال جديد
        </button>
      </div>

      <div className="grid gap-3">
        {faqs.map((faq) => (
          <div
            key={faq.id}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{faq.question_ar}</h3>
                  <p className="text-sm text-gray-600 mt-2">{faq.answer_ar}</p>
                </div>
                {!faq.is_approved && (
                  <button
                    onClick={() => onApprove(faq.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    اعتماد
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>استخدم {faq.usage_count} مرة</span>
                <span>{faq.helpful_count} مفيد</span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    faq.is_approved
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {faq.is_approved ? 'معتمد' : 'قيد المراجعة'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UnansweredTab({
  questions,
  onMarkReviewed,
  onRefresh
}: {
  questions: UnansweredQuestion[];
  onMarkReviewed: (id: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 mb-6">الأسئلة غير المجابة</h2>

      {questions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">لا توجد أسئلة غير مجابة</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {questions.map((q) => (
            <div
              key={q.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{q.question}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>تكرر {q.frequency} مرة</span>
                    <span>{new Date(q.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onMarkReviewed(q.id)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                  >
                    تمت المراجعة
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestionsTab({
  suggestions,
  onApprove,
  onReject,
  onRefresh
}: {
  suggestions: LearningSuggestion[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 mb-6">اقتراحات التحسين</h2>

      {suggestions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">لا توجد اقتراحات معلقة</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        {suggestion.suggestion_type}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          suggestion.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : suggestion.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {suggestion.priority === 'high'
                          ? 'عالي'
                          : suggestion.priority === 'medium'
                          ? 'متوسط'
                          : 'منخفض'}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900">{suggestion.subject_ar}</h3>
                    <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                    <p className="text-xs text-gray-500 mt-2">تكرر {suggestion.frequency} مرة</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onApprove(suggestion.id)}
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onReject(suggestion.id)}
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticsTab() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('intelligence_metrics')
        .select('*')
        .order('metric_date', { ascending: false })
        .limit(7);

      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateImprovement = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const todayMetrics = metrics[0] || {
    total_conversations: 0,
    satisfaction_rate: 0,
    avg_confidence_score: 0,
    answered_successfully: 0,
    unanswered_questions: 0,
    avg_response_time_ms: 0,
    helpfulness_rate: 0
  };

  const yesterdayMetrics = metrics[1] || todayMetrics;

  const conversationsChange = calculateImprovement(
    todayMetrics.total_conversations,
    yesterdayMetrics.total_conversations
  );

  const satisfactionChange = calculateImprovement(
    todayMetrics.satisfaction_rate,
    yesterdayMetrics.satisfaction_rate
  );

  const confidenceChange = calculateImprovement(
    todayMetrics.avg_confidence_score,
    yesterdayMetrics.avg_confidence_score
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">الإحصائيات والتحليلات</h2>
        <button
          onClick={loadMetrics}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm transition-colors"
        >
          تحديث
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">المحادثات اليوم</p>
              <p className="text-2xl font-bold text-blue-900">{todayMetrics.total_conversations}</p>
            </div>
          </div>
          <p className={`text-xs ${Number(conversationsChange) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {Number(conversationsChange) >= 0 ? '+' : ''}{conversationsChange}% عن الأمس
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">معدل الرضا</p>
              <p className="text-2xl font-bold text-green-900">{(todayMetrics.satisfaction_rate * 100).toFixed(0)}%</p>
            </div>
          </div>
          <p className={`text-xs ${Number(satisfactionChange) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {Number(satisfactionChange) >= 0 ? '+' : ''}{satisfactionChange}% عن الأمس
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600 font-medium">دقة الإجابات</p>
              <p className="text-2xl font-bold text-purple-900">{(todayMetrics.avg_confidence_score * 100).toFixed(0)}%</p>
            </div>
          </div>
          <p className={`text-xs ${Number(confidenceChange) >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
            {Number(confidenceChange) >= 0 ? '+' : ''}{confidenceChange}% عن الأمس
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-4">الأداء التفصيلي</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">إجابات ناجحة</span>
            <span className="font-bold text-gray-900">{todayMetrics.answered_successfully}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">أسئلة غير مجابة</span>
            <span className="font-bold text-red-600">{todayMetrics.unanswered_questions}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">متوسط وقت الاستجابة</span>
            <span className="font-bold text-gray-900">{todayMetrics.avg_response_time_ms}ms</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">معدل الفائدة</span>
            <span className="font-bold text-green-600">{(todayMetrics.helpfulness_rate * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
