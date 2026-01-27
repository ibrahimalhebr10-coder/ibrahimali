import { useState, useEffect } from 'react';
import { X, Bell, CheckCheck, ExternalLink, Leaf, AlertCircle, Info } from 'lucide-react';
import { getMessages, markAsRead, markAllAsRead, getUnreadCount, Message } from '../services/messagesService';

interface MessagesProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export default function Messages({ isOpen, onClose, onUnreadCountChange }: MessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'important' | 'general'>('important');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMessages(activeTab);
    }
  }, [isOpen, activeTab]);

  const loadMessages = async (category: 'important' | 'general') => {
    setIsLoading(true);
    try {
      const data = await getMessages(category);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await markAsRead(messageId);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );

      const totalUnreadCount = await getUnreadCount();
      onUnreadCountChange?.(totalUnreadCount);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setMessages(prev =>
        prev.map(msg => ({ ...msg, is_read: true }))
      );
      onUnreadCountChange?.(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  if (!isOpen) return null;

  const getMessageIcon = (type: Message['type']) => {
    switch (type) {
      case 'welcome':
        return <Bell className="w-5 h-5" />;
      case 'admin':
        return <AlertCircle className="w-5 h-5" />;
      case 'farm_update':
        return <Leaf className="w-5 h-5" />;
      case 'operational':
        return <Info className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getMessageStyle = (type: Message['type'], priority: Message['priority']) => {
    if (priority === 'high') {
      return {
        iconBg: 'linear-gradient(135deg, #D32F2F 0%, #E53935 100%)',
        borderColor: '#FFCDD2',
        bgColor: '#FFEBEE'
      };
    }

    switch (type) {
      case 'welcome':
      case 'admin':
        return {
          iconBg: 'linear-gradient(135deg, #2F5233 0%, #3D6B42 100%)',
          borderColor: '#C8E6C9',
          bgColor: '#E8F5E9'
        };
      case 'farm_update':
        return {
          iconBg: 'linear-gradient(135deg, #1976D2 0%, #2196F3 100%)',
          borderColor: '#BBDEFB',
          bgColor: '#E3F2FD'
        };
      case 'operational':
        return {
          iconBg: 'linear-gradient(135deg, #F57C00 0%, #FB8C00 100%)',
          borderColor: '#FFE0B2',
          bgColor: '#FFF3E0'
        };
      default:
        return {
          iconBg: 'linear-gradient(135deg, #616161 0%, #757575 100%)',
          borderColor: '#E0E0E0',
          bgColor: '#F5F5F5'
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;

    return date.toLocaleDateString('ar-SA', {
      month: 'short',
      day: 'numeric'
    });
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" dir="rtl">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md bg-white rounded-t-3xl overflow-hidden animate-slide-up"
        style={{
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.15)',
          maxHeight: '85vh'
        }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <button
            onClick={onClose}
            className="w-12 h-1.5 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, #2F5233 0%, #3D6B42 100%)'
              }}
            >
              <Bell className="w-4.5 h-4.5 text-white" />
              {unreadCount > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white">{unreadCount}</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">الرسائل</h3>
              <p className="text-[10px] text-gray-400">تحديثات ومعلومات مهمة</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex gap-2 px-5 pt-3 pb-2 border-b border-gray-100">
          <button
            onClick={() => setActiveTab('important')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'important'
                ? 'bg-gradient-to-r from-[#2F5233] to-[#3D6B42] text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            المهم
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'general'
                ? 'bg-gradient-to-r from-[#2F5233] to-[#3D6B42] text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            عام
          </button>
        </div>

        {unreadCount > 0 && (
          <div className="px-5 py-2 border-b border-gray-100">
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 text-xs font-medium text-[#3AA17E] hover:text-[#2F5233] transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>وضع علامة مقروء على الكل</span>
            </button>
          </div>
        )}

        <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-[#3AA17E] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #F5F5F5 0%, #EEEEEE 100%)' }}
              >
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">لا توجد رسائل</p>
              <p className="text-xs text-gray-400 mt-1">سنرسل لك تحديثات هنا</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const style = getMessageStyle(message.type, message.priority);

                return (
                  <div
                    key={message.id}
                    onClick={() => !message.is_read && handleMarkAsRead(message.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      !message.is_read ? 'shadow-md' : 'opacity-75'
                    }`}
                    style={{
                      backgroundColor: style.bgColor,
                      borderColor: style.borderColor
                    }}
                  >
                    <div className="flex gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: style.iconBg }}
                      >
                        <div className="text-white">
                          {getMessageIcon(message.type)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="text-sm font-bold text-gray-800 leading-tight">
                            {message.title}
                          </h4>
                          {!message.is_read && (
                            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1" />
                          )}
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed mb-2">
                          {message.content}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 font-medium">
                            {formatDate(message.created_at)}
                          </span>

                          {message.action_url && (
                            <button
                              className="flex items-center gap-1 text-[10px] font-bold text-[#3AA17E] hover:text-[#2F5233] transition-colors"
                            >
                              <span>عرض التفاصيل</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, white 0%, transparent 100%)'
          }}
        />
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
