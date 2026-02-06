import { TreePine, Sparkles, ArrowRight } from 'lucide-react';

interface DualAccountSelectorProps {
  onSelectRegular: () => void;
  onSelectPartner: () => void;
}

export default function DualAccountSelector({ onSelectRegular, onSelectPartner }: DualAccountSelectorProps) {
  return (
    <div className="fixed inset-0 z-[60000] bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl rounded-3xl p-8 animate-fadeIn" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(236, 253, 245, 0.95) 100%)',
          boxShadow: '0 20px 60px rgba(16, 185, 129, 0.2)',
          border: '2px solid rgba(16, 185, 129, 0.2)'
        }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <span className="text-3xl">🌿</span>
            </div>
            <h2 className="text-3xl font-black text-emerald-900 mb-2">
              اختر حسابك
            </h2>
            <p className="text-emerald-700 font-semibold">
              لديك حسابان، أي منهما تريد الدخول إليه؟
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Regular Account */}
            <button
              onClick={onSelectRegular}
              className="group rounded-3xl p-8 transition-all duration-300 hover:scale-105 active:scale-95 text-right"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.08) 100%)',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
              }}
            >
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110" style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}>
                  <TreePine className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black text-emerald-900 mb-2">
                  حسابي
                </h3>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                  <p className="text-emerald-800 font-semibold text-sm">متابعة أشجاري</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                  <p className="text-emerald-800 font-semibold text-sm">الصيانة والرسوم</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                  <p className="text-emerald-800 font-semibold text-sm">الإنتاج والأرباح</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 pt-4 border-t-2 border-emerald-200">
                <span className="text-emerald-900 font-black text-lg">الدخول</span>
                <ArrowRight className="w-5 h-5 text-emerald-700 transition-transform duration-300 group-hover:-translate-x-1" />
              </div>
            </button>

            {/* Card 2: Success Partner Account */}
            <button
              onClick={onSelectPartner}
              className="group rounded-3xl p-8 transition-all duration-300 hover:scale-105 active:scale-95 text-right"
              style={{
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.08) 100%)',
                border: '2px solid rgba(251, 191, 36, 0.3)',
                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)'
              }}
            >
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110" style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}>
                  <Sparkles className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black text-amber-900 mb-2">
                  شريك النجاح
                </h3>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                  <p className="text-amber-800 font-semibold text-sm">متابعة أثرك</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                  <p className="text-amber-800 font-semibold text-sm">عدد الأشجار المكتسبة</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                  <p className="text-amber-800 font-semibold text-sm">النشر والمشاركة</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 pt-4 border-t-2 border-amber-200">
                <span className="text-amber-900 font-black text-lg">الدخول كشريك نجاح</span>
                <ArrowRight className="w-5 h-5 text-amber-700 transition-transform duration-300 group-hover:-translate-x-1" />
              </div>
            </button>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-emerald-700 leading-relaxed">
              💡 يمكنك التبديل بين الحسابين في أي وقت من زر "حسابي"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
