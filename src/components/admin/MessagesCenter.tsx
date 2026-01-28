import { useState } from 'react';
import { MessageSquare, Send, Users, Bell, Filter, Search, Mail, Phone, FileText, List } from 'lucide-react';
import MessageTemplates from './MessageTemplates';
import MessagesLog from './MessagesLog';

export default function MessagesCenter() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose' | 'templates' | 'log'>('inbox');

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, #3AA17E, #2D8B6A)'
              }}
            >
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">إدارة الرسائل</h1>
              <p className="text-sm text-gray-400">مركز إدارة التواصل مع المستثمرين</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div
            className="p-6 rounded-2xl"
            style={{
              background: 'linear-gradient(145deg, rgba(58, 161, 126, 0.1), rgba(45, 139, 106, 0.05))',
              border: '1px solid rgba(58, 161, 126, 0.2)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <Mail className="w-8 h-8 text-green-400" />
              <span className="text-2xl font-bold text-white">12</span>
            </div>
            <p className="text-sm text-gray-400">رسائل الموقع</p>
          </div>

          <div
            className="p-6 rounded-2xl"
            style={{
              background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <Phone className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">5</span>
            </div>
            <p className="text-sm text-gray-400">واتساب مباشر</p>
            <p className="text-xs text-gray-500 mt-1">(مؤقت)</p>
          </div>

          <div
            className="p-6 rounded-2xl"
            style={{
              background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.1), rgba(147, 51, 234, 0.05))',
              border: '1px solid rgba(168, 85, 247, 0.2)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">28</span>
            </div>
            <p className="text-sm text-gray-400">مستثمرون نشطون</p>
          </div>

          <div
            className="p-6 rounded-2xl"
            style={{
              background: 'linear-gradient(145deg, rgba(251, 146, 60, 0.1), rgba(249, 115, 22, 0.05))',
              border: '1px solid rgba(251, 146, 60, 0.2)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <Bell className="w-8 h-8 text-orange-400" />
              <span className="text-2xl font-bold text-white">3</span>
            </div>
            <p className="text-sm text-gray-400">رسائل معلقة</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setActiveTab('inbox')}
              className="flex-1 px-4 py-3 rounded-lg transition-all duration-300 font-semibold"
              style={{
                background: activeTab === 'inbox'
                  ? 'linear-gradient(145deg, #3AA17E, #2D8B6A)'
                  : 'transparent',
                color: activeTab === 'inbox' ? '#FFFFFF' : '#9CA3AF'
              }}
            >
              صندوق الوارد
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className="flex-1 px-4 py-3 rounded-lg transition-all duration-300 font-semibold"
              style={{
                background: activeTab === 'sent'
                  ? 'linear-gradient(145deg, #3AA17E, #2D8B6A)'
                  : 'transparent',
                color: activeTab === 'sent' ? '#FFFFFF' : '#9CA3AF'
              }}
            >
              الرسائل المرسلة
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className="flex-1 px-4 py-3 rounded-lg transition-all duration-300 font-semibold flex items-center justify-center gap-2"
              style={{
                background: activeTab === 'templates'
                  ? 'linear-gradient(145deg, #3AA17E, #2D8B6A)'
                  : 'transparent',
                color: activeTab === 'templates' ? '#FFFFFF' : '#9CA3AF'
              }}
            >
              <FileText className="w-5 h-5" />
              قوالب الرسائل
            </button>
            <button
              onClick={() => setActiveTab('log')}
              className="flex-1 px-4 py-3 rounded-lg transition-all duration-300 font-semibold flex items-center justify-center gap-2"
              style={{
                background: activeTab === 'log'
                  ? 'linear-gradient(145deg, #3AA17E, #2D8B6A)'
                  : 'transparent',
                color: activeTab === 'log' ? '#FFFFFF' : '#9CA3AF'
              }}
            >
              <List className="w-5 h-5" />
              سجل الرسائل
            </button>
            <button
              onClick={() => setActiveTab('compose')}
              className="flex-1 px-4 py-3 rounded-lg transition-all duration-300 font-semibold"
              style={{
                background: activeTab === 'compose'
                  ? 'linear-gradient(145deg, #3AA17E, #2D8B6A)'
                  : 'transparent',
                color: activeTab === 'compose' ? '#FFFFFF' : '#9CA3AF'
              }}
            >
              إنشاء رسالة
            </button>
          </div>
        </div>

        {activeTab === 'templates' ? (
          <MessageTemplates />
        ) : activeTab === 'log' ? (
          <MessagesLog />
        ) : (
          <div
            className="p-6 rounded-2xl"
            style={{
              background: 'linear-gradient(145deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.8))',
              border: '1px solid rgba(75, 85, 99, 0.3)'
            }}
          >
            {activeTab === 'inbox' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">صندوق الوارد</h2>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <Filter className="w-5 h-5 text-gray-400" />
                  </button>
                  <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="البحث في الرسائل..."
                      className="pr-10 pl-4 py-2 rounded-lg bg-white/5 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">لا توجد رسائل حالياً</p>
                  <p className="text-sm text-gray-500">سيتم عرض الرسائل الواردة هنا</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sent' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">الرسائل المرسلة</h2>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <Filter className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-center py-12">
                  <Send className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">لا توجد رسائل مرسلة</p>
                  <p className="text-sm text-gray-500">سيتم عرض الرسائل المرسلة هنا</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compose' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">إنشاء رسالة جديدة</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    نوع الرسالة
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-green-500"
                  >
                    <option value="website">رسالة داخل الموقع</option>
                    <option value="whatsapp">واتساب مباشر (مؤقت)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    المستلمون
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-green-500"
                  >
                    <option value="all">جميع المستثمرين</option>
                    <option value="farm">مستثمرو مزرعة محددة</option>
                    <option value="custom">مجموعة مخصصة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    عنوان الرسالة
                  </label>
                  <input
                    type="text"
                    placeholder="أدخل عنوان الرسالة..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    نص الرسالة
                  </label>
                  <textarea
                    rows={6}
                    placeholder="أدخل نص الرسالة..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex-1 px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'linear-gradient(145deg, #3AA17E, #2D8B6A)'
                    }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Send className="w-5 h-5" />
                      <span>إرسال الرسالة</span>
                    </div>
                  </button>
                  <button
                    className="px-6 py-3 rounded-xl font-bold text-gray-300 transition-all duration-300 hover:bg-white/5"
                    style={{
                      border: '2px solid rgba(75, 85, 99, 0.5)'
                    }}
                  >
                    حفظ كمسودة
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        )}

        {activeTab !== 'templates' && activeTab !== 'log' && (
          <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-400 mb-1">ملاحظة هامة</p>
              <p className="text-xs text-gray-400">
                هذا القسم في مرحلة التطوير. حالياً يدعم الرسائل داخل الموقع وواتساب فردي محدود.
                سيتم إضافة دعم SMS و WhatsApp API لاحقاً.
              </p>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
