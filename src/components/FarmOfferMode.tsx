import React, { useState, useEffect } from 'react';
import { X, Sprout, CheckCircle, MapPin, Phone, Mail, FileText, Home, Plus, Trash2 } from 'lucide-react';
import { useOfferMode } from '../contexts/OfferModeContext';
import { farmOfferService, type FarmOfferData, type FarmOffer, type TreeVariety } from '../services/farmOfferService';

type Stage = 'intro' | 'form' | 'success';
type OfferType = 'sale' | 'full_lease' | 'partnership';

const TREE_TYPES = ['زيتون', 'نخيل', 'حمضيات', 'تفاح', 'رمان', 'عنب', 'لوز', 'أخرى'];

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
    treeVarieties: [{ type: '', count: 0 }],
    hasLegalDocs: 'no',
    offerType: 'sale',
    proposedPrice: undefined,
    partnershipAcknowledgment: false,
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

    const hasEmptyVariety = formData.treeVarieties.some(v => !v.type || v.count <= 0);
    if (hasEmptyVariety) {
      alert('يجب إدخال نوع الأشجار وعددها لجميع الأنواع المضافة');
      return;
    }

    if (getTotalTreeCount() === 0) {
      alert('يجب إضافة عدد من الأشجار');
      return;
    }

    if (formData.offerType === 'partnership' && !formData.partnershipAcknowledgment) {
      alert('يجب الموافقة على إقرار المشاركة للمتابعة');
      return;
    }

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

  const handleOfferTypeChange = (type: OfferType) => {
    setFormData({
      ...formData,
      offerType: type,
      proposedPrice: undefined,
      partnershipAcknowledgment: type === 'partnership' ? false : undefined
    });
  };

  const addTreeVariety = () => {
    setFormData({
      ...formData,
      treeVarieties: [...formData.treeVarieties, { type: '', count: 0 }]
    });
  };

  const removeTreeVariety = (index: number) => {
    if (formData.treeVarieties.length > 1) {
      setFormData({
        ...formData,
        treeVarieties: formData.treeVarieties.filter((_, i) => i !== index)
      });
    }
  };

  const updateTreeVariety = (index: number, field: 'type' | 'count', value: string | number) => {
    const newVarieties = [...formData.treeVarieties];
    if (field === 'type') {
      newVarieties[index].type = value as string;
    } else {
      newVarieties[index].count = parseInt(value as string) || 0;
    }
    setFormData({
      ...formData,
      treeVarieties: newVarieties
    });
  };

  const getTotalTreeCount = () => {
    return formData.treeVarieties.reduce((sum, variety) => sum + variety.count, 0);
  };

  if (stage === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <div className="mb-8 animate-bounce">
            <Sprout className="w-24 h-24 text-green-600 mx-auto" />
          </div>

          <h1 className="text-4xl font-bold text-gray-800 mb-6">
            نستقبل عروض المزارع
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
        <div className="max-w-4xl mx-auto p-6 py-12">
          <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-green-100">
            <div className="text-center mb-8">
              <div className="mb-6">
                <CheckCircle className="w-20 h-20 text-green-600 mx-auto" />
              </div>

              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                تم استلام عرض مزرعتك بنجاح
              </h1>

              <div className="inline-block bg-green-100 px-6 py-3 rounded-full mb-6">
                <p className="text-lg font-mono text-green-800">
                  رقم المرجع: {submittedOffer.reference_number}
                </p>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-green-300 to-transparent my-8"></div>
            </div>

            <div className="bg-blue-50 border-r-4 border-blue-500 rounded-lg p-6 mb-8">
              <p className="text-base text-gray-800 leading-relaxed">
                في حال القبول المبدئي، سيتم التواصل معك هاتفيًا بعد اعتماد الإدارة.
              </p>
            </div>

            <div className="bg-amber-50 border-r-4 border-amber-500 rounded-lg p-4 mb-8">
              <p className="text-sm text-gray-700">
                <span className="font-bold">ملاحظة مهمة:</span> احتفظ برقم المرجع للمتابعة
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

      <div className="max-w-4xl mx-auto p-6 py-8 mb-8">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-green-100">
          <div className="text-center mb-8">
            <div className="mb-6">
              <Sprout className="w-16 h-16 text-green-600 mx-auto" />
            </div>

            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              اعرض مزرعتك
            </h1>

            <p className="text-xl text-gray-600 mb-4">
              نستقبل عروض مزارع للبيع، الإيجار الكامل، أو المشاركة
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
              <p className="text-sm text-gray-700 leading-relaxed">
                جميع العروض يتم تقييمها من الإدارة، ولا يترتب عليها أي التزام حتى القبول المبدئي.
              </p>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-green-300 to-transparent my-8"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">نموذج التقديم</h2>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  أنواع الأشجار في المزرعة *
                </label>
                <button
                  type="button"
                  onClick={addTreeVariety}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-all text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  إضافة نوع آخر
                </button>
              </div>

              <div className="space-y-3">
                {formData.treeVarieties.map((variety, index) => (
                  <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          نوع الشجرة
                        </label>
                        <select
                          required
                          value={variety.type}
                          onChange={(e) => updateTreeVariety(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                        >
                          <option value="">اختر النوع</option>
                          {TREE_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          العدد
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={variety.count || ''}
                          onChange={(e) => updateTreeVariety(index, 'count', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                          placeholder="مثال: 200"
                        />
                      </div>
                    </div>
                    {formData.treeVarieties.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTreeVariety(index)}
                        className="mt-6 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="حذف هذا النوع"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {getTotalTreeCount() > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-bold text-green-800">
                    إجمالي عدد الأشجار: <span className="text-lg">{getTotalTreeCount()}</span> شجرة
                  </p>
                </div>
              )}
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-6"></div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">معلومات المزرعة</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                موقع المزرعة (المنطقة / المدينة) *
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
                حالة المزرعة (التوثيق القانوني) *
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
                  <span className="text-sm text-gray-700">مكتملة</span>
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
                  <span className="text-sm text-gray-700">جزئية</span>
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
                  <span className="text-sm text-gray-700">غير موثقة</span>
                </label>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-6"></div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">معلومات المالك</h3>
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

            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-6"></div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                نوع العرض *
              </label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-green-500 transition-all">
                  <input
                    type="radio"
                    name="offerType"
                    value="sale"
                    checked={formData.offerType === 'sale'}
                    onChange={() => handleOfferTypeChange('sale')}
                    className="w-5 h-5 text-green-600 focus:ring-green-500 mt-0.5"
                  />
                  <div>
                    <span className="text-base font-medium text-gray-800">بيع</span>
                    <p className="text-sm text-gray-600 mt-1">بيع المزرعة بالكامل</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-green-500 transition-all">
                  <input
                    type="radio"
                    name="offerType"
                    value="full_lease"
                    checked={formData.offerType === 'full_lease'}
                    onChange={() => handleOfferTypeChange('full_lease')}
                    className="w-5 h-5 text-green-600 focus:ring-green-500 mt-0.5"
                  />
                  <div>
                    <span className="text-base font-medium text-gray-800">إيجار كامل</span>
                    <p className="text-sm text-gray-600 mt-1">تأجير المزرعة بالكامل</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-green-500 transition-all">
                  <input
                    type="radio"
                    name="offerType"
                    value="partnership"
                    checked={formData.offerType === 'partnership'}
                    onChange={() => handleOfferTypeChange('partnership')}
                    className="w-5 h-5 text-green-600 focus:ring-green-500 mt-0.5"
                  />
                  <div>
                    <span className="text-base font-medium text-gray-800">مشاركة</span>
                    <p className="text-sm text-gray-600 mt-1">الدخول بمزرعتي بمشاركتها مع المنصة</p>
                  </div>
                </label>
              </div>
            </div>

            {(formData.offerType === 'sale' || formData.offerType === 'full_lease') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  السعر المقترح (ريال سعودي) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.proposedPrice || ''}
                  onChange={(e) => setFormData({ ...formData, proposedPrice: parseFloat(e.target.value) || undefined })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder={formData.offerType === 'sale' ? 'مثال: 500000' : 'مثال: 50000 (سنوياً)'}
                />
              </div>
            )}

            {formData.offerType === 'partnership' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border-r-4 border-blue-500 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-800">
                    نسبة المشاركة المعتمدة: 30% من إيرادات إيجارات المزارعين والمستثمرين
                  </p>
                </div>

                <label className="flex items-start gap-3 p-4 border-2 border-green-200 bg-green-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={formData.partnershipAcknowledgment || false}
                    onChange={(e) => setFormData({ ...formData, partnershipAcknowledgment: e.target.checked })}
                    className="w-5 h-5 text-green-600 focus:ring-green-500 rounded mt-0.5"
                  />
                  <span className="text-sm text-gray-800 leading-relaxed">
                    أقر بأن مشاركتي تقتصر على العائد المالي من إيرادات الإيجارات فقط، وأن التشغيل والإدارة بالكامل للمنصة.
                  </span>
                </label>
              </div>
            )}

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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-l from-green-600 to-green-700 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري الإرسال...' : 'تقديم العرض'}
            </button>

            <p className="text-center text-sm text-gray-500">
              بياناتك محمية ولن تُستخدم إلا للتقييم
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
