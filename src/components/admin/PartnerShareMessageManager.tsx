import React, { useState, useEffect } from 'react';
import { MessageSquare, Save, RotateCcw, Eye, Copy, Check, AlertCircle, Link, Power } from 'lucide-react';
import { partnerShareMessageService, ShareMessageTemplate } from '../../services/partnerShareMessageService';

export default function PartnerShareMessageManager() {
  const [template, setTemplate] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [originalTemplate, setOriginalTemplate] = useState<ShareMessageTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const data = await partnerShareMessageService.getTemplate();
      setTemplate(data.template);
      setWebsiteUrl(data.websiteUrl);
      setEnabled(data.enabled);
      setOriginalTemplate(data);
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const results = await Promise.all([
        partnerShareMessageService.updateTemplate(template),
        partnerShareMessageService.updateWebsiteUrl(websiteUrl),
        partnerShareMessageService.toggleEnabled(enabled)
      ]);

      const hasError = results.some(r => !r.success);

      if (hasError) {
        throw new Error('فشل في حفظ بعض الإعدادات');
      }

      setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح' });
      await loadTemplate();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'حدث خطأ أثناء الحفظ' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalTemplate) {
      setTemplate(originalTemplate.template);
      setWebsiteUrl(originalTemplate.websiteUrl);
      setEnabled(originalTemplate.enabled);
      setMessage(null);
    }
  };

  const handleCopyPreview = async () => {
    const previewText = partnerShareMessageService.renderTemplate(template, {
      partner_name: 'أحمد محمد',
      display_name: 'أحمد محمد',
      website_url: websiteUrl
    });

    try {
      await navigator.clipboard.writeText(previewText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying:', err);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = template.substring(0, start) + variable + template.substring(end);
      setTemplate(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const availableVariables = [
    { key: '{partner_name}', description: 'اسم الشريك' },
    { key: '{display_name}', description: 'الاسم المعروض' },
    { key: '{website_url}', description: 'رابط الموقع' }
  ];

  const previewText = partnerShareMessageService.renderTemplate(template, {
    partner_name: 'أحمد محمد',
    display_name: 'أحمد محمد',
    website_url: websiteUrl
  });

  const hasChanges =
    template !== originalTemplate?.template ||
    websiteUrl !== originalTemplate?.websiteUrl ||
    enabled !== originalTemplate?.enabled;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">إدارة رسالة المشاركة</h2>
            <p className="text-sm text-slate-600">تخصيص الرسالة التي يشاركها الشركاء</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm font-bold text-slate-700">تفعيل النظام</span>
            <div className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-slate-300'}`}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only"
              />
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'right-0.5' : 'right-6'}`}></div>
            </div>
          </label>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-5 h-5 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
            <p className={`text-sm font-bold ${message.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-right">قالب الرسالة</h3>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold text-slate-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>{showPreview ? 'إخفاء' : 'معاينة'}</span>
              </button>
            </div>

            <textarea
              id="template-textarea"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={16}
              dir="rtl"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none font-sans text-sm"
              placeholder="أدخل قالب الرسالة هنا..."
            />

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm font-bold text-blue-900 mb-3 text-right">المتغيرات المتاحة:</p>
              <div className="space-y-2">
                {availableVariables.map((variable) => (
                  <button
                    key={variable.key}
                    type="button"
                    onClick={() => insertVariable(variable.key)}
                    className="w-full flex items-center justify-between p-2 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors text-right"
                  >
                    <span className="text-sm text-slate-600">{variable.description}</span>
                    <code className="text-xs font-mono bg-blue-100 px-2 py-1 rounded text-blue-700">
                      {variable.key}
                    </code>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Link className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-right">رابط الموقع</h3>
            </div>

            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              dir="ltr"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="https://ashjari.com"
            />

            <p className="text-sm text-slate-500 mt-2 text-right">
              سيتم استبدال {'{website_url}'} بهذا الرابط
            </p>
          </div>
        </div>

        {showPreview && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-slate-300 p-6 shadow-lg sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-right">معاينة الرسالة</h3>
                <button
                  type="button"
                  onClick={handleCopyPreview}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>نسخ</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-white rounded-xl p-4 border-2 border-slate-300 shadow-sm">
                <div className="whitespace-pre-wrap text-sm text-slate-800 text-right font-sans leading-relaxed">
                  {previewText}
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800 text-right">
                  مثال توضيحي باستخدام: أحمد محمد
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 pt-6 border-t-2 border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 rounded-xl font-bold text-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>التراجع</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl font-bold shadow-lg transition-all"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>جاري الحفظ...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>حفظ التغييرات</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
