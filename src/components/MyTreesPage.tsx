import { useState, useEffect } from 'react';
import { X, TreePine, TrendingUp, Calendar, MapPin, Droplets, Scissors, Sprout, Package, ChevronDown, ChevronUp, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserReservations,
  getTreeOperations,
  getUserTreesSummary,
  getOperationTypeLabel,
  type UserReservation,
  type TreeOperation,
  type UserTreesSummary
} from '../services/myTreesService';

interface MyTreesPageProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const operationIcons = {
  irrigation: Droplets,
  maintenance: Package,
  pruning: Scissors,
  harvest: Sprout
};

const operationColors = {
  irrigation: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  maintenance: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  pruning: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  harvest: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' }
};

export default function MyTreesPage({ isOpen, onClose, onLogin }: MyTreesPageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<UserReservation[]>([]);
  const [operations, setOperations] = useState<TreeOperation[]>([]);
  const [summary, setSummary] = useState<UserTreesSummary>({
    totalTrees: 0,
    totalFarms: 0,
    activeReservations: 0,
    recentOperations: 0
  });
  const [expandedOperations, setExpandedOperations] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  async function loadData() {
    setLoading(true);
    try {
      const [reservationsData, operationsData, summaryData] = await Promise.all([
        getUserReservations(),
        getTreeOperations(),
        getUserTreesSummary()
      ]);
      setReservations(reservationsData);
      setOperations(operationsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading my trees data:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleOperation(operationId: string) {
    setExpandedOperations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(operationId)) {
        newSet.delete(operationId);
      } else {
        newSet.add(operationId);
      }
      return newSet;
    });
  }

  function formatDate(dateString: string) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100000] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TreePine className="w-10 h-10 text-darkgreen" />
          </div>
          <h2 className="text-2xl font-bold text-darkgreen mb-3">متابعة أشجاري</h2>
          <p className="text-gray-600 mb-6">يجب تسجيل الدخول لعرض أشجارك ومتابعة العمليات الزراعية</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
            >
              إغلاق
            </button>
            <button
              onClick={() => {
                onClose();
                onLogin();
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-darkgreen to-green-600 hover:from-green-700 hover:to-green-700 text-white rounded-xl font-semibold transition-colors shadow-lg"
            >
              تسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100000] flex items-end lg:items-center justify-center">
      <div
        className="bg-white w-full lg:max-w-6xl lg:max-h-[90vh] lg:rounded-3xl shadow-2xl flex flex-col"
        style={{
          height: '100%',
          maxHeight: '100vh',
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem'
        }}
      >
        <div className="sticky top-0 z-20 bg-gradient-to-r from-darkgreen to-green-600 text-white px-6 py-5 flex items-center justify-between rounded-t-3xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TreePine className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">متابعة أشجاري</h2>
              <p className="text-sm text-white/80">جميع أشجارك والعمليات الزراعية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-darkgreen/20 border-t-darkgreen rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">جاري التحميل...</p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-200">
                  <TreePine className="w-8 h-8 text-darkgreen mb-2" />
                  <div className="text-3xl font-black text-darkgreen">{summary.totalTrees}</div>
                  <div className="text-sm text-gray-600 font-semibold">إجمالي الأشجار</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border-2 border-blue-200">
                  <MapPin className="w-8 h-8 text-blue-600 mb-2" />
                  <div className="text-3xl font-black text-blue-600">{summary.totalFarms}</div>
                  <div className="text-sm text-gray-600 font-semibold">عدد المزارع</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-200">
                  <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
                  <div className="text-3xl font-black text-purple-600">{summary.activeReservations}</div>
                  <div className="text-sm text-gray-600 font-semibold">الحجوزات النشطة</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border-2 border-amber-200">
                  <Droplets className="w-8 h-8 text-amber-600 mb-2" />
                  <div className="text-3xl font-black text-amber-600">{summary.recentOperations}</div>
                  <div className="text-sm text-gray-600 font-semibold">عمليات هذا الشهر</div>
                </div>
              </div>

              {reservations.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد حجوزات بعد</h3>
                  <p className="text-gray-600">ابدأ رحلتك الاستثمارية بحجز أشجارك الآن</p>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-xl font-bold text-darkgreen mb-4 flex items-center gap-2">
                      <TreePine className="w-6 h-6" />
                      حجوزاتي النشطة
                    </h3>
                    <div className="grid gap-4">
                      {reservations.map(reservation => (
                        <div
                          key={reservation.id}
                          className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-darkgreen/40 transition-colors"
                        >
                          <div className="flex flex-col lg:flex-row">
                            {reservation.farmImage && (
                              <div className="lg:w-48 h-40 lg:h-auto">
                                <img
                                  src={reservation.farmImage}
                                  alt={reservation.farmName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 p-5">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="text-xl font-bold text-darkgreen">{reservation.farmName}</h4>
                                  <p className="text-gray-600">{reservation.treeType}</p>
                                </div>
                                <div className="text-left">
                                  <div className="text-2xl font-black text-darkgreen">{reservation.treesCount}</div>
                                  <div className="text-sm text-gray-600">شجرة</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  <span>مدة العقد: {reservation.contractDuration} سنوات</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  <span>ينتهي: {formatDate(reservation.endDate)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {operations.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-darkgreen mb-4 flex items-center gap-2">
                        <Droplets className="w-6 h-6" />
                        العمليات الزراعية الأخيرة
                      </h3>
                      <div className="space-y-3">
                        {operations.map(operation => {
                          const Icon = operationIcons[operation.operationType] || Sprout;
                          const colors = operationColors[operation.operationType] || operationColors.maintenance;
                          const isExpanded = expandedOperations.has(operation.id);

                          return (
                            <div
                              key={operation.id}
                              className={`${colors.bg} border-2 ${colors.border} rounded-2xl overflow-hidden transition-all`}
                            >
                              <button
                                onClick={() => toggleOperation(operation.id)}
                                className="w-full p-4 flex items-center justify-between hover:bg-black/5 transition-colors"
                              >
                                <div className="flex items-center gap-3 text-right">
                                  <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center border-2 ${colors.border}`}>
                                    <Icon className={`w-6 h-6 ${colors.text}`} />
                                  </div>
                                  <div>
                                    <h4 className={`font-bold ${colors.text}`}>
                                      {getOperationTypeLabel(operation.operationType)} - {operation.farmName}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      {formatDate(operation.operationDate)} • {operation.treesCount} شجرة
                                    </p>
                                  </div>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className={`w-5 h-5 ${colors.text}`} />
                                ) : (
                                  <ChevronDown className={`w-5 h-5 ${colors.text}`} />
                                )}
                              </button>

                              {isExpanded && (
                                <div className="px-4 pb-4 space-y-3 border-t-2 border-gray-200/50 pt-3">
                                  {operation.statusReport && (
                                    <div>
                                      <h5 className="font-bold text-gray-700 mb-1">تقرير الحالة:</h5>
                                      <p className="text-gray-600 text-sm">{operation.statusReport}</p>
                                    </div>
                                  )}
                                  {operation.notes && (
                                    <div>
                                      <h5 className="font-bold text-gray-700 mb-1">ملاحظات:</h5>
                                      <p className="text-gray-600 text-sm">{operation.notes}</p>
                                    </div>
                                  )}
                                  {operation.media.length > 0 && (
                                    <div>
                                      <h5 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4" />
                                        الصور والفيديوهات:
                                      </h5>
                                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                        {operation.media.map((mediaItem, idx) => (
                                          <div key={idx} className="relative group">
                                            {mediaItem.type === 'photo' ? (
                                              <img
                                                src={mediaItem.url}
                                                alt={mediaItem.caption || ''}
                                                className="w-full h-24 object-cover rounded-lg border-2 border-gray-300"
                                              />
                                            ) : (
                                              <video
                                                src={mediaItem.url}
                                                className="w-full h-24 object-cover rounded-lg border-2 border-gray-300"
                                                controls
                                              />
                                            )}
                                            {mediaItem.caption && (
                                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                {mediaItem.caption}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
