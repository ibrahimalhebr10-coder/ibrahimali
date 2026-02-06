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
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Domain {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
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
  const [showAddModal, setShowAddModal] = useState(false);

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

  const toggleDomainStatus = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('knowledge_domains')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    loadDomains();
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
                  <DomainsTab
                    domains={domains}
                    onToggleStatus={toggleDomainStatus}
                    onRefresh={loadDomains}
                  />
                )}

                {activeTab === 'topics' && (
                  <TopicsTab topics={topics} onRefresh={loadTopics} />
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

function DomainsTab({
  domains,
  onToggleStatus,
  onRefresh
}: {
  domains: Domain[];
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">المجالات المعرفية</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors">
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
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleStatus(domain.id, domain.is_active)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    domain.is_active
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {domain.is_active ? 'نشط' : 'غير نشط'}
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopicsTab({ topics, onRefresh }: { topics: Topic[]; onRefresh: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">المواضيع</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors">
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
                <h3 className="font-bold text-gray-900">{topic.title_ar}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {topic.views_count} مشاهدة
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    {topic.helpful_count} مفيد
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {topic.target_audience}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-lg text-sm ${
                    topic.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {topic.is_active ? 'نشط' : 'غير نشط'}
                </span>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
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
                  <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors">
                    إنشاء FAQ
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
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">الإحصائيات والتحليلات</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">المحادثات</p>
              <p className="text-2xl font-bold text-blue-900">1,234</p>
            </div>
          </div>
          <p className="text-xs text-blue-700">+12% عن الأسبوع الماضي</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">معدل الرضا</p>
              <p className="text-2xl font-bold text-green-900">94%</p>
            </div>
          </div>
          <p className="text-xs text-green-700">+5% عن الأسبوع الماضي</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600 font-medium">دقة الإجابات</p>
              <p className="text-2xl font-bold text-purple-900">87%</p>
            </div>
          </div>
          <p className="text-xs text-purple-700">+8% عن الأسبوع الماضي</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-4">الأداء خلال الأيام السبعة الماضية</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">سيتم إضافة الرسوم البيانية قريباً</p>
        </div>
      </div>
    </div>
  );
}
