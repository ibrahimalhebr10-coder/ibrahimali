import React, { useState, useEffect } from 'react';
import { Send, Users, MessageSquare, TrendingUp, Eye, Mail, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { investorMessagingService } from '../../services/investorMessagingService';
import CreateInvestorMessage from './CreateInvestorMessage';
import SupervisorDashboard from './SupervisorDashboard';
import MessagesLog from './MessagesLog';
import MessageDetails from './MessageDetails';

interface Farm {
  id: string;
  name_ar: string;
  name_en: string;
  location?: string;
  status: string;
}

interface FarmWithStats extends Farm {
  investors_count: number;
  messages_count: number;
  last_message_date?: string;
}

type View = 'farms' | 'supervisor' | 'messages-log' | 'message-details';

export default function InvestorMessaging() {
  const [farms, setFarms] = useState<FarmWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarm, setSelectedFarm] = useState<FarmWithStats | null>(null);
  const [showCreateMessage, setShowCreateMessage] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentView, setCurrentView] = useState<View>('farms');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  useEffect(() => {
    loadFarms();
  }, []);

  async function loadFarms() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: admin } = await supabase
        .from('admins')
        .select('id, role_id, admin_roles!inner(role_key)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!admin) return;

      const isSuperAdminUser = admin.admin_roles.role_key === 'super_admin';
      setIsSuperAdmin(isSuperAdminUser);

      let farmsQuery = supabase
        .from('farms')
        .select('*')
        .eq('status', 'completed')
        .order('name_ar');

      if (!isSuperAdminUser) {
        const { data: assignments } = await supabase
          .from('admin_farm_assignments')
          .select('farm_id')
          .eq('admin_id', admin.id)
          .eq('is_active', true);

        const farmIds = (assignments || []).map(a => a.farm_id);

        if (farmIds.length === 0) {
          setFarms([]);
          setLoading(false);
          return;
        }

        farmsQuery = farmsQuery.in('id', farmIds);
      }

      const { data: farmsData } = await farmsQuery;

      if (!farmsData || farmsData.length === 0) {
        setFarms([]);
        setLoading(false);
        return;
      }

      const farmsWithStats = await Promise.all(
        farmsData.map(async (farm) => {
          const [investorsResult, messagesResult] = await Promise.all([
            supabase
              .from('reservations')
              .select('id', { count: 'exact', head: true })
              .eq('farm_id', farm.id)
              .eq('status', 'paid'),

            supabase
              .from('investor_messages')
              .select('sent_at')
              .eq('farm_id', farm.id)
              .order('sent_at', { ascending: false })
              .limit(1)
          ]);

          return {
            ...farm,
            investors_count: investorsResult.count || 0,
            messages_count: messagesResult.data?.length || 0,
            last_message_date: messagesResult.data?.[0]?.sent_at
          };
        })
      );

      setFarms(farmsWithStats);
    } catch (error) {
      console.error('Error loading farms:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSendMessage(farm: FarmWithStats) {
    setSelectedFarm(farm);
    setShowCreateMessage(true);
  }

  function handleMessageSent() {
    setShowCreateMessage(false);
    setSelectedFarm(null);
    loadFarms();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (showCreateMessage && selectedFarm) {
    return (
      <CreateInvestorMessage
        farm={selectedFarm}
        onBack={() => {
          setShowCreateMessage(false);
          setSelectedFarm(null);
        }}
        onMessageSent={handleMessageSent}
      />
    );
  }

  if (currentView === 'supervisor' && isSuperAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentView('farms')}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            إرسال الرسائل
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
          >
            لوحة الإشراف
          </button>
          <button
            onClick={() => setCurrentView('messages-log')}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            سجل الرسائل
          </button>
        </div>
        <SupervisorDashboard />
      </div>
    );
  }

  if (currentView === 'messages-log' && isSuperAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentView('farms')}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            إرسال الرسائل
          </button>
          <button
            onClick={() => setCurrentView('supervisor')}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            لوحة الإشراف
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
          >
            سجل الرسائل
          </button>
        </div>
        <MessagesLog
          onViewMessage={(id) => {
            setSelectedMessageId(id);
            setCurrentView('message-details');
          }}
        />
      </div>
    );
  }

  if (currentView === 'message-details' && selectedMessageId && isSuperAdmin) {
    return (
      <MessageDetails
        messageId={selectedMessageId}
        onBack={() => {
          setSelectedMessageId(null);
          setCurrentView('messages-log');
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {isSuperAdmin && (
        <div className="flex gap-3">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium"
          >
            إرسال الرسائل
          </button>
          <button
            onClick={() => setCurrentView('supervisor')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            لوحة الإشراف
          </button>
          <button
            onClick={() => setCurrentView('messages-log')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            سجل الرسائل
          </button>
        </div>
      )}

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-start gap-4">
          <div className="bg-green-600 text-white p-3 rounded-lg">
            <Mail className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              مراسلة المستثمرين
            </h2>
            <p className="text-gray-600">
              أرسل تحديثات دورية للمستثمرين في مزارعك. كل رسالة تصل فقط لمستثمري المزرعة المحددة.
            </p>
          </div>
        </div>
      </div>

      {farms.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            لا توجد مزارع
          </h3>
          <p className="text-gray-600">
            {isSuperAdmin
              ? 'لا توجد مزارع مكتملة حالياً'
              : 'لم يتم تعيين أي مزارع لك بعد. يرجى التواصل مع المدير العام.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => (
            <div
              key={farm.id}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {farm.name_ar}
                  </h3>
                  {farm.location && (
                    <p className="text-sm text-gray-600">{farm.location}</p>
                  )}
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                  مكتملة
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-600">المستثمرون</p>
                    <p className="font-semibold text-gray-900">
                      {farm.investors_count} مستثمر
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-600">الرسائل المرسلة</p>
                    <p className="font-semibold text-gray-900">
                      {farm.messages_count} رسالة
                    </p>
                  </div>
                </div>

                {farm.last_message_date && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-gray-600">آخر رسالة</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(farm.last_message_date).toLocaleDateString('ar-SA', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleSendMessage(farm)}
                disabled={farm.investors_count === 0}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" />
                إرسال تحديث
              </button>

              {farm.investors_count === 0 && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  لا يوجد مستثمرون في هذه المزرعة
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-start gap-3">
          <Eye className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900 space-y-2">
            <p className="font-semibold">ملاحظات هامة:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>كل رسالة تُرسل فقط لمستثمري المزرعة المحددة</li>
              <li>الرسائل تصل عبر الإشعارات داخل المنصة</li>
              <li>يمكنك إرفاق صور من المزرعة مع الرسالة</li>
              <li>يتم إنشاء ملخص تلقائي من بيانات المزرعة</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
