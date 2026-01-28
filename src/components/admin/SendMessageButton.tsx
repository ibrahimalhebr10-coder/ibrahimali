import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, X, AlertCircle } from 'lucide-react';
import { messageTemplatesService } from '../../services/messageTemplatesService';
import { investorMessagingService } from '../../services/investorMessagingService';

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
}

interface SendMessageButtonProps {
  userId: string;
  farmId?: number;
  farmName?: string;
  reservationId?: string;
  eventType: 'reservation_approved' | 'payment_opened' | 'payment_received' | 'contract_ready' | 'custom';
  buttonText?: string;
  buttonVariant?: 'primary' | 'secondary' | 'success';
  onMessageSent?: () => void;
}

export default function SendMessageButton({
  userId,
  farmId,
  farmName,
  reservationId,
  eventType,
  buttonText,
  buttonVariant = 'primary',
  onMessageSent
}: SendMessageButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (showModal) {
      loadTemplates();
    }
  }, [showModal]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const categoryMap = {
        reservation_approved: 'reservation_status',
        payment_opened: 'payment',
        payment_received: 'payment',
        contract_ready: 'general',
        custom: 'general'
      };

      const category = categoryMap[eventType];
      const data = await messageTemplatesService.getTemplatesByCategory(category);
      setTemplates(data);

      if (data.length > 0) {
        const template = data[0];
        setSelectedTemplate(template.id);
        setCustomSubject(template.subject);
        setCustomBody(template.body);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setCustomSubject(template.subject);
      setCustomBody(template.body);
    }
  };

  const handleSendMessage = async () => {
    if (!userId || !selectedTemplate || !customSubject.trim() || !customBody.trim()) {
      alert('يرجى اختيار قالب وملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      await investorMessagingService.sendMessage({
        user_id: userId,
        farm_id: farmId,
        subject: customSubject,
        body: customBody,
        template_id: selectedTemplate,
        metadata: {
          event_type: eventType,
          reservation_id: reservationId,
          farm_name: farmName
        }
      });

      alert('✅ تم إرسال الرسالة بنجاح!\n\nتم إرسال الرسالة إلى المستثمر وتسجيلها في سجل الرسائل.');
      setShowModal(false);

      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const getButtonStyles = () => {
    const baseStyles = 'px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2';

    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
      success: 'bg-green-600 hover:bg-green-700 text-white'
    };

    return `${baseStyles} ${variants[buttonVariant]}`;
  };

  const getEventLabel = () => {
    const labels = {
      reservation_approved: 'إشعار اعتماد الحجز',
      payment_opened: 'إشعار فتح السداد',
      payment_received: 'إشعار استلام الدفع',
      contract_ready: 'إشعار جاهزية العقد',
      custom: 'إرسال رسالة'
    };
    return labels[eventType] || 'إرسال رسالة';
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={getButtonStyles()}
        title={buttonText || getEventLabel()}
      >
        <MessageSquare className="w-4 h-4" />
        {buttonText || getEventLabel()}
      </button>

      {showModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowModal(false)}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{getEventLabel()}</h2>
                    {farmName && (
                      <p className="text-sm text-gray-600">المزرعة: {farmName}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900">تأكيد الإرسال</p>
                    <p className="text-xs text-amber-800 mt-1">
                      سيتم إرسال هذه الرسالة إلى المستثمر داخل الموقع وتسجيلها في سجل الرسائل. يرجى التأكد من صحة المعلومات قبل الإرسال.
                    </p>
                  </div>
                </div>

                {loadingTemplates ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-4">جاري تحميل القوالب...</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        اختر قالب الرسالة <span className="text-red-600">*</span>
                      </label>
                      {templates.length === 0 ? (
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
                          <p className="text-sm text-red-900 font-semibold">لا توجد قوالب متاحة</p>
                          <p className="text-xs text-red-800 mt-1">يرجى إنشاء قوالب رسائل أولاً من صفحة "قوالب الرسائل"</p>
                        </div>
                      ) : (
                        <select
                          value={selectedTemplate}
                          onChange={(e) => handleTemplateChange(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          required
                        >
                          <option value="">-- اختر قالب --</option>
                          {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {selectedTemplate && (
                      <>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            عنوان الرسالة <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={customSubject}
                            onChange={(e) => setCustomSubject(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="عنوان الرسالة"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            نص الرسالة <span className="text-red-600">*</span>
                          </label>
                          <textarea
                            value={customBody}
                            onChange={(e) => setCustomBody(e.target.value)}
                            rows={8}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                            placeholder="نص الرسالة"
                            required
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-lg font-bold text-gray-700 border-2 border-gray-300 hover:bg-gray-100 transition-all"
                  disabled={loading}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !selectedTemplate || !customSubject.trim() || !customBody.trim()}
                  className="px-6 py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      إرسال الرسالة
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
