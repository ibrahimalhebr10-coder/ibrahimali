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
  priority: 'medium',
  title: 'أهلاً بك في منصة الاستثمار الزراعي',
  content: 'يسعدنا وجودك معنا في رحلة الاستثمار الزراعي المستدام. اكتشف المزارع المتاحة واحجز شجرتك الآن لتبدأ في جني الأرباح.',
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
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
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
    if (priority === 'high') return <AlertCircle className="w-5 h-5 text-red-500" />;
    switch (type) {
      case 'welcome': return <Sprout className="w-5 h-5 text-green-600" />;
      case 'admin': return <Megaphone className="w-5 h-5 text-blue-500" />;
      case 'farm_update': return <Info className="w-5 h-5 text-green-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string, isRead: boolean) => {
    if (isRead) return 'bg-gray-50 border-gray-200';
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative group"
        aria-label="الإشعارات"
      >
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            animate ? 'scale-110' : 'scale-100'
          }`}
          style={{
            background: localUnreadCount > 0
              ? 'linear-gradient(145deg, #D4F4DD 0%, #A8E6CF 100%)'
              : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
            boxShadow: localUnreadCount > 0
              ? '0 4px 12px rgba(58, 161, 126, 0.3), inset 0 1px 2px rgba(255,255,255,0.8)'
              : '0 4px 8px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8)',
            border: localUnreadCount > 0 ? '2px solid #3AA17E' : '2px solid #e5e5e5'
          }}
        >
          <Bell
            className={`w-6 h-6 transition-all duration-300 ${
              localUnreadCount > 0 ? 'text-green-700' : 'text-gray-500'
            } ${animate ? 'animate-bounce' : ''}`}
          />

          {localUnreadCount > 0 && (
            <div
              className="absolute -top-1 -right-1 min-w-[22px] h-[22px] rounded-full bg-gradient-to-br from-red-500 to-red-600 border-2 border-white flex items-center justify-center shadow-lg animate-pulse"
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
        <span className="text-[10px] font-semibold text-gray-600 mt-1 block">الإشعارات</span>
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
              className="sticky top-0 z-10 px-6 py-5"
              style={{
                background: 'linear-gradient(135deg, #3AA17E 0%, #2D8B6A 100%)',
                boxShadow: '0 4px 12px rgba(58, 161, 126, 0.2)'
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">مركز الإشعارات</h2>
                    <p className="text-xs text-white/80">
                      {localUnreadCount > 0 ? `${localUnreadCount} رسالة جديدة` : 'لا توجد رسائل جديدة'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {localUnreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-sm"
                >
                  <CheckCircle className="w-4 h-4" />
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
                      className={`relative rounded-2xl border-2 p-4 transition-all duration-300 cursor-pointer ${
                        getPriorityColor(message.priority, message.is_read)
                      } ${
                        !message.is_read ? 'shadow-md hover:shadow-lg' : 'opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                          message.is_read ? 'bg-gray-200' : 'bg-white shadow-sm'
                        }`}>
                          {getMessageIcon(message.type, message.priority)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className={`font-bold text-base ${
                              message.is_read ? 'text-gray-600' : 'text-gray-900'
                            }`}>
                              {message.title}
                            </h3>
                            {!message.is_read && (
                              <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                            )}
                          </div>

                          <p className={`text-sm leading-relaxed mb-3 ${
                            message.is_read ? 'text-gray-500' : 'text-gray-700'
                          }`}>
                            {message.content}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {new Date(message.created_at).toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>

                            {message.action_url && (
                              <button className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors">
                                عرض التفاصيل ←
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
