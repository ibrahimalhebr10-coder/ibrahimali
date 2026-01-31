import { useState, useEffect } from 'react';
import { X, Sparkles, Send, ChevronLeft, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { askAIAssistant, getConversationHistory, getSuggestedQuestions, AIResponse, ConversationHistory } from '../services/aiAssistantService';

interface SmartAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  type: 'question' | 'answer';
  content: string;
  category?: 'curious' | 'worried' | 'investment';
  timestamp: Date;
}

const quickQuestions = [
  'ما فكرة المنصة؟',
  'هل املك الشجرة فعليا؟',
  'هل هذا استثمار ام تجربة؟',
  'ماذا لو حصلت مشكلة في المزرعة؟',
  'هل يوجد التزام طويل؟',
  'كيف استفيد من المحصول؟',
];

export default function SmartAssistant({ isOpen, onClose }: SmartAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationHistory[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadSuggestedQuestions();
      loadConversationHistory();
    }
  }, [isOpen]);

  const loadSuggestedQuestions = async () => {
    try {
      const suggestions = await getSuggestedQuestions();
      setSuggestedQuestions(suggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const loadConversationHistory = async () => {
    try {
      const history = await getConversationHistory(5);
      setConversationHistory(history);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  if (!isOpen) return null;

  const handleClose = () => {
    setMessages([]);
    setCustomQuestion('');
    setShowCustomInput(false);
    onClose();
  };

  const handleAskQuestion = async (question: string) => {
    const questionMessage: Message = {
      id: `q-${Date.now()}`,
      type: 'question',
      content: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, questionMessage]);
    setCustomQuestion('');
    setIsLoading(true);

    try {
      const response: AIResponse = await askAIAssistant(question);

      const answerMessage: Message = {
        id: `a-${Date.now()}`,
        type: 'answer',
        content: response.answer,
        category: response.category,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, answerMessage]);
      await loadSuggestedQuestions();
      await loadConversationHistory();
    } catch (error) {
      console.error('Failed to get answer:', error);
      const errorMessage: Message = {
        id: `e-${Date.now()}`,
        type: 'answer',
        content: 'عذراً، حدث خطأ. حاول مرة أخرى أو تواصل مع الدعم.',
        category: 'worried',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleAskQuestion(question);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customQuestion.trim()) {
      handleAskQuestion(customQuestion);
      setShowCustomInput(false);
    }
  };

  const getCategoryStyle = (category?: 'curious' | 'worried' | 'investment') => {
    switch (category) {
      case 'worried':
        return {
          bg: 'linear-gradient(135deg, #FFF8E7 0%, #FFF3CD 100%)',
          border: '1px solid #FFE082',
          iconBg: '#F9A825'
        };
      case 'investment':
        return {
          bg: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
          border: '1px solid #A5D6A7',
          iconBg: '#2F5233'
        };
      default:
        return {
          bg: 'linear-gradient(135deg, #F8FAF8 0%, #F0F4F0 100%)',
          border: '1px solid #E0E8E0',
          iconBg: '#3AA17E'
        };
    }
  };

  const renderWelcomeScreen = () => (
    <>
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
          style={{
            background: 'linear-gradient(135deg, #2F5233 0%, #3D6B42 100%)',
            boxShadow: '0 4px 12px rgba(47, 82, 51, 0.3)'
          }}
        >
          <Sparkles className="w-6 h-6 text-white" />
          <div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: '#D4AF37' }}
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </div>
        </div>

        <div
          className="flex-1 p-3.5 rounded-2xl rounded-tr-sm"
          style={{
            background: 'linear-gradient(135deg, #F8FAF8 0%, #F0F4F0 100%)',
            border: '1px solid #E0E8E0'
          }}
        >
          <p className="text-sm text-gray-700 leading-relaxed">
            اهلا، انا مساعدك الذكي. اسألني اي شيء عن الاستثمار الزراعي او المنصة
          </p>
        </div>
      </div>

      {conversationHistory.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-gray-400 font-medium mb-2">محادثاتك السابقة:</p>
          <div className="space-y-2">
            {conversationHistory.slice(0, 2).map((conv, idx) => (
              <button
                key={idx}
                onClick={() => handleAskQuestion(conv.question)}
                className="w-full p-2.5 rounded-lg text-right bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                <p className="text-[11px] text-blue-700 font-medium">{conv.question}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 mb-4">
        <p className="text-[11px] text-gray-500 font-medium mb-2">اسئلة سريعة:</p>
        <div className="grid grid-cols-2 gap-2">
          {quickQuestions.map((question, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickQuestion(question)}
              className="p-3 rounded-xl text-right transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #FAFAFA 100%)',
                border: '1.5px solid #E8EDE8',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
            >
              <span className="text-[11px] font-medium text-gray-700">{question}</span>
            </button>
          ))}
        </div>
      </div>

      {suggestedQuestions.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-gray-400 font-medium mb-2">الاكثر طلباً من المستخدمين:</p>
          <div className="space-y-2">
            {suggestedQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleAskQuestion(question)}
                className="w-full p-2.5 rounded-lg text-right bg-green-50 border border-green-100 hover:bg-green-100 transition-colors"
              >
                <p className="text-[11px] text-green-700 font-medium">{question}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowCustomInput(true)}
        className="w-full p-4 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{
          background: 'linear-gradient(135deg, #2F5233 0%, #3D6B42 100%)',
          boxShadow: '0 4px 12px rgba(47, 82, 51, 0.3)'
        }}
      >
        <span className="text-sm font-bold text-white">اكتب سؤالك الخاص</span>
      </button>
    </>
  );

  const renderConversation = () => (
    <>
      <button
        onClick={() => {
          setMessages([]);
          setShowCustomInput(false);
        }}
        className="flex items-center gap-2 text-gray-500 mb-4 hover:text-gray-700 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 rotate-180" />
        <span className="text-xs font-medium">رجوع للبداية</span>
      </button>

      <div className="space-y-4 mb-4">
        {messages.map((message) => {
          if (message.type === 'question') {
            return (
              <div
                key={message.id}
                className="p-3 rounded-xl mr-8"
                style={{
                  background: '#F5F5F5',
                  border: '1px solid #E0E0E0'
                }}
              >
                <p className="text-xs font-bold text-gray-700 text-right">{message.content}</p>
              </div>
            );
          }

          const style = getCategoryStyle(message.category);
          return (
            <div key={message.id} className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: style.iconBg }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>

              <div
                className="flex-1 p-4 rounded-2xl rounded-tr-sm"
                style={{
                  background: style.bg,
                  border: style.border
                }}
              >
                <p className="text-[13px] text-gray-700 leading-relaxed">
                  {message.content}
                </p>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#3AA17E' }}
            >
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
            <div
              className="flex-1 p-4 rounded-2xl rounded-tr-sm"
              style={{
                background: 'linear-gradient(135deg, #F8FAF8 0%, #F0F4F0 100%)',
                border: '1px solid #E0E8E0'
              }}
            >
              <p className="text-[13px] text-gray-500">جاري التفكير...</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleCustomSubmit} className="mt-4 mb-4">
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!customQuestion.trim() || isLoading}
            className="px-4 py-3 rounded-xl flex items-center justify-center disabled:opacity-50 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #2F5233 0%, #3D6B42 100%)',
            }}
          >
            <Send className="w-5 h-5 text-white" />
          </button>
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="اكتب سؤالك هنا..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#3AA17E] text-sm"
            style={{ direction: 'rtl' }}
          />
        </div>
      </form>
    </>
  );

  const renderCustomInput = () => (
    <>
      <button
        onClick={() => setShowCustomInput(false)}
        className="flex items-center gap-2 text-gray-500 mb-4 hover:text-gray-700 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 rotate-180" />
        <span className="text-xs font-medium">رجوع</span>
      </button>

      <div
        className="p-4 rounded-xl mb-4"
        style={{
          background: 'linear-gradient(135deg, #F8FAF8 0%, #F0F4F0 100%)',
          border: '1px solid #E0E8E0'
        }}
      >
        <p className="text-sm text-gray-700 leading-relaxed mb-2">
          اكتب سؤالك وسأجيبك بناءً على معرفتي بالمنصة
        </p>
        <p className="text-[10px] text-gray-500">
          المساعد الذكي يتعلم من كل محادثة ليقدم اجوبة افضل
        </p>
      </div>

      <form onSubmit={handleCustomSubmit}>
        <textarea
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          placeholder="مثال: كم عدد الاشجار التي يمكنني شراؤها؟"
          disabled={isLoading}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#3AA17E] text-sm resize-none mb-3"
          style={{ direction: 'rtl' }}
        />

        <button
          type="submit"
          disabled={!customQuestion.trim() || isLoading}
          className="w-full p-4 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #2F5233 0%, #3D6B42 100%)',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 text-white animate-spin" />
              <span className="text-sm font-bold text-white">جاري التفكير...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5 text-white" />
              <span className="text-sm font-bold text-white">ارسل السؤال</span>
            </>
          )}
        </button>
      </form>
    </>
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm transition-opacity duration-300"
        style={{ animation: 'fadeIn 0.3s ease-out', zIndex: 999999 }}
        onClick={handleClose}
      />

      <div
        className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl overflow-hidden rounded-t-3xl flex flex-col"
        dir="rtl"
        style={{
          animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          maxHeight: '65vh',
          height: '65vh',
          paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)',
          zIndex: 9999999,
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className="flex justify-center pt-3 pb-2 bg-white rounded-t-3xl flex-shrink-0">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        <div
          className="flex-shrink-0 px-6 py-5"
          style={{
            background: 'linear-gradient(135deg, #2F5233 0%, #3D6B42 100%)',
            boxShadow: '0 6px 20px rgba(47, 82, 51, 0.3)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">المساعد الذكي</h2>
                <p className="text-sm text-white/90 font-semibold mt-0.5">مدعوم بالذكاء الصناعي</p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-11 h-11 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all duration-200 backdrop-blur-sm active:scale-95"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div
          className="overflow-y-auto flex-1 px-4 py-4"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 100px)',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {messages.length > 0 ? renderConversation() : showCustomInput ? renderCustomInput() : renderWelcomeScreen()}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
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
