import { X, Handshake, Heart, TreePine, Users, Sparkles, ArrowLeft } from 'lucide-react';

interface SuccessPartnerIntroProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscover: () => void;
}

export default function SuccessPartnerIntro({ isOpen, onClose, onDiscover }: SuccessPartnerIntroProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      <div className="min-h-screen relative" style={{
        background: 'linear-gradient(135deg, rgba(250, 252, 251, 1) 0%, rgba(245, 250, 247, 1) 50%, rgba(248, 252, 250, 1) 100%)'
      }}>
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(5, 150, 105, 0.06) 0%, transparent 50%)
          `
        }}></div>

        <div className="sticky top-0 z-10 backdrop-blur-xl border-b border-emerald-200/50" style={{
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 252, 251, 0.95) 100%)'
        }}>
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{
                background: 'linear-gradient(145deg, rgba(239, 246, 255, 0.95) 0%, rgba(229, 242, 251, 0.9) 100%)',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
                border: '2px solid rgba(16, 185, 129, 0.2)'
              }}
            >
              <X className="w-5 h-5 text-emerald-700" strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                border: '2px solid rgba(16, 185, 129, 0.3)'
              }}>
                <Handshake className="w-5 h-5 text-emerald-700" strokeWidth={2.5} />
              </div>
              <h1 className="text-lg font-black text-emerald-800">شريك النجاح</h1>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 pb-24 relative">
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-200 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                  <div className="relative w-24 h-24 rounded-full flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)',
                    border: '3px solid rgba(16, 185, 129, 0.4)'
                  }}>
                    <Handshake className="w-12 h-12 text-emerald-700" strokeWidth={2} />
                  </div>
                </div>
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-emerald-900 leading-tight">
                من هو شريك النجاح؟
              </h2>
              <p className="text-lg lg:text-xl text-emerald-800/80 leading-relaxed max-w-2xl mx-auto">
                هو شخص يؤمن بأن النجاح الحقيقي يبدأ حين نساعد الآخرين على تحقيق أحلامهم
              </p>
            </div>

            <div className="rounded-3xl p-6 lg:p-8 space-y-6" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(247, 254, 251, 0.85) 100%)',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              border: '2px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                  border: '2px solid rgba(16, 185, 129, 0.25)'
                }}>
                  <Heart className="w-6 h-6 text-emerald-700" strokeWidth={2.5} />
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-xl lg:text-2xl font-black text-emerald-900">لماذا أطلقت المنصة هذا الدور؟</h3>
                  <p className="text-base lg:text-lg text-emerald-800/80 leading-relaxed">
                    لأننا نؤمن أن كل شخص لديه دائرة تأثير، صديق يثق برأيك، زميل يستمع لنصيحتك، قريب يحترم خبرتك.
                  </p>
                  <p className="text-base lg:text-lg text-emerald-800/80 leading-relaxed">
                    أردنا أن نحول هذا التأثير الطبيعي إلى أثر حقيقي، دون أن نطلب منك أن تصبح مسوّقاً أو بائعاً.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-6 lg:p-8 space-y-6" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(247, 254, 251, 0.85) 100%)',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              border: '2px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                  border: '2px solid rgba(16, 185, 129, 0.25)'
                }}>
                  <Users className="w-6 h-6 text-emerald-700" strokeWidth={2.5} />
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-xl lg:text-2xl font-black text-emerald-900">ما الذي يقدمه الشريك؟</h3>
                  <p className="text-base lg:text-lg text-emerald-800/80 leading-relaxed">
                    ببساطة: يشارك تجربته مع من يثق بهم. يخبرهم كيف بدأ رحلته مع المنصة، كيف اختار أشجاره، ماذا تعلم.
                  </p>
                  <p className="text-base lg:text-lg text-emerald-800/80 leading-relaxed">
                    لا نطلب منه نصوصاً جاهزة، ولا عروضاً مبالغ فيها. فقط أن يكون صادقاً وطبيعياً.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-6 lg:p-8 space-y-6" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(247, 254, 251, 0.85) 100%)',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              border: '2px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                  border: '2px solid rgba(16, 185, 129, 0.25)'
                }}>
                  <TreePine className="w-6 h-6 text-emerald-700" strokeWidth={2.5} />
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-xl lg:text-2xl font-black text-emerald-900">ماذا يكسب الشريك؟</h3>
                  <div className="space-y-2">
                    <p className="text-base lg:text-lg text-emerald-800/80 leading-relaxed">
                      <span className="font-bold text-emerald-900">أولاً:</span> الأثر الحقيقي - كل من يبدأ رحلته بفضل كلمتك، يصبح جزءاً من أثرك.
                    </p>
                    <p className="text-base lg:text-lg text-emerald-800/80 leading-relaxed">
                      <span className="font-bold text-emerald-900">ثانياً:</span> أشجار باسمك - نزرع لك أشجاراً مقابل كل شخص ساعدته على البدء، دون أن تدفع شيئاً.
                    </p>
                    <p className="text-base lg:text-lg text-emerald-800/80 leading-relaxed">
                      <span className="font-bold text-emerald-900">ثالثاً:</span> الانتماء - تصبح جزءاً من مجتمع يؤمن بقوة التأثير الإيجابي.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-6 lg:p-8 space-y-6" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(247, 254, 251, 0.85) 100%)',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              border: '2px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                  border: '2px solid rgba(16, 185, 129, 0.25)'
                }}>
                  <Sparkles className="w-6 h-6 text-emerald-700" strokeWidth={2.5} />
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-xl lg:text-2xl font-black text-emerald-900">لماذا لا يحتاج رأس مال؟</h3>
                  <p className="text-base lg:text-lg text-emerald-800/80 leading-relaxed">
                    لأن دورك ليس تجارياً. أنت لا تشتري أشجاراً وتبيعها. أنت فقط تشارك قصتك الشخصية.
                  </p>
                  <p className="text-base lg:text-lg text-emerald-800/80 leading-relaxed">
                    نحن من يزرع الأشجار لك، كتقدير لأثرك، وكشكر على ثقة الآخرين بك.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 text-center space-y-4">
              <div className="w-16 h-1 mx-auto rounded-full" style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.4) 50%, transparent 100%)'
              }}></div>
              <p className="text-lg lg:text-xl text-emerald-800/70 leading-relaxed max-w-2xl mx-auto italic">
                "شريك النجاح لا يبيع.. بل يشارك. لا يقنع.. بل يلهم. لا يكسب مالاً.. بل يزرع أثراً."
              </p>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t border-emerald-200/50 z-20" style={{
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 252, 251, 0.95) 100%)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button
              onClick={onDiscover}
              className="w-full rounded-2xl py-4 px-6 font-black text-white text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
                border: '2px solid rgba(5, 150, 105, 0.5)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative flex items-center justify-center gap-3">
                <span>اكتشف دورك كشريك نجاح</span>
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" strokeWidth={3} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
