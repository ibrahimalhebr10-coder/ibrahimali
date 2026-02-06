import { useEffect, useState } from 'react';
import { CheckCircle, Home, TreePine, FileText, Sparkles, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PaymentSuccessPageProps {
  reservationId: string;
  onViewMyTrees: () => void;
  onGoHome: () => void;
}

interface ReservationDetails {
  farmName: string;
  treeCount: number;
  treeType: string;
  totalPrice: number;
  pathType: 'agricultural' | 'investment';
  contractStartDate: string;
  contractDuration: number;
}

export default function PaymentSuccessPage({ reservationId, onViewMyTrees, onGoHome }: PaymentSuccessPageProps) {
  const { user } = useAuth();
  const [details, setDetails] = useState<ReservationDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservationDetails();
    linkReservationToAccount();
  }, []);

  const loadReservationDetails = async () => {
    try {
      const { data: reservation, error } = await supabase
        .from('reservations')
        .select(`
          *,
          farms(name_ar),
          reservation_items(variety_name, type_name, quantity)
        `)
        .eq('id', reservationId)
        .single();

      if (error) throw error;

      const firstItem = reservation.reservation_items?.[0];
      const treeType = firstItem
        ? `${firstItem.variety_name || firstItem.type_name}`
        : 'شجرة';

      setDetails({
        farmName: reservation.farms?.name_ar || 'المزرعة',
        treeCount: reservation.tree_count || 0,
        treeType,
        totalPrice: reservation.total_price || 0,
        pathType: reservation.path_type || 'agricultural',
        contractStartDate: reservation.contract_start_date || new Date().toISOString(),
        contractDuration: reservation.contract_duration || 0
      });
    } catch (error) {
      console.error('Error loading reservation details:', error);
    } finally {
      setLoading(false);
    }
  };

  const linkReservationToAccount = async () => {
    if (!user) return;

    try {
      await supabase
        .from('reservations')
        .update({
          user_id: user.id,
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', reservationId);
    } catch (error) {
      console.error('Error linking reservation:', error);
    }
  };

  if (loading || !details) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-green-200 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-40 animate-pulse"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle className="w-16 h-16 text-white animate-scale-in" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-6 mb-3 animate-fade-in-up animation-delay-200">
            تم الدفع بنجاح!
          </h1>
          <p className="text-xl text-gray-600 animate-fade-in-up animation-delay-400">
            مبروك! تم تأكيد حجزك
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-green-100 animate-fade-in-up animation-delay-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <TreePine className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">تفاصيل الحجز</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">المزرعة</span>
                <span className="font-bold text-gray-900">{details.farmName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">نوع الشجرة</span>
                <span className="font-bold text-gray-900">{details.treeType}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">عدد الأشجار</span>
                <span className="font-bold text-green-600">{details.treeCount}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">مدة العقد</span>
                <span className="font-bold text-gray-900">{details.contractDuration} سنة</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-green-100 animate-fade-in-up animation-delay-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">تفاصيل الدفع</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">المبلغ المدفوع</span>
                <span className="font-bold text-gray-900">{details.totalPrice.toLocaleString()} ر.س</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">حالة الدفع</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  مكتمل
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">تاريخ بدء العقد</span>
                <span className="font-bold text-gray-900">
                  {new Date(details.contractStartDate).toLocaleDateString('ar-SA')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">رقم الحجز</span>
                <span className="font-mono text-sm text-gray-900">{reservationId.slice(0, 8)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-2xl p-6 md:p-8 text-white mb-8 animate-fade-in-up animation-delay-1000">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">ماذا بعد؟</h3>
              <ul className="space-y-2 text-green-50">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  تم إضافة أشجارك إلى قسم "محصولي"
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  يمكنك متابعة نمو أشجارك وحصادها
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  ستصلك إشعارات عند جاهزية الحصاد
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  العقد ساري المفعول من تاريخ اليوم
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 animate-fade-in-up animation-delay-1200">
          <button
            onClick={onViewMyTrees}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <TreePine className="w-6 h-6" />
            عرض محصولي
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={onGoHome}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-gray-200"
          >
            <Home className="w-6 h-6" />
            العودة للرئيسية
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }

        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.6s ease-out forwards;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
          opacity: 0;
        }

        .animation-delay-800 {
          animation-delay: 0.8s;
          opacity: 0;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
          opacity: 0;
        }

        .animation-delay-1200 {
          animation-delay: 1.2s;
          opacity: 0;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
