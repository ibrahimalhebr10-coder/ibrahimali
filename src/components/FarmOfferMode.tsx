import React, { useState, useEffect } from 'react';
import { X, Sprout, CheckCircle, MapPin, Phone, Mail, FileText, Home } from 'lucide-react';
import { useOfferMode } from '../contexts/OfferModeContext';
import { farmOfferService, type FarmOfferData, type FarmOffer } from '../services/farmOfferService';

type Stage = 'intro' | 'form' | 'success';

export default function FarmOfferMode() {
  const { exitOfferMode } = useOfferMode();
  const [stage, setStage] = useState<Stage>('intro');
  const [loading, setLoading] = useState(false);
  const [submittedOffer, setSubmittedOffer] = useState<FarmOffer | null>(null);
  const [acceptanceStats, setAcceptanceStats] = useState({ rate: 0, total: 0, accepted: 0 });

  const [formData, setFormData] = useState<FarmOfferData>({
    ownerName: '',
    phone: '',
    email: '',
    location: '',
    areaHectares: 0,
    currentCropType: '',
    hasLegalDocs: 'no',
    additionalNotes: ''
  });

  useEffect(() => {
    if (stage === 'intro') {
      const timer = setTimeout(() => {
        setStage('form');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  useEffect(() => {
    loadAcceptanceStats();
  }, []);

  const loadAcceptanceStats = async () => {
    const stats = await farmOfferService.getAcceptanceRate();
    setAcceptanceStats(stats);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await farmOfferService.submitOffer(formData);

    if (result.success && result.offer) {
      setSubmittedOffer(result.offer);
      setStage('success');
    } else {
      alert(result.error || 'حدث خطأ أثناء إرسال الطلب');
    }

    setLoading(false);
  };

  const handleExit = () => {
    exitOfferMode();
  };

  if (stage === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <div className="mb-8 animate-bounce">
            <Sprout className="w-24 h-24 text-green-600 mx-auto" />
          </div>

          <h1 className="text-4xl font-bold text-gray-800 mb-6">
            نحن نبحث عن مزارع استثنائية
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            نقوم بمراجعة كل عرض بعناية
          </p>

          <div className="flex justify-center gap-2 mb-8">
            <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-150"></div>
          </div>

          <p className="text-lg text-gray-500">
            تحضير النموذج...
          </p>
        </div>
      </div>
    );
  }

  if (stage === 'success' && submittedOffer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-green-100">
            <div className="text-center mb-8">
              <div className="mb-6">
                <CheckCircle className="w-20 h-20 text-green-600 mx-auto" />
              </div>

              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                تم استلام عرضك بنجاح
              </h1>

              <div className="inline-block bg-green-100 px-6 py-3 rounded-full mb-6">
                <p className="text-lg font-mono text-green-800">
                  رقم المرجع: {submittedOffer.reference_number}
                </p>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-green-300 to-transparent my-8"></div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-green-600" />
                ما التالي؟
              </h2>

              <div className="space-y-4">
                <div className="flex gap-4 p-4 bg-green-50 rounded-xl">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">المراجعة الأولية</h3>
                    <p className="text-sm text-gray-600">⏱️ 2-3 أيام عمل</p>
                    <p className="text-sm text-gray-700 mt-1">سنراجع بياناتك الأولية</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-amber-50 rounded-xl">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">التواصل الأولي</h3>
                    <p className="text-sm text-gray-600">📞 إن استوفيت المعايير الأولية</p>
                    <p className="text-sm text-gray-700 mt-1">سنتصل بك لتحديد موعد الزيارة</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-blue-50 rounded-xl">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">الزيارة الميدانية</h3>
                    <p className="text-sm text-gray-600">👨‍🌾 تقييم شامل للمزرعة</p>
                    <p className="text-sm text-gray-700 mt-1">تتم بالتنسيق معك</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-green-50 rounded-xl">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      4
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">القرار النهائي</h3>
                    <p className="text-sm text-gray-600">🤝 قبول أو رفض مع الأسباب</p>
                    <p className="text-sm text-gray-700 mt-1">شفافية كاملة في القرار</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-green-300 to-transparent my-8"></div>

            <div className="bg-green-50 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-gray-800 mb-4 text-center">💌 ستصلك رسالة تأكيد على:</h3>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <Mail className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-700">البريد الإلكتروني</p>
                </div>
                <div className="text-center">
                  <Phone className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-700">رقم الهاتف (WhatsApp)</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border-r-4 border-amber-500 rounded-lg p-4 mb-8">
              <p className="text-sm text-gray-700">
                💡 <span className="font-bold">نصيحة:</span> احتفظ برقم المرجع للمتابعة
              </p>
            </div>

            <button
              onClick={handleExit}
              className="w-full bg-gradient-to-l from-green-600 to-green-700 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-green-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sprout className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-800">FARMVEST</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-green-700 bg-green-100 px-4 py-2 rounded-full">
              وضع العرض
            </span>

            <button
              onClick={handleExit}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 py-12">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-green-100">
          <div className="text-center mb-8">
            <div className="mb-6">
              <Sprout className="w-16 h-16 text-green-600 mx-auto" />
            </div>

            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              هل تملك مزرعة استثنائية؟
            </h1>

            <p className="text-xl text-gray-600 mb-2">
              نحن نبحث عن شركاء زراعيين متميزين
            </p>
            <p className="text-lg text-gray-500">
              لإضافتهم إلى منصة FARMVEST
            </p>

            <div className="h-px bg-gradient-to-r from-transparent via-green-300 to-transparent my-8"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">معايير صارمة للجودة</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">عقود شفافة وعادلة</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">شراكة طويلة الأمد</p>
            </div>
          </div>

          <div className="bg-amber-50 border-r-4 border-amber-500 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-gray-800 mb-4">⚠️ ملاحظة مهمة:</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• نقبل حالياً <span className="font-bold text-green-700">مزارع محدودة</span> فقط هذا الربع</p>
              {acceptanceStats.total > 0 && (
                <p>• معدل القبول: <span className="font-bold text-green-700">{acceptanceStats.rate.toFixed(0)}%</span> من الطلبات</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">📝 نموذج التقديم الأولي</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الاسم الكامل *
              </label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="أدخل اسمك الكامل"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف *
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="+966 XX XXX XXXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني (اختياري)
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                موقع المزرعة (المدينة/المنطقة) *
              </label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="مثال: الرياض - الخرج"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المساحة الإجمالية (هكتار) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.1"
                value={formData.areaHectares || ''}
                onChange={(e) => setFormData({ ...formData, areaHectares: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="مثال: 10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الزراعة الحالية
              </label>
              <select
                value={formData.currentCropType}
                onChange={(e) => setFormData({ ...formData, currentCropType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                <option value="">اختر نوع الزراعة</option>
                <option value="زيتون">زيتون</option>
                <option value="نخيل">نخيل</option>
                <option value="حمضيات">حمضيات</option>
                <option value="خضروات">خضروات</option>
                <option value="محاصيل حقلية">محاصيل حقلية</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                هل تملك توثيق قانوني كامل؟ *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hasLegalDocs"
                    value="yes"
                    checked={formData.hasLegalDocs === 'yes'}
                    onChange={(e) => setFormData({ ...formData, hasLegalDocs: e.target.value as 'yes' | 'no' | 'partial' })}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">نعم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hasLegalDocs"
                    value="no"
                    checked={formData.hasLegalDocs === 'no'}
                    onChange={(e) => setFormData({ ...formData, hasLegalDocs: e.target.value as 'yes' | 'no' | 'partial' })}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">لا</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hasLegalDocs"
                    value="partial"
                    checked={formData.hasLegalDocs === 'partial'}
                    onChange={(e) => setFormData({ ...formData, hasLegalDocs: e.target.value as 'yes' | 'no' | 'partial' })}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">جزئي</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات إضافية (اختياري)
              </label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                placeholder="أي معلومات إضافية تود إضافتها..."
              />
            </div>

            <div className="bg-blue-50 border-r-4 border-blue-500 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                ⚠️ <span className="font-bold">ملاحظة:</span> هذا تقديم أولي فقط. سيتم التواصل معك لترتيب زيارة ميدانية إن استوفيت المعايير الأولية.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-l from-green-600 to-green-700 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري الإرسال...' : 'تقديم العرض الآن'}
            </button>

            <p className="text-center text-sm text-gray-500">
              🔒 بياناتك محمية ولن تُستخدم إلا للتقييم
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
