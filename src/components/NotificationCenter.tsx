import { Bell, X, AlertCircle, Info, Megaphone, Sprout, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getMessages, markAsRead, markAllAsRead, type Message } from '../services/messagesService';

interface NotificationCenterProps {
  unreadCount: number;
  onCountChange: () => void;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome-temp',
  user_id: null,
  type: 'welcome',
  priority: 'high',
  title: 'مرحباً بك في منصة حصص زراعية',
  content: 'نتشرف بانضمامك إلى منصة الاستثمار الزراعي المستدام. استكشف المزارع المتاحة واحجز حصتك الآن لتبدأ رحلة الاستثمار الذكي والعوائد المضمونة.',
  is_read: false,
  category: 'important',
  related_farm_id: null,
  action_url: null,
  created_at: new Date().toISOString(),
  read_at: null
};

export default function NotificationCenter({ unreadCount, onCountChange }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false);

  const localUnreadCount = messages.filter(m => !m.is_read).length;

  useEffect(() => {
    if (localUnreadCount > 0) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [localUnreadCount]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await getMessages();
      if (data && data.length > 0) {
        setMessages(data);
      } else {
        setMessages([WELCOME_MESSAGE]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([WELCOME_MESSAGE]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    await loadMessages();
  };

  const handleMarkAsRead = async (messageId: string) => {
    if (messageId === 'welcome-temp') {
      setMessages(messages.map(m =>
        m.id === messageId ? { ...m, is_read: true } : m
      ));
      return;
    }

    try {
      await markAsRead(messageId);
      setMessages(messages.map(m =>
        m.id === messageId ? { ...m, is_read: true } : m
      ));
      onCountChange();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMessages(messages.map(m => ({ ...m, is_read: true })));
  };

  const getMessageIcon = (type: string, priority: string) => {
    if (priority === 'high') return <AlertCircle className="w-6 h-6 text-red-600" />;
    switch (type) {
      case 'welcome': return <Sprout className="w-6 h-6 text-green-600" />;
      case 'admin': return <Megaphone className="w-6 h-6 text-blue-600" />;
      case 'farm_update': return <Info className="w-6 h-6 text-emerald-600" />;
      default: return <Info className="w-6 h-6 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string, isRead: boolean) => {
    if (isRead) return 'bg-gray-50 border-gray-300';
    switch (priority) {
      case 'high': return 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300';
      case 'medium': return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300';
      default: return 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300';
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex flex-col items-center justify-center gap-1 relative group active:scale-95 transition-transform"
        aria-label="الإشعارات"
      >
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative group-active:scale-90 ${
            animate ? 'animate-bounce' : ''
          }`}
          style={{
            background: localUnreadCount > 0
              ? 'linear-gradient(145deg, #D4F4DD 0%, #A8E6CF 100%)'
              : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,252,250,0.9) 100%)',
            boxShadow: localUnreadCount > 0
              ? '0 6px 12px rgba(58,161,126,0.35), inset 0 2px 4px rgba(255,255,255,0.9)'
              : '0 6px 12px rgba(58,161,126,0.2), inset 0 2px 4px rgba(255,255,255,0.9)',
            border: '2.5px solid #3AA17E'
          }}
        >
          <Bell
            className={`w-6 h-6 transition-all duration-300 group-active:scale-110 ${
              localUnreadCount > 0 ? 'text-green-700' : 'text-darkgreen'
            }`}
          />

          {localUnreadCount > 0 && (
            <div
              className="absolute -top-1.5 -right-1.5 min-w-[24px] h-[24px] rounded-full bg-gradient-to-br from-red-500 to-red-600 border-2 border-white flex items-center justify-center shadow-lg"
              style={{
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            >
              <span className="text-[11px] font-bold text-white px-1">
                {localUnreadCount > 99 ? '99+' : localUnreadCount}
              </span>
            </div>
          )}
        </div>
        <span className="text-[10px] font-black text-darkgreen/90">الإشعارات</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          />

          <div
            className="fixed top-0 left-0 right-0 bg-white shadow-2xl z-50 max-h-[85vh] overflow-hidden rounded-b-3xl"
            style={{
              animation: 'slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <div
              className="sticky top-0 z-10 px-6 py-6"
              style={{
                background: 'linear-gradient(135deg, #3AA17E 0%, #2D8B6A 100%)',
                boxShadow: '0 6px 20px rgba(58, 161, 126, 0.3)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">مركز الإشعارات</h2>
                    <p className="text-sm text-white/90 font-semibold mt-0.5">
                      {localUnreadCount > 0 ? `${localUnreadCount} رسالة جديدة` : 'لا توجد رسائل جديدة'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-11 h-11 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all duration-200 backdrop-blur-sm active:scale-95"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {localUnreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="w-full py-3 px-4 rounded-xl bg-white/15 hover:bg-white/25 active:scale-98 text-white text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-sm shadow-md"
                >
                  <CheckCircle className="w-5 h-5" />
                  تعيين الكل كمقروء
                </button>
              )}
            </div>

            <div className="overflow-y-auto max-h-[calc(85vh-160px)] px-4 py-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg font-medium">لا توجد رسائل</p>
                  <p className="text-gray-400 text-sm mt-2">سنرسل لك إشعارات مهمة هنا</p>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => !message.is_read && handleMarkAsRead(message.id)}
                      className={`relative rounded-2xl border-2 p-5 transition-all duration-300 cursor-pointer ${
                        getPriorityColor(message.priority, message.is_read)
                      } ${
                        !message.is_read ? 'shadow-lg hover:shadow-xl transform hover:scale-[1.02]' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        boxShadow: !message.is_read
                          ? '0 8px 20px rgba(58,161,126,0.15), 0 2px 8px rgba(58,161,126,0.08)'
                          : '0 2px 8px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div className="flex gap-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          message.is_read ? 'bg-gray-200' : 'bg-white shadow-md'
                        }`}>
                          {getMessageIcon(message.type, message.priority)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className={`font-bold text-lg ${
                              message.is_read ? 'text-gray-600' : 'text-gray-900'
                            }`}>
                              {message.title}
                            </h3>
                            {!message.is_read && (
                              <div className="flex-shrink-0 w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 animate-pulse shadow-md" />
                            )}
                          </div>

                          <p className={`text-sm leading-relaxed mb-4 ${
                            message.is_read ? 'text-gray-500' : 'text-gray-700'
                          }`}>
                            {message.content}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">
                              {new Date(message.created_at).toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>

                            {message.action_url && (
                              <button className="text-sm font-bold text-green-600 hover:text-green-700 transition-colors flex items-center gap-1">
                                عرض التفاصيل
                                <span className="text-lg">←</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
