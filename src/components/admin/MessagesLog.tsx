import React, { useState, useEffect } from 'react';
import { Mail, Eye, Users, Calendar, Search, Filter } from 'lucide-react';
import { investorMessagingService, InvestorMessageWithDetails } from '../../services/investorMessagingService';

interface MessageWithStats extends InvestorMessageWithDetails {
  read_rate: number;
}

export default function MessagesLog({ onViewMessage }: { onViewMessage: (messageId: string) => void }) {
  const [messages, setMessages] = useState<MessageWithStats[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<MessageWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [selectedSender, setSelectedSender] = useState<string>('all');

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [messages, searchTerm, selectedFarm, selectedSender]);

  async function loadMessages() {
    try {
      setLoading(true);
      const data = await investorMessagingService.getAllMessagesWithStats();
      setMessages(data);
      setFilteredMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterMessages() {
    let filtered = [...messages];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(term) ||
        m.content.toLowerCase().includes(term) ||
        m.farms?.name_ar?.toLowerCase().includes(term) ||
        m.admins?.full_name?.toLowerCase().includes(term)
      );
    }

    if (selectedFarm !== 'all') {
      filtered = filtered.filter(m => m.farm_id === selectedFarm);
    }

    if (selectedSender !== 'all') {
      filtered = filtered.filter(m => m.sender_id === selectedSender);
    }

    setFilteredMessages(filtered);
  }

  const uniqueFarms = Array.from(
    new Set(messages.map(m => m.farm_id))
  ).map(farmId => {
    const message = messages.find(m => m.farm_id === farmId);
    return {
      id: farmId,
      name: message?.farms?.name_ar || 'غير معروف'
    };
  });

  const uniqueSenders = Array.from(
    new Set(messages.map(m => m.sender_id))
  ).map(senderId => {
    const message = messages.find(m => m.sender_id === senderId);
    return {
      id: senderId,
      name: message?.admins?.full_name || message?.admins?.email || 'غير معروف'
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل سجل الرسائل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث في الرسائل..."
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={selectedFarm}
              onChange={(e) => setSelectedFarm(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">جميع المزارع</option>
              {uniqueFarms.map(farm => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </select>

            <select
              value={selectedSender}
              onChange={(e) => setSelectedSender(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">جميع المرسلين</option>
              {uniqueSenders.map(sender => (
                <option key={sender.id} value={sender.id}>
                  {sender.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <Filter className="w-4 h-4" />
          <span>
            عرض {filteredMessages.length} من {messages.length} رسالة
          </span>
        </div>
      </div>

      {filteredMessages.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            لا توجد رسائل
          </h3>
          <p className="text-gray-600">
            {searchTerm || selectedFarm !== 'all' || selectedSender !== 'all'
              ? 'لا توجد نتائج مطابقة للبحث'
              : 'لم يتم إرسال أي رسائل بعد'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => onViewMessage(message.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {message.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
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
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                          {message.admins.full_name || message.admins.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">
                {message.content}
              </p>

              <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">المستلمين</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {message.recipients_count}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Eye className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">قرأ</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {message.read_count} ({message.read_rate}%)
                    </p>
                  </div>
                </div>

                <div className="mr-auto">
                  <div className="w-full bg-gray-200 rounded-full h-2" style={{ width: '120px' }}>
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${message.read_rate}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">معدل القراءة</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
