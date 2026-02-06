import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ThumbsUp, ThumbsDown, Sparkles, ChevronDown } from 'lucide-react';
import { advancedAssistantService, type UserContext, type ConversationMessage, type FAQ } from '../services/advancedAssistantService';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  confidence?: number;
  suggested_actions?: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
}

export default function AdvancedAIAssistant() {
  const { user, identity } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<FAQ[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      loadSuggestedQuestions();
    }
  }, [isOpen]);

  const getUserType = (): UserContext['user_type'] => {
    if (!user) return 'visitor';
    return identity === 'investment' ? 'investor' : 'authenticated';
  };

  const initializeChat = async () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `مرحباً بك! 👋\n\nأنا مساعدك الذكي المتقدم. يمكنني مساعدتك في:\n\n• الاستفسار عن الاستثمار الزراعي\n• معرفة أنواع الأشجار والمحاصيل\n• فهم عملية التسجيل والحسابات\n• برنامج شريك النجاح\n• المتابعة والصيانة\n\nكيف يمكنني مساعدتك اليوم؟`,
      timestamp: new Date()
    };

    setMessages([welcomeMessage]);
  };

  const loadSuggestedQuestions = async () => {
    const currentPage = window.location.pathname;
    const userType = getUserType();
    const questions = await advancedAssistantService.getPageSpecificQuestions(
      currentPage,
      userType
    );
    setSuggestedQuestions(questions.slice(0, 3));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage.trim();
    if (!messageToSend || isLoading) return;

    setInputMessage('');
    setIsLoading(true);
    setShowSuggestions(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const context: UserContext = {
        user_type: getUserType(),
        current_page: window.location.pathname,
        previous_pages: []
      };

      const response = await advancedAssistantService.askQuestion(
        messageToSend,
        context,
        sessionId || undefined
      );

      if (!sessionId && response) {
        const newSessionId = await advancedAssistantService.createSession(
          context,
          user?.id
        );
        setSessionId(newSessionId);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        confidence: response.confidence,
        suggested_actions: response.suggested_actions
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'عذراً، حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleActionClick = (action: string, url?: string) => {
    if (url) {
      window.location.href = url;
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-50 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 group"
          aria-label="فتح المساعد الذكي"
        >
          <div className="relative">
            <Sparkles className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            المساعد الذكي المتقدم
          </div>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 left-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="text-white font-bold">المساعد الذكي المتقدم</h3>
                <p className="text-emerald-100 text-xs">متصل الآن</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-emerald-500 text-white rounded-tr-sm'
                      : 'bg-white text-gray-800 rounded-tl-sm shadow-md border border-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </p>

                  {message.suggested_actions && message.suggested_actions.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                      {message.suggested_actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleActionClick(action.action, action.url)}
                          className="w-full text-sm px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors text-right font-medium"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString('ar-SA', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-md border border-gray-100">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {showSuggestions && suggestedQuestions.length > 0 && (
            <div className="px-4 py-3 bg-white border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-600">أسئلة مقترحة:</p>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {suggestedQuestions.map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => handleSuggestedQuestion(faq.question_ar)}
                    className="w-full text-right text-xs px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
                  >
                    {faq.question_ar}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="اكتب سؤالك هنا..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white p-3 rounded-xl transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
