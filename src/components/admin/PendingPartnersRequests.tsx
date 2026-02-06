import { useState, useEffect } from 'react';
import { UserCheck, Clock, CheckCircle, XCircle, Bell, Phone, Mail, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PendingPartner {
  id: string;
  name: string;
  display_name: string;
  phone: string;
  email: string;
  status: 'pending' | 'active' | 'suspended';
  created_at: string;
  user_id: string;
}

export default function PendingPartnersRequests() {
  const [pendingPartners, setPendingPartners] = useState<PendingPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [newRequestsCount, setNewRequestsCount] = useState(0);

  useEffect(() => {
    loadPendingPartners();

    const channel = supabase
      .channel('pending-partners-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'influencer_partners'
        },
        (payload) => {
          console.log('Real-time update:', payload);

          if (payload.eventType === 'INSERT') {
            const newPartner = payload.new as PendingPartner;
            if (newPartner.status === 'pending') {
              setPendingPartners(prev => [newPartner, ...prev]);
              setNewRequestsCount(prev => prev + 1);

              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('طلب شريك نجاح جديد!', {
                  body: `${newPartner.display_name} - ${newPartner.name}`,
                  icon: '/logo.png'
                });
              }

              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBil+zfPTgjMGHm7A7+OZURE=');
              audio.play().catch(() => {});
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedPartner = payload.new as PendingPartner;
            setPendingPartners(prev =>
              prev.filter(p => p.id !== updatedPartner.id)
            );
          } else if (payload.eventType === 'DELETE') {
            setPendingPartners(prev =>
              prev.filter(p => p.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPendingPartners = async () => {
    try {
      setLoading(true);

      const { data: partnersData, error } = await supabase
        .from('influencer_partners')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!partnersData || partnersData.length === 0) {
        setPendingPartners([]);
        return;
      }

      const userIds = partnersData.map(p => p.user_id).filter(Boolean);

      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('id, email')
        .in('id', userIds);

      const emailMap = new Map(profilesData?.map(p => [p.id, p.email]) || []);

      const enrichedPartners = partnersData.map(partner => ({
        ...partner,
        email: emailMap.get(partner.user_id) || 'غير متوفر'
      }));

      setPendingPartners(enrichedPartners);
    } catch (error) {
      console.error('خطأ في تحميل الطلبات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (partnerId: string) => {
    try {
      setProcessingId(partnerId);

      const { error } = await supabase
        .from('influencer_partners')
        .update({ status: 'active' })
        .eq('id', partnerId);

      if (error) throw error;

      setPendingPartners(prev => prev.filter(p => p.id !== partnerId));

      alert('تم تفعيل الشريك بنجاح!');
    } catch (error) {
      console.error('خطأ في تفعيل الشريك:', error);
      alert('فشل تفعيل الشريك');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (partnerId: string) => {
    if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) return;

    try {
      setProcessingId(partnerId);

      const { error } = await supabase
        .from('influencer_partners')
        .update({ status: 'suspended' })
        .eq('id', partnerId);

      if (error) throw error;

      setPendingPartners(prev => prev.filter(p => p.id !== partnerId));

      alert('تم رفض الطلب');
    } catch (error) {
      console.error('خطأ في رفض الطلب:', error);
      alert('فشل رفض الطلب');
    } finally {
      setProcessingId(null);
    }
  };

  const clearNewRequestsCount = () => {
    setNewRequestsCount(0);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          <span className="mr-3 text-slate-600">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">طلبات شركاء النجاح الجديدة</h3>
              <p className="text-sm text-slate-600">قم بمراجعة وتفعيل الشركاء الجدد</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {newRequestsCount > 0 && (
              <div
                onClick={clearNewRequestsCount}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg cursor-pointer hover:bg-red-600 transition-all animate-pulse"
              >
                <Bell className="w-5 h-5" />
                <span className="font-bold">{newRequestsCount} جديد</span>
              </div>
            )}
            <div className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-bold">
              {pendingPartners.length} طلب معلق
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {pendingPartners.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-1">لا توجد طلبات معلقة</p>
            <p className="text-sm text-slate-500">جميع الطلبات تمت معالجتها</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingPartners.map((partner) => (
              <div
                key={partner.id}
                className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-5 border-2 border-slate-200 hover:border-amber-300 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-800">{partner.display_name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">اسم الشريك:</span>
                          <span className="text-sm font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                            {partner.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{partner.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{partner.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>
                          {new Date(partner.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span className="text-sm font-medium text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                        في انتظار الموافقة
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleApprove(partner.id)}
                      disabled={processingId === partner.id}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {processingId === partner.id ? 'جاري التفعيل...' : 'تفعيل'}
                    </button>
                    <button
                      onClick={() => handleReject(partner.id)}
                      disabled={processingId === partner.id}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                      <XCircle className="w-5 h-5" />
                      {processingId === partner.id ? 'جاري الرفض...' : 'رفض'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span>يتم تحديث القائمة تلقائياً عند وصول طلبات جديدة</span>
        </div>
      </div>
    </div>
  );
}
