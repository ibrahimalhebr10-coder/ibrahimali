import { useState, useEffect } from 'react';
import {
  X, TreePine, TrendingUp, Calendar, MapPin, Droplets, Scissors, Sprout,
  Package, ChevronDown, ChevronUp, AlertCircle, Coins, Leaf, Rocket,
  BarChart3, ShoppingBag, Recycle, Plus, ArrowUpRight, FileText,
  TrendingDown, CheckCircle, Clock, Zap
} from 'lucide-react';
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

type MainTab = 'investment' | 'agricultural';
type InvestmentSubTab = 'assets' | 'products' | 'waste' | 'expansion' | 'reports';

const operationIcons = {
  irrigation: Droplets,
  maintenance: Package,
  pruning: Scissors,
  harvest: Sprout
};

const operationColors = {
  irrigation: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  maintenance: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  pruning: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
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
  const [mainTab, setMainTab] = useState<MainTab>('investment');
  const [investmentSubTab, setInvestmentSubTab] = useState<InvestmentSubTab>('assets');

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

  function getTreeTypeDistribution() {
    const distribution: { [key: string]: number } = {};
    reservations.forEach(res => {
      distribution[res.treeType] = (distribution[res.treeType] || 0) + res.treesCount;
    });
    return Object.entries(distribution).map(([type, count]) => ({ type, count }));
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
          <p className="text-gray-600 mb-6">يجب تسجيل الدخول لعرض أشجارك ومتابعة استثماراتك</p>
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
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-darkgreen to-green-600 text-white px-6 py-4 rounded-t-3xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <TreePine className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">متابعة أشجاري</h2>
                <p className="text-sm text-white/80">لوحة الأصول الزراعية</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setMainTab('investment')}
              className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${
                mainTab === 'investment'
                  ? 'bg-white text-darkgreen shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              الاستثماري
            </button>
            <button
              className="flex-1 px-6 py-3 rounded-xl font-bold bg-white/10 text-white/40 cursor-not-allowed relative"
              disabled
            >
              الزراعي
              <span className="absolute -top-2 -left-2 bg-yellow-400 text-darkgreen text-xs px-2 py-1 rounded-full font-bold">
                قريبًا
              </span>
            </button>
          </div>
        </div>

        {/* Investment Sub-Tabs */}
        {mainTab === 'investment' && (
          <div className="sticky top-[120px] lg:top-[136px] z-10 bg-white border-b-2 border-gray-200 px-4 overflow-x-auto">
            <div className="flex gap-2 py-3 min-w-max">
              <button
                onClick={() => setInvestmentSubTab('assets')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  investmentSubTab === 'assets'
                    ? 'bg-darkgreen text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <TreePine className="w-4 h-4" />
                أصولي الزراعية
              </button>
              <button
                onClick={() => setInvestmentSubTab('products')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  investmentSubTab === 'products'
                    ? 'bg-darkgreen text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                عوائد المنتجات
              </button>
              <button
                onClick={() => setInvestmentSubTab('waste')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  investmentSubTab === 'waste'
                    ? 'bg-darkgreen text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Recycle className="w-4 h-4" />
                عوائد المخلفات
              </button>
              <button
                onClick={() => setInvestmentSubTab('expansion')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  investmentSubTab === 'expansion'
                    ? 'bg-darkgreen text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Rocket className="w-4 h-4" />
                فرص التوسعة
              </button>
              <button
                onClick={() => setInvestmentSubTab('reports')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  investmentSubTab === 'reports'
                    ? 'bg-darkgreen text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                التقارير الذكية
              </button>
            </div>
          </div>
        )}

        {/* Content */}
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
              {mainTab === 'investment' && investmentSubTab === 'assets' && (
                <AssetsTab
                  reservations={reservations}
                  summary={summary}
                  getTreeTypeDistribution={getTreeTypeDistribution}
                  formatDate={formatDate}
                />
              )}

              {mainTab === 'investment' && investmentSubTab === 'products' && (
                <ProductsTab reservations={reservations} />
              )}

              {mainTab === 'investment' && investmentSubTab === 'waste' && (
                <WasteTab reservations={reservations} />
              )}

              {mainTab === 'investment' && investmentSubTab === 'expansion' && (
                <ExpansionTab reservations={reservations} summary={summary} />
              )}

              {mainTab === 'investment' && investmentSubTab === 'reports' && (
                <ReportsTab
                  reservations={reservations}
                  summary={summary}
                  operations={operations}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AssetsTab({
  reservations,
  summary,
  getTreeTypeDistribution,
  formatDate
}: {
  reservations: UserReservation[];
  summary: UserTreesSummary;
  getTreeTypeDistribution: () => { type: string; count: number }[];
  formatDate: (date: string) => string;
}) {
  const treeDistribution = getTreeTypeDistribution();

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-2xl">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد أصول بعد</h3>
        <p className="text-gray-600">ابدأ رحلتك الاستثمارية بحجز أصولك الزراعية</p>
      </div>
    );
  }

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-200">
          <TreePine className="w-8 h-8 text-darkgreen mb-2" />
          <div className="text-3xl font-black text-darkgreen">{summary.totalTrees}</div>
          <div className="text-sm text-gray-600 font-semibold">إجمالي الوحدات</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border-2 border-blue-200">
          <MapPin className="w-8 h-8 text-blue-600 mb-2" />
          <div className="text-3xl font-black text-blue-600">{summary.totalFarms}</div>
          <div className="text-sm text-gray-600 font-semibold">عدد المواقع</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border-2 border-orange-200">
          <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
          <div className="text-3xl font-black text-orange-600">{summary.activeReservations}</div>
          <div className="text-sm text-gray-600 font-semibold">العقود النشطة</div>
        </div>
        <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-5 border-2 border-cyan-200">
          <Zap className="w-8 h-8 text-cyan-600 mb-2" />
          <div className="text-3xl font-black text-cyan-600">{summary.recentOperations}</div>
          <div className="text-sm text-gray-600 font-semibold">عمليات نشطة</div>
        </div>
      </div>

      {/* Tree Distribution */}
      <div>
        <h3 className="text-xl font-bold text-darkgreen mb-4 flex items-center gap-2">
          <Leaf className="w-6 h-6" />
          توزيع الأصول حسب النوع
        </h3>
        <div className="grid gap-3">
          {treeDistribution.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border-2 border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-darkgreen/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                  <TreePine className="w-6 h-6 text-darkgreen" />
                </div>
                <div>
                  <div className="font-bold text-darkgreen">{item.type}</div>
                  <div className="text-sm text-gray-600">نوع الشجرة</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-darkgreen">{item.count}</div>
                <div className="text-sm text-gray-600">وحدة</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Contracts */}
      <div>
        <h3 className="text-xl font-bold text-darkgreen mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          العقود النشطة
        </h3>
        <div className="grid gap-4">
          {reservations.map(reservation => (
            <div
              key={reservation.id}
              className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-darkgreen/40 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-bold text-darkgreen">{reservation.farmName}</h4>
                  <p className="text-gray-600">{reservation.treeType}</p>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-black text-darkgreen">{reservation.treesCount}</div>
                  <div className="text-sm text-gray-600">وحدة</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700">مدة: {reservation.contractDuration} سنوات</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700">ينتهي: {formatDate(reservation.endDate)}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-700">نشط</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ProductsTab({ reservations }: { reservations: UserReservation[] }) {
  const products = [
    { name: 'زيتون طازج', produced: '245 كجم', sold: '200 كجم', revenue: '3,200', status: 'completed' },
    { name: 'زيت زيتون', produced: '45 لتر', sold: '40 لتر', revenue: '8,000', status: 'completed' },
    { name: 'زيتون مخلل', produced: '120 كجم', sold: '95 كجم', revenue: '2,850', status: 'in-progress' },
  ];

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-2xl">
        <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد منتجات بعد</h3>
        <p className="text-gray-600">ستظهر المنتجات بعد بدء الإنتاج من أشجارك</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShoppingBag className="w-8 h-8 text-blue-600" />
          <h3 className="text-2xl font-bold text-blue-900">ملخص المنتجات</h3>
        </div>
        <p className="text-gray-700 leading-relaxed">
          عوائد المنتجات من أصولك الزراعية. يتم تحديث البيانات بناءً على العمليات المكتملة.
        </p>
      </div>

      <div>
        <h3 className="text-xl font-bold text-darkgreen mb-4">المنتجات المنتجة</h3>
        <div className="space-y-3">
          {products.map((product, idx) => (
            <div
              key={idx}
              className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-darkgreen/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-darkgreen" />
                  </div>
                  <div>
                    <h4 className="font-bold text-darkgreen">{product.name}</h4>
                    <div className="text-sm text-gray-600">تم إنتاج: {product.produced}</div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  product.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {product.status === 'completed' ? 'مكتمل' : 'جاري البيع'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
                <div>
                  <div className="text-sm text-gray-600">تم البيع</div>
                  <div className="font-bold text-darkgreen">{product.sold}</div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-600">القيمة</div>
                  <div className="font-bold text-darkgreen">{product.revenue} ر.س</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600 mb-1">إجمالي العوائد</div>
          <div className="text-3xl font-black text-darkgreen">14,050 ر.س</div>
        </div>
        <TrendingUp className="w-12 h-12 text-darkgreen" />
      </div>
    </>
  );
}

function WasteTab({ reservations }: { reservations: UserReservation[] }) {
  const wasteItems = [
    { name: 'مخلفات التقليم', amount: '180 كجم', method: 'تحويل لسماد', value: '450', icon: Scissors },
    { name: 'أوراق الأشجار', amount: '95 كجم', method: 'تحويل لعلف', value: '285', icon: Leaf },
    { name: 'بقايا العصر', amount: '65 كجم', method: 'بيع صناعي', value: '390', icon: Droplets },
  ];

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-2xl">
        <Recycle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد مخلفات بعد</h3>
        <p className="text-gray-600">ستظهر المخلفات بعد بدء العمليات الزراعية</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Recycle className="w-8 h-8 text-green-600" />
          <h3 className="text-2xl font-bold text-green-900">ولا شيء يضيع</h3>
        </div>
        <p className="text-gray-700 leading-relaxed">
          كل المخلفات الزراعية يتم الاستفادة منها وتحويلها لقيمة مضافة. نظام دائري ومستدام.
        </p>
      </div>

      <div>
        <h3 className="text-xl font-bold text-darkgreen mb-4">المخلفات المُستفاد منها</h3>
        <div className="space-y-3">
          {wasteItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-darkgreen/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-teal-100 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-green-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-darkgreen">{item.name}</h4>
                      <div className="text-sm text-gray-600">الكمية: {item.amount}</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
                  <div>
                    <div className="text-sm text-gray-600">طريقة الاستفادة</div>
                    <div className="font-bold text-darkgreen">{item.method}</div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-gray-600">القيمة المضافة</div>
                    <div className="font-bold text-darkgreen">{item.value} ر.س</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600 mb-1">إجمالي القيمة المضافة</div>
          <div className="text-3xl font-black text-teal-700">1,125 ر.س</div>
        </div>
        <Recycle className="w-12 h-12 text-teal-700" />
      </div>
    </>
  );
}

function ExpansionTab({ reservations, summary }: { reservations: UserReservation[]; summary: UserTreesSummary }) {
  const opportunities = [
    {
      title: 'أضف 50 شجرة',
      description: 'توسع في استثمارك الحالي بإضافة 50 وحدة جديدة',
      benefit: 'زيادة العوائد بنسبة 35%',
      action: 'أضف الآن',
      icon: Plus,
      color: 'from-green-50 to-emerald-50 border-green-200'
    },
    {
      title: 'ضاعف الاستثمار',
      description: 'مضاعفة عدد الأشجار في مزرعتك الحالية',
      benefit: 'تحسين الكفاءة التشغيلية',
      action: 'استكشف',
      icon: TrendingUp,
      color: 'from-blue-50 to-cyan-50 border-blue-200'
    },
    {
      title: 'مزرعة جديدة',
      description: 'توسع جغرافي في موقع جديد بمحاصيل مختلفة',
      benefit: 'تنويع المحفظة الاستثمارية',
      action: 'اكتشف المزارع',
      icon: MapPin,
      color: 'from-orange-50 to-amber-50 border-orange-200'
    },
  ];

  return (
    <>
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Rocket className="w-8 h-8 text-orange-600" />
          <h3 className="text-2xl font-bold text-orange-900">نمِّ أصولك</h3>
        </div>
        <p className="text-gray-700 leading-relaxed">
          فرص توسعة مصممة خصيصًا لك بناءً على أصولك الحالية. امتداد طبيعي لاستثمارك.
        </p>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <Rocket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">ابدأ أولاً</h3>
          <p className="text-gray-600">احجز أصولك الأولى لتظهر فرص التوسعة المناسبة</p>
        </div>
      ) : (
        <>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
            <h4 className="font-bold text-darkgreen mb-3">أصولك الحالية</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-black text-darkgreen">{summary.totalTrees}</div>
                <div className="text-xs text-gray-600">وحدة</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-black text-darkgreen">{summary.totalFarms}</div>
                <div className="text-xs text-gray-600">موقع</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-black text-darkgreen">{summary.activeReservations}</div>
                <div className="text-xs text-gray-600">عقد</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-darkgreen mb-4">الفرص المتاحة</h3>
            <div className="space-y-4">
              {opportunities.map((opp, idx) => {
                const Icon = opp.icon;
                return (
                  <div
                    key={idx}
                    className={`bg-gradient-to-br ${opp.color} border-2 rounded-xl p-5`}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-darkgreen" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-darkgreen mb-1">{opp.title}</h4>
                        <p className="text-sm text-gray-700 mb-2">{opp.description}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <ArrowUpRight className="w-4 h-4 text-green-600" />
                          <span className="text-green-700 font-semibold">{opp.benefit}</span>
                        </div>
                      </div>
                    </div>
                    <button className="w-full bg-darkgreen hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                      <span>{opp.action}</span>
                      <ArrowUpRight className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function ReportsTab({
  reservations,
  summary,
  operations
}: {
  reservations: UserReservation[];
  summary: UserTreesSummary;
  operations: TreeOperation[];
}) {
  if (reservations.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-2xl">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد تقارير بعد</h3>
        <p className="text-gray-600">ستظهر التقارير بعد بدء نشاطك الاستثماري</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <h3 className="text-2xl font-bold text-blue-900">ملخص ذكي</h3>
        </div>
        <p className="text-gray-700 leading-relaxed">
          تقارير واضحة بلغة بشرية. نخبرك بما حدث، ما تم، وما هو قادم.
        </p>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-bold text-darkgreen mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          الربع الحالي
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-green-900 mb-1">ماذا حدث</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  تمت {summary.recentOperations} عملية زراعية على أصولك بنجاح. جميع الأشجار في حالة صحية ممتازة.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <div className="flex items-start gap-3">
              <Zap className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-blue-900 mb-1">ماذا تم</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  تم إنتاج وبيع منتجات بقيمة 14,050 ر.س. القيمة المضافة من المخلفات: 1,125 ر.س.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-orange-900 mb-1">ماذا هو القادم</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  موسم الحصاد القادم في شهرين. متوقع زيادة الإنتاج بنسبة 15% بناءً على جودة العناية.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h4 className="font-bold text-green-900">الأداء العام</h4>
          </div>
          <div className="text-3xl font-black text-green-700 mb-1">ممتاز</div>
          <p className="text-sm text-gray-700">جميع المؤشرات إيجابية</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Coins className="w-6 h-6 text-blue-600" />
            <h4 className="font-bold text-blue-900">إجمالي العوائد</h4>
          </div>
          <div className="text-3xl font-black text-blue-700 mb-1">15,175 ر.س</div>
          <p className="text-sm text-gray-700">منذ بداية الاستثمار</p>
        </div>
      </div>
    </>
  );
}
