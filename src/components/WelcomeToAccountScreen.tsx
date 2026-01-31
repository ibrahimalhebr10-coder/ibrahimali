import { Sprout, ArrowLeft, UserPlus, TrendingUp, Shield } from 'lucide-react';

interface WelcomeToAccountScreenProps {
  onStartNow: () => void;
  onClose: () => void;
}

export default function WelcomeToAccountScreen({ onStartNow, onClose }: WelcomeToAccountScreenProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9f5f0 100%)' }}>
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="max-w-lg w-full space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-2xl border-3" style={{ borderColor: '#3AA17E' }}>
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center shadow-xl animate-pulse"
                  style={{
                    background: 'linear-gradient(135deg, #2F5233 0%, #3D6B42 50%, #2F5233 100%)'
                  }}
                >
                  <Sprout className="w-14 h-14 text-white" />
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-black" style={{ color: '#2F5233' }}>
                  مرحبًا بك في حصص زراعية
                </h1>
                <p className="text-xl font-bold" style={{ color: '#3AA17E' }}>
                  استثمر في الزراعة واربح من الأرض
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2" style={{ borderColor: '#3AA17E30' }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#3AA17E20' }}>
                    <UserPlus className="w-6 h-6" style={{ color: '#3AA17E' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2" style={{ color: '#2F5233' }}>
                      أنشئ حسابك الآن
                    </h3>
                    <p className="text-sm" style={{ color: '#666' }}>
                      سجّل حسابك وابدأ رحلتك الاستثمارية في الزراعة
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-blue-900 mb-2">
                      استثمر في الأشجار
                    </h3>
                    <p className="text-sm text-gray-600">
                      اختر مزرعتك واحجز أشجارك واستلم عوائدك السنوية
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border-2" style={{ borderColor: '#D4AF3750' }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#D4AF3720' }}>
                    <Shield className="w-6 h-6" style={{ color: '#D4AF37' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2" style={{ color: '#B8942F' }}>
                      استثمار آمن وموثوق
                    </h3>
                    <p className="text-sm text-gray-600">
                      تابع مزرعتك واستثمارك بشفافية كاملة
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                onClick={onStartNow}
                className="w-full py-4 rounded-2xl font-black text-lg text-white shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                style={{
                  background: 'linear-gradient(145deg, #3AA17E, #2F8B6B)'
                }}
              >
                <ArrowLeft className="w-6 h-6" />
                <span>ابدأ الآن</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl font-bold text-base transition-all active:scale-95"
                style={{
                  color: '#666',
                  background: '#f5f5f5'
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
