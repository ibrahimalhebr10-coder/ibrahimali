import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  X,
  Calendar,
  MapPin,
  Trees,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle,
  PhoneCall,
  Save,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TreeVariety {
  type: string;
  count: number;
}

interface FarmOffer {
  id: string;
  reference_number: string;
  owner_name: string;
  phone: string;
  email: string | null;
  location: string;
  area_hectares: number | null;
  current_crop_type: string | null;
  tree_varieties: TreeVariety[];
  total_tree_count: number;
  has_legal_docs: string;
  offer_type: string;
  proposed_price: number | null;
  partnership_acknowledgment: boolean;
  additional_notes: string | null;
  status: string;
  admin_notes: string | null;
  submitted_at: string;
  last_updated_at: string;
}

const FarmOffersManager: React.FC = () => {
  const [offers, setOffers] = useState<FarmOffer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<FarmOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<FarmOffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [offerTypeFilter, setOfferTypeFilter] = useState<string>('all');
  const [newStatus, setNewStatus] = useState('');
  const [newAdminNotes, setNewAdminNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const statusOptions = [
    { value: 'under_review', label: 'قيد التقييم', color: 'blue', icon: Clock },
    { value: 'preliminary_accepted', label: 'قبول مبدئي', color: 'green', icon: CheckCircle },
    { value: 'contacted', label: 'تم التواصل', color: 'purple', icon: PhoneCall },
    { value: 'not_suitable', label: 'غير مناسب حاليًا', color: 'gray', icon: XCircle }
  ];

  const offerTypeOptions = [
    { value: 'sale', label: 'بيع' },
    { value: 'full_lease', label: 'إيجار كامل' },
    { value: 'partnership', label: 'مشاركة 30%' }
  ];

  const legalDocsOptions = [
    { value: 'yes', label: 'نعم، كاملة' },
    { value: 'partial', label: 'جزئية' },
    { value: 'no', label: 'لا توجد' }
  ];

  useEffect(() => {
    loadOffers();
  }, []);

  useEffect(() => {
    filterOffers();
  }, [offers, searchTerm, statusFilter, offerTypeFilter]);

  const loadOffers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('farm_offers')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error('Error loading farm offers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOffers = () => {
    let filtered = [...offers];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(offer =>
        offer.reference_number.toLowerCase().includes(term) ||
        offer.owner_name.toLowerCase().includes(term) ||
        offer.location.toLowerCase().includes(term) ||
        offer.phone.includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(offer => offer.status === statusFilter);
    }

    if (offerTypeFilter !== 'all') {
      filtered = filtered.filter(offer => offer.offer_type === offerTypeFilter);
    }

    setFilteredOffers(filtered);
  };

  const handleUpdateOffer = async () => {
    if (!selectedOffer) return;

    try {
      setIsSaving(true);
      const updates: any = {};

      if (newStatus && newStatus !== selectedOffer.status) {
        updates.status = newStatus;
      }

      if (newAdminNotes.trim() && newAdminNotes !== selectedOffer.admin_notes) {
        updates.admin_notes = newAdminNotes;
      }

      if (Object.keys(updates).length === 0) {
        return;
      }

      const { error } = await supabase
        .from('farm_offers')
        .update(updates)
        .eq('id', selectedOffer.id);

      if (error) throw error;

      await loadOffers();
      setSelectedOffer(null);
      setNewStatus('');
      setNewAdminNotes('');
    } catch (error) {
      console.error('Error updating offer:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const openOfferDetails = (offer: FarmOffer) => {
    setSelectedOffer(offer);
    setNewStatus(offer.status);
    setNewAdminNotes(offer.admin_notes || '');
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.color || 'gray';
  };

  const getStatusLabel = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.label || status;
  };

  const getStatusIcon = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.icon || Clock;
  };

  const getOfferTypeLabel = (type: string) => {
    const offerType = offerTypeOptions.find(t => t.value === type);
    return offerType?.label || type;
  };

  const getLegalDocsLabel = (value: string) => {
    const option = legalDocsOptions.find(o => o.value === value);
    return option?.label || value;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'غير محدد';
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-darkgreen border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل عروض المزارع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-darkgreen to-green-700 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">عروض المزارع</h1>
            <p className="text-green-100 text-sm mt-1">
              إدارة الطلبات الواردة من نموذج "اعرض مزرعتك"
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {statusOptions.map((status) => {
            const count = offers.filter(o => o.status === status.value).length;
            return (
              <div key={status.value} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-green-100 mt-1">{status.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث برقم المرجع، الاسم، الموقع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent appearance-none"
            >
              <option value="all">جميع الحالات</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          {/* Offer Type Filter */}
          <div className="relative">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={offerTypeFilter}
              onChange={(e) => setOfferTypeFilter(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent appearance-none"
            >
              <option value="all">جميع أنواع العروض</option>
              {offerTypeOptions.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Offers List */}
      <div className="grid gap-4">
        {filteredOffers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد عروض</h3>
            <p className="text-gray-600">لم يتم استقبال أي عروض حتى الآن</p>
          </div>
        ) : (
          filteredOffers.map((offer) => {
            const StatusIcon = getStatusIcon(offer.status);
            const statusColor = getStatusColor(offer.status);

            return (
              <div
                key={offer.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openOfferDetails(offer)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-darkgreen">
                        {offer.reference_number}
                      </span>
                      <span className={`
                        px-3 py-1 rounded-full text-xs font-semibold
                        ${statusColor === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                        ${statusColor === 'green' ? 'bg-green-100 text-green-700' : ''}
                        ${statusColor === 'purple' ? 'bg-purple-100 text-purple-700' : ''}
                        ${statusColor === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
                      `}>
                        <StatusIcon className="w-3 h-3 inline ml-1" />
                        {getStatusLabel(offer.status)}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {offer.owner_name}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span>{offer.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Trees className="w-4 h-4 text-green-600" />
                        <span>{offer.total_tree_count} شجرة</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span>{getOfferTypeLabel(offer.offer_type)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span>{formatDate(offer.submitted_at)}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Eye className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Offer Details Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-darkgreen to-green-700 p-6 text-white rounded-t-2xl flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedOffer.reference_number}</h2>
                  <p className="text-green-100 text-sm">تفاصيل العرض الكاملة</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOffer(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Owner Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-darkgreen" />
                  معلومات المالك
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">الاسم</label>
                    <p className="font-semibold text-gray-900">{selectedOffer.owner_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">رقم الهاتف</label>
                    <p className="font-semibold text-gray-900 direction-ltr text-right">
                      {selectedOffer.phone}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">البريد الإلكتروني</label>
                    <p className="font-semibold text-gray-900">
                      {selectedOffer.email || 'غير متوفر'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Farm Details */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Trees className="w-5 h-5 text-darkgreen" />
                  تفاصيل المزرعة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">الموقع</label>
                    <p className="font-semibold text-gray-900">{selectedOffer.location}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">المساحة (هكتار)</label>
                    <p className="font-semibold text-gray-900">
                      {selectedOffer.area_hectares || 'غير محدد'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">المحصول الحالي</label>
                    <p className="font-semibold text-gray-900">
                      {selectedOffer.current_crop_type || 'غير محدد'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">الوثائق القانونية</label>
                    <p className="font-semibold text-gray-900">
                      {getLegalDocsLabel(selectedOffer.has_legal_docs)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tree Varieties */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">أنواع الأشجار</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedOffer.tree_varieties.map((variety, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-sm text-gray-600">{variety.type}</p>
                      <p className="text-xl font-bold text-darkgreen">{variety.count}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">إجمالي الأشجار</p>
                  <p className="text-2xl font-bold text-darkgreen">{selectedOffer.total_tree_count}</p>
                </div>
              </div>

              {/* Offer Details */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">تفاصيل العرض</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">نوع العرض</label>
                    <p className="font-semibold text-gray-900">
                      {getOfferTypeLabel(selectedOffer.offer_type)}
                    </p>
                  </div>
                  {(selectedOffer.offer_type === 'sale' || selectedOffer.offer_type === 'full_lease') && (
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">السعر المقترح</label>
                      <p className="font-semibold text-gray-900">
                        {formatPrice(selectedOffer.proposed_price)}
                      </p>
                    </div>
                  )}
                  {selectedOffer.offer_type === 'partnership' && (
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">نسبة المشاركة</label>
                      <p className="font-semibold text-gray-900">
                        30% من إيرادات إيجارات المزارعين والمستثمرين
                      </p>
                    </div>
                  )}
                </div>
                {selectedOffer.additional_notes && (
                  <div className="mt-4">
                    <label className="text-sm text-gray-600 block mb-1">ملاحظات إضافية</label>
                    <p className="text-gray-900 bg-white rounded-lg p-3 border border-gray-200">
                      {selectedOffer.additional_notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-darkgreen" />
                  إجراءات الإدارة
                </h3>
                <div className="space-y-4">
                  {/* Status Update */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      تحديث الحالة
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
                    >
                      {statusOptions.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ملاحظات داخلية (غير مرئية للمستخدم)
                    </label>
                    <textarea
                      value={newAdminNotes}
                      onChange={(e) => setNewAdminNotes(e.target.value)}
                      rows={4}
                      placeholder="أضف ملاحظات داخلية..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Current Admin Notes */}
                  {selectedOffer.admin_notes && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <label className="text-sm text-gray-600 block mb-2">الملاحظات الحالية</label>
                      <p className="text-gray-900">{selectedOffer.admin_notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleUpdateOffer}
                      disabled={isSaving}
                      className="flex-1 bg-gradient-to-r from-darkgreen to-green-700 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>جاري الحفظ...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>حفظ التغييرات</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedOffer(null)}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold">تاريخ الإرسال:</span>
                    <span className="mr-2">{formatDate(selectedOffer.submitted_at)}</span>
                  </div>
                  <div>
                    <span className="font-semibold">آخر تحديث:</span>
                    <span className="mr-2">{formatDate(selectedOffer.last_updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmOffersManager;
