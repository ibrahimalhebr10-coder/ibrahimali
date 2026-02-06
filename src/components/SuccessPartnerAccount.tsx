import { X, User, LogOut, Sparkles, Award, Shield, UserX, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import InfluencerDashboard from './InfluencerDashboard';
import { deviceRecognitionService } from '../services/deviceRecognitionService';
import { supabase } from '../lib/supabase';
import { impersonationService } from '../services/impersonationService';

interface SuccessPartnerAccountProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessPartnerAccount({ isOpen, onClose }: SuccessPartnerAccountProps) {
  const { user, signOut, isTrustedDevice } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isPartner, setIsPartner] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonationData, setImpersonationData] = useState<any>(null);

  useEffect(() => {
    console.log('');
    console.log('🎭'.repeat(50));
    console.log('🎭 [SuccessPartnerAccount] Component useEffect triggered');
    console.log('🎭 isOpen:', isOpen);
    console.log('🎭 user:', user?.id || 'NO USER');
    console.log('🎭'.repeat(50));
    console.log('');

    if (isOpen && user) {
      console.log('✅ [SuccessPartnerAccount] isOpen=true AND user exists - calling checkPartnerStatus');
      checkPartnerStatus();
    } else if (isOpen && !user) {
      console.log('⚠️ [SuccessPartnerAccount] isOpen=true BUT NO user');
      setIsPartner(false);
      setLoading(false);
    } else {
      console.log('❌ [SuccessPartnerAccount] isOpen=false - component will not render');
    }
  }, [isOpen, user]);

  const checkPartnerStatus = async () => {
    if (!user) {
      console.log('🔍 [SuccessPartnerAccount] No user - setting isPartner to false');
      setIsPartner(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check for impersonation first
      const impersonation = impersonationService.getImpersonationData();
      if (impersonation) {
        console.log('');
        console.log('🎭'.repeat(50));
        console.log('🎭 [SuccessPartnerAccount] IMPERSONATION DETECTED!');
        console.log('🎭 Partner ID:', impersonation.partnerId);
        console.log('🎭 Partner Name:', impersonation.partnerName);
        console.log('🎭 Admin User ID:', impersonation.adminUserId);
        console.log('🎭'.repeat(50));
        console.log('');

        setImpersonationData(impersonation);

        // Get partner data
        const partnerData = await impersonationService.getImpersonatedPartnerData(impersonation.partnerId);
        if (partnerData) {
          console.log('✅ [SuccessPartnerAccount] Impersonated partner data loaded:', partnerData);
          setIsPartner(true);
          setLoading(false);
          return;
        } else {
          console.error('❌ [SuccessPartnerAccount] Failed to load impersonated partner data');
        }
      }

      // Normal partner check
      console.log('🔍 [SuccessPartnerAccount] Checking partner status for user:', user.id);

      const { data, error } = await supabase
        .from('influencer_partners')
        .select('id, is_active, status, name')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [SuccessPartnerAccount] Error checking partner status:', error);
      }

      if (data) {
        console.log('✅ [SuccessPartnerAccount] Active partner found:', {
          id: data.id,
          name: data.name,
          status: data.status,
          is_active: data.is_active
        });
      } else {
        console.log('⚠️ [SuccessPartnerAccount] No active partner record found');
      }

      setIsPartner(!!data);
    } catch (err) {
      console.error('❌ [SuccessPartnerAccount] Error in checkPartnerStatus:', err);
      setIsPartner(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    console.log('🚫 [SuccessPartnerAccount] isOpen is FALSE - returning null (component not visible)');
    return null;
  }

  console.log('');
  console.log('🟢'.repeat(50));
  console.log('🟢 [SuccessPartnerAccount] Component IS RENDERING');
  console.log('🟢 isOpen:', isOpen);
  console.log('🟢 loading:', loading);
  console.log('🟢 isPartner:', isPartner);
  console.log('🟢 user:', user?.id || 'NO USER');
  console.log('🟢'.repeat(50));
  console.log('');

  const handleSignOut = async (fullLogout: boolean = false) => {
    await signOut(fullLogout);
    setShowLogoutModal(false);
    setShowProfileMenu(false);
    onClose();
  };

  const handleLogoutClick = () => {
    if (isTrustedDevice) {
      setShowLogoutModal(true);
      setShowProfileMenu(false);
    } else {
      handleSignOut(false);
    }
  };

  const handleExitImpersonation = () => {
    console.log('');
    console.log('🔴'.repeat(50));
    console.log('🔴 [SuccessPartnerAccount] Exiting impersonation mode');
    console.log('🔴'.repeat(50));
    console.log('');

    impersonationService.stopImpersonation();

    // Redirect to admin dashboard
    window.location.href = '/admin';
  };

  if (loading) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-md z-50"
          onClick={onClose}
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-600">جاري التحميل...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!user || !isPartner) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-md z-50"
          onClick={onClose}
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl transform transition-all scale-100">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="text-center mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-6 shadow-xl relative">
                <Sparkles className="w-12 h-12 text-white" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-400 rounded-full flex items-center justify-center animate-bounce">
                  <Award className="w-5 h-5 text-emerald-900" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">حساب شريك النجاح</h2>
              <p className="text-gray-600">
                {!user ? 'سجل الدخول لمتابعة مكافآتك وأثرك' : 'انضم كشريك نجاح واكسب المكافآت'}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">1</span>
                </div>
                <p className="text-sm text-gray-700 text-right flex-1">سجل الدخول لحسابك</p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">2</span>
                </div>
                <p className="text-sm text-gray-700 text-right flex-1">
                  شارك اسمك الخاص
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">3</span>
                </div>
                <p className="text-sm text-gray-700 text-right flex-1">
                  اكسب المكافآت عند كل حجز
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>ابدأ الآن</span>
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-amber-50 via-white to-emerald-50">
        <div className="bg-white/80 backdrop-blur-md border-b border-amber-200 sticky top-0 z-20">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              <h1 className="text-xl font-bold text-amber-900">حساب شريك النجاح</h1>

              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg"
              >
                <User className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {impersonationData && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800 py-3">
            <div className="max-w-2xl mx-auto px-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <AlertTriangle className="w-5 h-5 text-yellow-300 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm text-right">
                      وضع الإدارة: أنت تشاهد حساب {impersonationData.partnerName}
                    </p>
                    <p className="text-blue-200 text-xs text-right">
                      جميع البيانات هي للشريك المحدد
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExitImpersonation}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>الخروج</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {showProfileMenu && (
          <div className="absolute top-16 left-4 bg-white rounded-2xl shadow-2xl border border-amber-200 p-2 z-30 min-w-[200px]">
            <div className="p-3 border-b border-amber-100">
              <p className="font-bold text-amber-900 text-sm text-right">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-amber-600 text-right">{user.email}</p>
            </div>
            <button
              onClick={handleLogoutClick}
              className="w-full p-3 flex items-center gap-2 hover:bg-red-50 rounded-xl transition-colors text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-bold flex-1 text-right">تسجيل الخروج</span>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pb-32">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="space-y-6">
              <div
                className="rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16"></div>

                <div className="relative z-10 text-center">
                  <div className="relative inline-block mb-4">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl"
                      style={{ background: 'rgba(255,255,255,0.2)' }}
                    >
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-lg">
                      <span className="text-base">⭐</span>
                    </div>
                  </div>

                  <div
                    className="inline-block px-5 py-1.5 rounded-full mb-3"
                    style={{ background: 'rgba(255,255,255,0.2)' }}
                  >
                    <span className="text-base font-bold">
                      شريك مسيرة
                    </span>
                  </div>

                  <h2 className="text-xl font-bold mb-1">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </h2>

                  <p className="text-sm opacity-90">
                    نشر المنصة وكسب المكافآت
                  </p>
                </div>
              </div>

              <InfluencerDashboard />

              <div className="text-center text-gray-500 text-sm py-6">
                <p>استمر في النشر واكسب المزيد</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />

          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative z-10 transform scale-100 animate-in">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">تسجيل الخروج</h3>
              <p className="text-sm text-gray-600">اختر طريقة الخروج المناسبة لك</p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleSignOut(false)}
                className="w-full p-5 rounded-2xl border-2 border-gray-200 hover:border-amber-500 transition-all group text-right"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500 transition-colors">
                    <LogOut className="w-6 h-6 text-amber-600 group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">خروج عادي</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      ابقى مسجلاً على هذا الجهاز وعد بدون إعادة الدخول
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSignOut(true)}
                className="w-full p-5 rounded-2xl border-2 border-gray-200 hover:border-red-500 transition-all group text-right"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500 transition-colors">
                    <UserX className="w-6 h-6 text-red-600 group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">خروج كامل</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      احذف بياناتي من هذا الجهاز وسأحتاج لإعادة الدخول
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowLogoutModal(false)}
              className="w-full py-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors font-bold text-gray-700"
            >
              إلغاء
            </button>

            {deviceRecognitionService.isTrustedDevice() && (
              <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-xs text-blue-800 text-center">
                  هذا الجهاز محفوظ كجهاز موثوق
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
