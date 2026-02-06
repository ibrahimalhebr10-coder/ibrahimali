import { Sparkles, TreePine, Users, TrendingUp, Rocket, ArrowLeft } from 'lucide-react';

interface SuccessPartnerWelcomeProps {
  isOpen: boolean;
  onExplore: () => void;
}

export default function SuccessPartnerWelcome({ isOpen, onExplore }: SuccessPartnerWelcomeProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      <div className="min-h-screen relative flex items-center justify-center px-4 py-12" style={{
        background: 'linear-gradient(135deg, rgba(250, 252, 251, 1) 0%, rgba(245, 250, 247, 1) 50%, rgba(248, 252, 250, 1) 100%)'
      }}>
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(5, 150, 105, 0.08) 0%, transparent 50%)
          `
        }}></div>

        <div className="max-w-2xl w-full space-y-8 relative animate-fadeIn">
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-200 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                <div className="relative w-32 h-32 rounded-full flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)',
                  border: '3px solid rgba(16, 185, 129, 0.4)'
                }}>
                  <Sparkles className="w-16 h-16 text-emerald-600" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-black text-emerald-900 leading-tight">
                مرحبًا بك كشريك نجاح 🌿
              </h1>

              <p className="text-xl lg:text-2xl text-emerald-800/90 leading-relaxed font-bold">
                قبل أن تبدأ، تعرّف كيف تعمل المنصة
              </p>

              <p className="text-lg lg:text-xl text-emerald-700/80 leading-relaxed">
                حتى تستطيع شرحها وإقناع من حولك
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
            <div className="rounded-2xl p-6" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(236, 253, 245, 0.8) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.2)',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.1)'
            }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                  border: '2px solid rgba(16, 185, 129, 0.25)'
                }}>
                  <TreePine className="w-6 h-6 text-emerald-600" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-emerald-900 mb-2">
                    فهم المنصة
                  </h3>
                  <p className="text-sm text-emerald-700/80 leading-relaxed">
                    تعرّف على كيف يملك الناس أشجارهم ويحققون دخلاً منها
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(236, 253, 245, 0.8) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.2)',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.1)'
            }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                  border: '2px solid rgba(16, 185, 129, 0.25)'
                }}>
                  <Users className="w-6 h-6 text-emerald-600" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-emerald-900 mb-2">
                    شرح واضح
                  </h3>
                  <p className="text-sm text-emerald-700/80 leading-relaxed">
                    تعلّم كيف تشرح الفكرة بطريقة مقنعة وسهلة
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(236, 253, 245, 0.8) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.2)',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.1)'
            }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                  border: '2px solid rgba(16, 185, 129, 0.25)'
                }}>
                  <TrendingUp className="w-6 h-6 text-emerald-600" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-emerald-900 mb-2">
                    تأثير حقيقي
                  </h3>
                  <p className="text-sm text-emerald-700/80 leading-relaxed">
                    افهم كيف يتحول كل شخص تدعوه إلى جزء من أثرك
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(236, 253, 245, 0.8) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.2)',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.1)'
            }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                  border: '2px solid rgba(16, 185, 129, 0.25)'
                }}>
                  <Rocket className="w-6 h-6 text-emerald-600" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-emerald-900 mb-2">
                    بداية صحيحة
                  </h3>
                  <p className="text-sm text-emerald-700/80 leading-relaxed">
                    ابدأ رحلتك بثقة ووعي كامل بدورك
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6 mt-8" style={{
            background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.6) 0%, rgba(209, 250, 229, 0.5) 100%)',
            border: '2px solid rgba(16, 185, 129, 0.25)',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)'
          }}>
            <p className="text-center text-sm text-emerald-800 leading-relaxed font-bold">
              ⚡ دقيقتان فقط من التعلم ستجعلك تشارك بثقة واحترافية
            </p>
          </div>

          <button
            onClick={onExplore}
            className="w-full rounded-2xl py-5 px-6 font-black text-white text-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
              border: '2px solid rgba(5, 150, 105, 0.5)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative flex items-center justify-center gap-3">
              <span>اعرف كيف تعمل المنصة</span>
              <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" strokeWidth={3} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
