import { CheckCircle, Home, User, Sparkles, Calendar, Trees, Award } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FlexiblePaymentSuccessScreenProps {
  reservationId: string;
  farmName: string;
  treeCount: number;
  totalPrice: number;
  paymentDeadlineDays: number;
  onGoToHome: () => void;
  onGoToAccount: () => void;
}

export default function FlexiblePaymentSuccessScreen({
  reservationId,
  farmName,
  treeCount,
  totalPrice,
  paymentDeadlineDays,
  onGoToHome,
  onGoToAccount
}: FlexiblePaymentSuccessScreenProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 overflow-auto">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-green-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="relative min-h-screen flex items-center justify-center p-4 py-12">
        <div
          className={`max-w-4xl w-full transition-all duration-1000 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {/* البطاقة الرئيسية */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">

            {/* رأس البطاقة - أيقونة النجاح المتطورة */}
            <div className="relative bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 p-12 text-center overflow-hidden">
              {/* خلفية مزخرفة */}
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                  <div className="grid grid-cols-8 gap-4 h-full">
                    {[...Array(32)].map((_, i) => (
                      <div key={i} className="bg-white rounded-lg animate-pulse" style={{ animationDelay: `${i * 100}ms` }}></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* أيقونة النجاح الكبيرة */}
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-32 h-32 bg-white/20 backdrop-blur-md rounded-full mb-6 animate-bounce">
                  <CheckCircle className="w-20 h-20 text-white" strokeWidth={2.5} />
                </div>

                <h1 className="text-5xl font-black text-white mb-4 drop-shadow-lg">
                  مبارك! تم حجز أشجارك بنجاح
                </h1>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                  <p className="text-2xl text-white/95 font-bold">
                    أنت الآن جزء من رحلة استثمارية مميزة
                  </p>
                  <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                </div>

                <p className="text-lg text-white/90 max-w-2xl mx-auto">
                  نشكرك على ثقتك الغالية ونهنئك باختيارك الرائع
                </p>
              </div>
            </div>

            {/* محتوى البطاقة */}
            <div className="p-8 md:p-12 space-y-8">

              {/* معلومات الحجز - تصميم بطاقات أنيق */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* المزرعة */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200 transform hover:scale-105 transition-all duration-300 shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <Trees className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-emerald-900">المزرعة</h3>
                  </div>
                  <p className="text-2xl font-black text-emerald-700">{farmName}</p>
                </div>

                {/* عدد الأشجار */}
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 border-2 border-green-200 transform hover:scale-105 transition-all duration-300 shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-green-900">عدد الأشجار</h3>
                  </div>
                  <p className="text-2xl font-black text-green-700">{treeCount} شجرة</p>
                </div>

                {/* المبلغ الإجمالي */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border-2 border-teal-200 transform hover:scale-105 transition-all duration-300 shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-teal-900">المبلغ الإجمالي</h3>
                  </div>
                  <p className="text-2xl font-black text-teal-700">{totalPrice.toLocaleString('ar-SA')} ر.س</p>
                </div>
              </div>

              {/* معلومات الدفع المرن - بطاقة مميزة */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200 shadow-xl">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 text-right">
                    <h3 className="text-2xl font-black text-blue-900 mb-4">خطة الدفع المرنة</h3>
                    <div className="bg-white/80 rounded-xl p-5 border border-blue-200">
                      <p className="text-base text-blue-700 leading-relaxed">
                        سوف يكون الدفع متاحاً بعد اكتمال تأجير جميع أشجار المزرعة، بعدها سيتم التواصل معك لضم أشجارك إلى حسابك إن شاء الله.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* رقم الحجز المرجعي - تصميم متطور */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-6 border-2 border-gray-200 shadow-md">
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-600 mb-2">رقم الحجز المرجعي</p>
                  <div className="bg-white rounded-xl p-4 inline-block border-2 border-gray-300 shadow-inner">
                    <p className="text-2xl font-mono font-black text-gray-900 tracking-widest">{reservationId}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">احتفظ بهذا الرقم للمراجعة والاستفسارات</p>
                </div>
              </div>

              {/* الأزرار - تصميم مبتكر */}
              <div className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* زر الذهاب للحساب - الخيار الأساسي */}
                  <button
                    onClick={onGoToAccount}
                    className="group relative py-6 px-8 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white rounded-2xl font-black text-lg shadow-2xl hover:shadow-emerald-500/50 transform hover:scale-105 transition-all duration-300 overflow-hidden"
                  >
                    {/* تأثير الخلفية */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

                    <div className="relative flex items-center justify-center gap-3">
                      <User className="w-7 h-7" />
                      <span>الدخول إلى حسابي</span>
                    </div>

                    {/* بريق متحرك */}
                    <div className="absolute top-0 left-0 w-full h-full">
                      <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer"></div>
                    </div>
                  </button>

                  {/* زر العودة للرئيسية */}
                  <button
                    onClick={onGoToHome}
                    className="group py-6 px-8 bg-white text-emerald-700 border-3 border-emerald-600 rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-50 hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Home className="w-7 h-7" />
                      <span>العودة للواجهة الرئيسية</span>
                    </div>
                  </button>
                </div>

                {/* نصيحة مساعدة */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    يمكنك الدخول لحسابك في أي وقت لمتابعة حجزك وإتمام الدفع
                  </p>
                </div>
              </div>

              {/* رسالة ختامية عاطفية */}
              <div className="text-center pt-6 border-t-2 border-gray-100">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-full px-8 py-4 border-2 border-emerald-200">
                  <Trees className="w-6 h-6 text-emerald-600" />
                  <p className="text-lg font-bold text-emerald-800">
                    نتمنى لكم رحلة استثمارية موفقة ومثمرة
                  </p>
                  <Trees className="w-6 h-6 text-emerald-600" />
                </div>
              </div>

            </div>
          </div>

          {/* رسالة إضافية أسفل البطاقة */}
          <div className="mt-6 text-center">
            <p className="text-white/80 text-sm">
              في حال وجود أي استفسار، نحن دائماً في خدمتكم
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
