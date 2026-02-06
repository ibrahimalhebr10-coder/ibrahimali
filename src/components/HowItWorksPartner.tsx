import { X, TreePine, Sprout, TrendingUp, User, Link as LinkIcon, CheckCircle, MessageCircle, ArrowRight } from 'lucide-react';

interface HowItWorksPartnerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowItWorksPartner({ isOpen, onClose }: HowItWorksPartnerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-4 backdrop-blur-xl" style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(236, 253, 245, 0.9) 100%)',
        borderBottom: '2px solid rgba(16, 185, 129, 0.15)',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
      }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl lg:text-2xl font-black text-emerald-900">
            كيف تعمل المنصة؟
          </h1>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
              border: '2px solid rgba(239, 68, 68, 0.2)'
            }}
          >
            <X className="w-5 h-5 text-red-600" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 pb-32">

        {/* Intro */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6" style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
            border: '3px solid rgba(16, 185, 129, 0.3)'
          }}>
            <TreePine className="w-10 h-10 text-emerald-600" strokeWidth={2} />
          </div>

          <h2 className="text-3xl lg:text-4xl font-black text-emerald-900 mb-4">
            الفكرة ببساطة
          </h2>

          <p className="text-lg lg:text-xl text-emerald-800 leading-relaxed max-w-2xl mx-auto">
            منصة تمكّن الناس من امتلاك أشجار حقيقية في مزارع موثوقة،
            <br />
            والحصول على حصة من منتجاتها سنوياً
          </p>
        </div>

        {/* Section 1: المسارات */}
        <div className="rounded-3xl p-8 mb-8" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(236, 253, 245, 0.8) 100%)',
          border: '2px solid rgba(16, 185, 129, 0.2)',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)'
        }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }}>
              <span className="text-2xl font-black text-white">1</span>
            </div>
            <h3 className="text-2xl font-black text-emerald-900">
              مساران للأشجار
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* المسار الزراعي */}
            <div className="rounded-2xl p-6" style={{
              background: 'linear-gradient(135deg, rgba(134, 239, 172, 0.15) 0%, rgba(74, 222, 128, 0.1) 100%)',
              border: '2px solid rgba(34, 197, 94, 0.3)'
            }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500">
                  <Sprout className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h4 className="text-xl font-black text-green-900">
                  الأشجار الخضراء
                </h4>
              </div>
              <p className="text-green-800 leading-relaxed mb-3">
                أنت تملك الشجرة كاملة، وتحصل على كل منتجاتها
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>ملكية دائمة للشجرة</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>حصة كاملة من الإنتاج سنوياً</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>للراغبين بالأثر الزراعي</span>
                </li>
              </ul>
            </div>

            {/* المسار الاستثماري */}
            <div className="rounded-2xl p-6" style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)',
              border: '2px solid rgba(245, 158, 11, 0.3)'
            }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500">
                  <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h4 className="text-xl font-black text-amber-900">
                  الأشجار الذهبية
                </h4>
              </div>
              <p className="text-amber-800 leading-relaxed mb-3">
                تشتري دورة استثمارية (3-5 سنوات) بعائد متوقع
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-amber-700">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>دورة استثمارية محددة</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-amber-700">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>عائد مالي متوقع في نهاية الدورة</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-amber-700">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>للراغبين بالعائد المالي</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 2: أين يدخل الرابط */}
        <div className="rounded-3xl p-8 mb-8" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(236, 253, 245, 0.8) 100%)',
          border: '2px solid rgba(16, 185, 129, 0.2)',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)'
        }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }}>
              <span className="text-2xl font-black text-white">2</span>
            </div>
            <h3 className="text-2xl font-black text-emerald-900">
              أين يُدخل اسمك أو رابطك؟
            </h3>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl p-6" style={{
              background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.6) 0%, rgba(209, 250, 229, 0.4) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.25)'
            }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)',
                  border: '2px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <User className="w-6 h-6 text-emerald-600" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-black text-emerald-900 mb-2">
                    في شاشة الحجز
                  </h4>
                  <p className="text-emerald-800 leading-relaxed mb-3">
                    عند اختيار المزرعة والأشجار، يظهر حقل اختياري:
                  </p>
                  <div className="rounded-xl p-4 bg-white/50 border-2 border-emerald-200">
                    <p className="text-sm text-emerald-700 mb-2 font-bold">مثال:</p>
                    <p className="text-emerald-900 font-semibold">
                      "من دلّك على المنصة؟ (اختياري)"
                    </p>
                    <p className="text-sm text-emerald-600 mt-2">
                      هنا يكتب اسمك أو رمزك
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{
              background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.6) 0%, rgba(209, 250, 229, 0.4) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.25)'
            }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)',
                  border: '2px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <LinkIcon className="w-6 h-6 text-emerald-600" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-black text-emerald-900 mb-2">
                    أو في رابط الدعوة
                  </h4>
                  <p className="text-emerald-800 leading-relaxed mb-3">
                    يمكنك مشاركة رابط خاص يحمل رمزك تلقائياً
                  </p>
                  <div className="rounded-xl p-4 bg-white/50 border-2 border-emerald-200">
                    <p className="text-sm text-emerald-700 mb-2 font-bold">مثال:</p>
                    <p className="text-xs text-emerald-600 break-all font-mono">
                      ashjari.com?ref=AHMED123
                    </p>
                    <p className="text-sm text-emerald-600 mt-2">
                      عند فتح هذا الرابط، رمزك يُسجّل تلقائياً
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: ماذا يحدث بعد الحجز */}
        <div className="rounded-3xl p-8 mb-8" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(236, 253, 245, 0.8) 100%)',
          border: '2px solid rgba(16, 185, 129, 0.2)',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)'
        }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }}>
              <span className="text-2xl font-black text-white">3</span>
            </div>
            <h3 className="text-2xl font-black text-emerald-900">
              ماذا يحدث بعد الحجز؟
            </h3>
          </div>

          <div className="space-y-4">
            {[
              { step: '1', text: 'الزبون يختار المزرعة ونوع الشجرة' },
              { step: '2', text: 'يدخل بياناته (اسم + جوال + رمزك إن وجد)' },
              { step: '3', text: 'يدفع المبلغ عبر الطرق المتاحة' },
              { step: '4', text: 'النظام يسجل الحجز باسم الزبون' },
              { step: '5', text: 'إذا أدخل رمزك: يُسجّل أثرك تلقائياً' },
              { step: '6', text: 'الزبون يستلم عقده وحسابه الخاص' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4 rounded-xl p-4" style={{
                background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.4) 0%, rgba(209, 250, 229, 0.3) 100%)',
                border: '2px solid rgba(16, 185, 129, 0.15)'
              }}>
                <div className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center bg-emerald-500">
                  <span className="text-sm font-black text-white">{item.step}</span>
                </div>
                <p className="text-emerald-900 font-semibold pt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: كيف تشرحها في 30 ثانية */}
        <div className="rounded-3xl p-8 mb-8" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
          border: '3px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)'
        }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }}>
              <MessageCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-emerald-900">
              كيف تشرحها في 30 ثانية؟
            </h3>
          </div>

          <div className="rounded-2xl p-6 bg-white/60 border-2 border-emerald-200">
            <p className="text-lg text-emerald-900 leading-relaxed font-semibold mb-4">
              "هذه منصة تخليك تملك أشجار حقيقية في مزارع موثوقة.
              <br />
              <br />
              اختار المزرعة ونوع الشجرة اللي تبغاه،
              <br />
              وكل سنة تجيك حصتك من الإنتاج.
              <br />
              <br />
              في مسار أخضر للملكية الدائمة،
              <br />
              ومسار ذهبي للاستثمار بعائد.
              <br />
              <br />
              ادخل الموقع واختار اللي يناسبك!"
            </p>
          </div>

          <div className="mt-6 rounded-xl p-4" style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
            border: '2px solid rgba(251, 191, 36, 0.3)'
          }}>
            <p className="text-sm text-amber-800 font-bold">
              💡 نصيحة: لا تطوّل الشرح، وجّه للموقع مباشرة حتى يشوف بنفسه
            </p>
          </div>
        </div>

        {/* Summary Box */}
        <div className="rounded-3xl p-8 mb-8" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.9) 100%)',
          boxShadow: '0 12px 32px rgba(16, 185, 129, 0.4)'
        }}>
          <h3 className="text-2xl font-black text-white mb-4 text-center">
            الخلاصة
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-white">
              <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <span className="font-semibold">المنصة تربط الناس بمزارع حقيقية</span>
            </li>
            <li className="flex items-start gap-3 text-white">
              <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <span className="font-semibold">مساران: أخضر للملكية، ذهبي للاستثمار</span>
            </li>
            <li className="flex items-start gap-3 text-white">
              <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <span className="font-semibold">رمزك يُدخل في شاشة الحجز أو في الرابط</span>
            </li>
            <li className="flex items-start gap-3 text-white">
              <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <span className="font-semibold">الشرح يكون بسيط ومباشر (30 ثانية)</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 backdrop-blur-xl z-20" style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(236, 253, 245, 0.95) 100%)',
        borderTop: '2px solid rgba(16, 185, 129, 0.2)',
        boxShadow: '0 -8px 24px rgba(16, 185, 129, 0.15)'
      }}>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onClose}
            className="w-full rounded-2xl py-4 px-6 font-black text-white text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
              border: '2px solid rgba(5, 150, 105, 0.5)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative flex items-center justify-center gap-3">
              <span>الدخول إلى حسابي</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:-translate-x-1" strokeWidth={3} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
