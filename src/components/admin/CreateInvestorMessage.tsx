import React, { useState, useEffect } from 'react';
import { ArrowRight, Send, Image as ImageIcon, Users, CheckCircle, AlertCircle, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { investorMessagingService } from '../../services/investorMessagingService';

interface Farm {
  id: string;
  name_ar: string;
  name_en: string;
  location?: string;
  investors_count: number;
}

interface Props {
  farm: Farm;
  onBack: () => void;
  onMessageSent: () => void;
}

export default function CreateInvestorMessage({ farm, onBack, onMessageSent }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadFarmSummary();
  }, [farm.id]);

  async function loadFarmSummary() {
    try {
      setLoading(true);
      const summaryData = await investorMessagingService.getFarmSummary(farm.id);
      setSummary(summaryData);

      const defaultTitle = `تحديث من ${summaryData.farm_name}`;
      const defaultContent = generateDefaultContent(summaryData);

      setTitle(defaultTitle);
      setContent(defaultContent);
    } catch (error) {
      console.error('Error loading summary:', error);
      setError('فشل تحميل بيانات المزرعة');
    } finally {
      setLoading(false);
    }
  }

  function generateDefaultContent(summaryData: any): string {
    const parts: string[] = [];

    parts.push(`السلام عليكم ورحمة الله وبركاته،\n`);
    parts.push(`نود أن نطلعكم على آخر المستجدات في مزرعتكم "${summaryData.farm_name}":\n`);

    if (summaryData.total_tasks > 0) {
      parts.push(`\n📊 **ملخص الأعمال:**`);
      parts.push(`- إجمالي المهام: ${summaryData.total_tasks} مهمة`);
      parts.push(`- المهام المكتملة: ${summaryData.completed_tasks} مهمة (${summaryData.completion_rate}%)`);
      parts.push(`- المهام الجارية: ${summaryData.in_progress_tasks} مهمة`);
      parts.push(`- المهام المعلقة: ${summaryData.pending_tasks} مهمة`);
    }

    parts.push(`\n✅ **التقدم العام:**`);
    parts.push(`نحن ملتزمون بتقديم أفضل خدمة لمزرعتكم وضمان العناية الكاملة بأشجاركم.`);

    parts.push(`\n📸 **الصور:**`);
    parts.push(`تجدون أدناه صور حديثة من المزرعة توضح التقدم في الأعمال.\n`);

    parts.push(`شكراً لثقتكم،\nفريق إدارة المزارع`);

    return parts.join('\n');
  }

  async function handleSendMessage() {
    if (!title.trim() || !content.trim()) {
      setError('يرجى إدخال العنوان والمحتوى');
      return;
    }

    try {
      setSending(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!admin) throw new Error('Admin not found');

      await investorMessagingService.createMessage(
        {
          farm_id: farm.id,
          title: title.trim(),
          content: content.trim(),
          summary_data: summary
        },
        admin.id
      );

      setSuccess(true);
      setTimeout(() => {
        onMessageSent();
      }, 2000);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'فشل إرسال الرسالة');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات المزرعة...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            تم إرسال الرسالة بنجاح!
          </h2>
          <p className="text-gray-600 mb-2">
            تم إرسال التحديث إلى {farm.investors_count} مستثمر
          </p>
          <p className="text-sm text-gray-500">
            سيتلقون إشعاراً داخل المنصة
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
          <span>رجوع</span>
        </button>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{farm.investors_count} مستلم</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-green-600 text-white p-2 rounded-lg">
            <Send className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            إرسال تحديث للمستثمرين
          </h2>
        </div>
        <p className="text-gray-600 text-sm mr-11">
          مزرعة: {farm.name_ar}
          {farm.location && ` • ${farm.location}`}
        </p>
      </div>

      {summary && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            ملخص المزرعة التلقائي
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{summary.total_tasks}</p>
              <p className="text-sm text-gray-600">إجمالي المهام</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{summary.completed_tasks}</p>
              <p className="text-sm text-gray-600">مكتملة</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{summary.in_progress_tasks}</p>
              <p className="text-sm text-gray-600">جارية</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{summary.completion_rate}%</p>
              <p className="text-sm text-gray-600">نسبة الإنجاز</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            عنوان الرسالة
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: تحديث شهري - تقدم ممتاز في أعمال الزراعة"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            محتوى الرسالة
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder="اكتب رسالتك هنا..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
          />
          <p className="mt-2 text-xs text-gray-500">
            يمكنك تعديل النص المقترح أو كتابة رسالة جديدة من البداية
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          إلغاء
        </button>

        <button
          onClick={handleSendMessage}
          disabled={sending || !title.trim() || !content.trim()}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
        >
          {sending ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>جاري الإرسال...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>إرسال للمستثمرين ({farm.investors_count})</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-900 space-y-2">
            <p className="font-semibold">نصائح لرسالة فعالة:</p>
            <ul className="list-disc list-inside space-y-1 text-amber-800">
              <li>كن واضحاً ومحدداً في الإنجازات</li>
              <li>أضف أرقام دقيقة عند الإمكان</li>
              <li>اذكر الخطط المستقبلية القريبة</li>
              <li>استخدم لغة إيجابية ومطمئنة</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
