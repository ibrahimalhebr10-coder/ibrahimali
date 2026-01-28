import React, { useState, useEffect } from 'react';
import { ArrowRight, Mail, Users, Eye, Clock, CheckCircle, XCircle, User } from 'lucide-react';
import { investorMessagingService, InvestorMessageWithDetails, InvestorMessageRecipient } from '../../services/investorMessagingService';

interface Props {
  messageId: string;
  onBack: () => void;
}

export default function MessageDetails({ messageId, onBack }: Props) {
  const [message, setMessage] = useState<InvestorMessageWithDetails | null>(null);
  const [recipients, setRecipients] = useState<Array<InvestorMessageRecipient & { email: string; full_name?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessageDetails();
  }, [messageId]);

  async function loadMessageDetails() {
    try {
      setLoading(true);
      const [messageData, recipientsData] = await Promise.all([
        investorMessagingService.getMessageById(messageId),
        investorMessagingService.getMessageRecipients(messageId)
      ]);

      setMessage(messageData);
      setRecipients(recipientsData);
    } catch (error) {
      console.error('Error loading message details:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل تفاصيل الرسالة...</p>
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-800">لم يتم العثور على الرسالة</p>
      </div>
    );
  }

  const readRecipients = recipients.filter(r => r.is_read).length;
  const readRate = recipients.length > 0
    ? Math.round((readRecipients / recipients.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowRight className="w-5 h-5" />
        <span>رجوع إلى السجل</span>
      </button>

      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-start gap-4">
          <div className="bg-purple-600 text-white p-3 rounded-lg">
            <Mail className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {message.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  {new Date(message.sent_at).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {message.farms && (
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                    {message.farms.name_ar}
                  </span>
                </div>
              )}
              {message.admins && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">
                    {message.admins.full_name || message.admins.email}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">إجمالي المستلمين</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{message.recipients_count}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">عدد من قرأ</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{message.read_count}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">معدل القراءة</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{readRate}%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          محتوى الرسالة
        </h3>
        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            قائمة المستلمين ({recipients.length})
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">قرأ: {readRecipients}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">لم يقرأ: {recipients.length - readRecipients}</span>
            </div>
          </div>
        </div>

        {recipients.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">لا يوجد مستلمون</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    المستثمر
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    الحالة
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    وقت القراءة
                  </th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((recipient) => (
                  <tr
                    key={recipient.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {recipient.full_name || 'مستثمر'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {recipient.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {recipient.is_read ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          <CheckCircle className="w-3 h-3" />
                          قرأ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                          <XCircle className="w-3 h-3" />
                          لم يقرأ
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {recipient.read_at ? (
                        <span className="text-sm text-gray-600">
                          {new Date(recipient.read_at).toLocaleDateString('ar-SA', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
