import React, { useState, useEffect } from 'react';
import { FileText, User, Calendar, Send, Filter, Search, MessageSquare, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { messagesLogService, MessageLog, MessageLogFilters } from '../../services/messagesLogService';

export default function MessagesLog() {
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<MessageLog | null>(null);
  const [filters, setFilters] = useState<MessageLogFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    by_type: {} as Record<string, number>,
    by_channel: {} as Record<string, number>,
    by_status: {} as Record<string, number>,
    recent_count: 0
  });

  useEffect(() => {
    loadMessages();
    loadStats();
  }, [filters]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await messagesLogService.getAllMessages(filters);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages log:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await messagesLogService.getMessageStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      msg.investor_name?.toLowerCase().includes(search) ||
      msg.template_name?.toLowerCase().includes(search) ||
      msg.subject?.toLowerCase().includes(search) ||
      msg.sent_by_name?.toLowerCase().includes(search) ||
      msg.farm_name?.toLowerCase().includes(search)
    );
  });

  const getMessageTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      payment: 'سداد',
      reservation: 'حجز',
      general: 'عام',
      notification: 'إشعار'
    };
    return types[type] || type;
  };

  const getMessageTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      payment: 'bg-green-100 text-green-800',
      reservation: 'bg-blue-100 text-blue-800',
      general: 'bg-gray-100 text-gray-800',
      notification: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getChannelLabel = (channel: string) => {
    const channels: Record<string, string> = {
      website: 'داخل الموقع',
      whatsapp: 'واتساب',
      sms: 'رسالة نصية',
      email: 'بريد إلكتروني'
    };
    return channels[channel] || channel;
  };

  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      website: 'bg-blue-100 text-blue-800',
      whatsapp: 'bg-green-100 text-green-800',
      sms: 'bg-purple-100 text-purple-800',
      email: 'bg-red-100 text-red-800'
    };
    return colors[channel] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      sent: 'تم الإرسال',
      failed: 'فشل',
      pending: 'قيد الإرسال'
    };
    return statuses[status] || status;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">سجل الرسائل</h2>
          <p className="text-gray-600 mt-1">توثيق كامل لجميع الرسائل المرسلة من النظام</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
          </div>
          <p className="text-sm text-gray-600">إجمالي الرسائل</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.recent_count}</span>
          </div>
          <p className="text-sm text-gray-600">آخر 24 ساعة</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.by_status?.sent || 0}</span>
          </div>
          <p className="text-sm text-gray-600">تم الإرسال</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-8 h-8 text-red-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.by_status?.failed || 0}</span>
          </div>
          <p className="text-sm text-gray-600">فشل الإرسال</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث في الرسائل..."
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={filters.message_type || ''}
            onChange={(e) => setFilters({ ...filters, message_type: e.target.value || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">جميع الأنواع</option>
            <option value="payment">سداد</option>
            <option value="reservation">حجز</option>
            <option value="general">عام</option>
            <option value="notification">إشعار</option>
          </select>

          <select
            value={filters.channel || ''}
            onChange={(e) => setFilters({ ...filters, channel: e.target.value || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">جميع القنوات</option>
            <option value="website">داخل الموقع</option>
            <option value="whatsapp">واتساب</option>
            <option value="sms">رسالة نصية</option>
            <option value="email">بريد إلكتروني</option>
          </select>

          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">جميع الحالات</option>
            <option value="sent">تم الإرسال</option>
            <option value="failed">فشل</option>
            <option value="pending">قيد الإرسال</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد رسائل مرسلة بعد</h3>
              <p className="text-gray-600">
                {messages.length === 0
                  ? 'لم يتم إرسال أي رسائل حتى الآن. ستظهر جميع الرسائل المرسلة هنا.'
                  : 'لا توجد رسائل تطابق معايير البحث والفلترة المحددة.'
                }
              </p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                onClick={() => setSelectedMessage(message)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(message.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-900">{message.investor_name}</h3>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getMessageTypeColor(message.message_type)}`}>
                          {getMessageTypeLabel(message.message_type)}
                        </span>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getChannelColor(message.channel)}`}>
                          {getChannelLabel(message.channel)}
                        </span>
                      </div>

                      {message.subject && (
                        <p className="text-sm text-gray-900 font-medium mb-1">{message.subject}</p>
                      )}

                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {message.content}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        {message.template_name && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {message.template_name}
                          </span>
                        )}
                        {message.sent_by_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {message.sent_by_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(message.created_at)}
                        </span>
                        {message.farm_name && (
                          <span className="text-green-600">
                            {message.farm_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedMessage(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedMessage.investor_name}</h2>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getMessageTypeColor(selectedMessage.message_type)}`}>
                      {getMessageTypeLabel(selectedMessage.message_type)}
                    </span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getChannelColor(selectedMessage.channel)}`}>
                      {getChannelLabel(selectedMessage.channel)}
                    </span>
                    <span className="flex items-center gap-1 text-sm">
                      {getStatusIcon(selectedMessage.status)}
                      {getStatusLabel(selectedMessage.status)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedMessage.subject && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">العنوان</h3>
                  <p className="text-gray-900 font-medium">{selectedMessage.subject}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">محتوى الرسالة</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedMessage.template_name && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">القالب المستخدم</h3>
                    <p className="text-gray-900">{selectedMessage.template_name}</p>
                  </div>
                )}

                {selectedMessage.sent_by_name && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">المرسل</h3>
                    <p className="text-gray-900">{selectedMessage.sent_by_name}</p>
                  </div>
                )}

                {selectedMessage.farm_name && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">المزرعة</h3>
                    <p className="text-gray-900">{selectedMessage.farm_name}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">التاريخ والوقت</h3>
                  <p className="text-gray-900">{formatDate(selectedMessage.created_at)}</p>
                </div>
              </div>

              {selectedMessage.metadata && Object.keys(selectedMessage.metadata).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">معلومات إضافية</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedMessage.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setSelectedMessage(null)}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
