import { useState, useEffect } from 'react';
import { Sparkles, TreeDeciduous, TrendingUp, Coins, DollarSign, Calendar, ChevronRight, LogIn, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDemoMode } from '../contexts/DemoModeContext';

interface GoldenTree {
  id: string;
  tree_type: string;
  quantity: number;
  contract_start: string;
  contract_duration: number;
  maintenance_fee?: number;
}

interface Benefit {
  type: 'waste' | 'factory';
  title: string;
  amount: number;
  date: string;
}

interface MaintenanceFee {
  id: string;
  amount_due: number;
  payment_status: 'pending' | 'paid';
  due_date: string;
  maintenance_type: string;
}

export default function AshjariGoldExperience() {
  const { user } = useAuth();
  const { isDemoMode } = useDemoMode();
  const [trees, setTrees] = useState<GoldenTree[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [fees, setFees] = useState<MaintenanceFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrees: 0,
    totalInvestment: 0,
    expectedReturn: 0,
    activeContracts: 0
  });

  const isActive = user && !isDemoMode;

  useEffect(() => {
    loadData();
  }, [user, isDemoMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isActive) {
        // TODO: Load real data from Supabase
        // For now, mock data
        setTrees([
          {
            id: '1',
            tree_type: 'زيتون',
            quantity: 50,
            contract_start: '2024-01-15',
            contract_duration: 5,
            maintenance_fee: 625
          }
        ]);

        setBenefits([
          {
            type: 'waste',
            title: 'استفادة من المخلفات الزراعية',
            amount: 1200,
            date: '2024-11-30'
          }
        ]);

        setFees([
          {
            id: 'f1',
            amount_due: 625,
            payment_status: 'pending',
            due_date: '2025-01-15',
            maintenance_type: 'دورية'
          }
        ]);

        setStats({
          totalTrees: 50,
          totalInvestment: 25000,
          expectedReturn: 12500,
          activeContracts: 1
        });
      } else {
        // Demo data
        setTrees([
          {
            id: 'demo1',
            tree_type: 'زيتون',
            quantity: 100,
            contract_start: '2024-01-01',
            contract_duration: 5,
            maintenance_fee: 1250
          }
        ]);

        setBenefits([
          {
            type: 'waste',
            title: 'استفادة من المخلفات الزراعية',
            amount: 2500,
            date: '2024-12-01'
          },
          {
            type: 'factory',
            title: 'عوائد من المصنع',
            amount: 3500,
            date: '2024-12-15'
          }
        ]);

        setFees([]);

        setStats({
          totalTrees: 100,
          totalInvestment: 50000,
          expectedReturn: 25000,
          activeContracts: 1
        });
      }
    } catch (error) {
      console.error('Error loading golden trees data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentClick = () => {
    if (!isActive) {
      alert('يرجى تسجيل الدخول للمتابعة');
      return;
    }
    // TODO: Navigate to payment page
    alert('سيتم توجيهك إلى صفحة السداد');
  };

  const handleLoginClick = () => {
    // TODO: Navigate to login
    alert('سيتم توجيهك لتسجيل الدخول');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #FFF8DC 0%, #FFE4B5 100%)'
      }}>
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 animate-pulse" style={{ color: '#DAA520' }} />
          <p className="text-lg font-bold" style={{ color: '#B8860B' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" style={{
      background: 'linear-gradient(135deg, #FFF8DC 0%, #FFE4B5 50%, #FAFAD2 100%)'
    }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-yellow-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-amber-400 rounded-full blur-3xl"></div>
        </div>

        <div className="relative px-6 pt-12 pb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
            }}>
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            </div>
            <h1 className="text-4xl font-black mb-2" style={{ color: '#B8860B' }}>
              أشجاري الذهبية
            </h1>
            <p className="text-lg" style={{ color: '#8B7500' }}>
              تجربتك الاستثمارية الفخمة
            </p>
          </div>

          {/* Demo Mode Banner */}
          {!isActive && (
            <div className="mb-6 p-4 rounded-2xl border-2" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 250, 205, 0.9))',
              borderColor: '#DAA520'
            }}>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: '#FF8C00' }} />
                <div className="flex-1">
                  <h3 className="font-bold mb-1" style={{ color: '#B8860B' }}>
                    وضع العرض التوضيحي
                  </h3>
                  <p className="text-sm mb-3" style={{ color: '#8B7500' }}>
                    هذه نظرة عامة على التجربة. للوصول الكامل والسداد، يرجى تسجيل الدخول
                  </p>
                  <button
                    onClick={handleLoginClick}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white text-sm transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-2xl border-2" style={{
              background: 'rgba(255, 255, 255, 0.8)',
              borderColor: '#DAA520'
            }}>
              <TreeDeciduous className="w-8 h-8 mb-2" style={{ color: '#228B22' }} />
              <div className="text-3xl font-black mb-1" style={{ color: '#B8860B' }}>
                {stats.totalTrees}
              </div>
              <div className="text-sm font-medium" style={{ color: '#8B7500' }}>
                إجمالي الأشجار
              </div>
            </div>

            <div className="p-4 rounded-2xl border-2" style={{
              background: 'rgba(255, 255, 255, 0.8)',
              borderColor: '#DAA520'
            }}>
              <Coins className="w-8 h-8 mb-2" style={{ color: '#DAA520' }} />
              <div className="text-3xl font-black mb-1" style={{ color: '#B8860B' }}>
                {stats.activeContracts}
              </div>
              <div className="text-sm font-medium" style={{ color: '#8B7500' }}>
                عقد نشط
              </div>
            </div>

            <div className="p-4 rounded-2xl border-2" style={{
              background: 'rgba(255, 255, 255, 0.8)',
              borderColor: '#DAA520'
            }}>
              <DollarSign className="w-8 h-8 mb-2" style={{ color: '#228B22' }} />
              <div className="text-2xl font-black mb-1" style={{ color: '#B8860B' }}>
                {stats.totalInvestment.toLocaleString()} ر.س
              </div>
              <div className="text-sm font-medium" style={{ color: '#8B7500' }}>
                إجمالي الاستثمار
              </div>
            </div>

            <div className="p-4 rounded-2xl border-2" style={{
              background: 'rgba(255, 255, 255, 0.8)',
              borderColor: '#DAA520'
            }}>
              <TrendingUp className="w-8 h-8 mb-2" style={{ color: '#FF8C00' }} />
              <div className="text-2xl font-black mb-1" style={{ color: '#B8860B' }}>
                {stats.expectedReturn.toLocaleString()} ر.س
              </div>
              <div className="text-sm font-medium" style={{ color: '#8B7500' }}>
                العوائد المتوقعة
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trees Section */}
      <div className="px-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: '#B8860B' }}>
          <TreeDeciduous className="w-7 h-7" />
          أشجاري
        </h2>
        <div className="space-y-4">
          {trees.map((tree) => (
            <div
              key={tree.id}
              className="p-5 rounded-2xl border-2 shadow-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#DAA520'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1" style={{ color: '#B8860B' }}>
                    {tree.tree_type}
                  </h3>
                  <p className="text-lg font-bold" style={{ color: '#228B22' }}>
                    {tree.quantity} شجرة
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full text-sm font-bold" style={{
                  background: 'linear-gradient(135deg, #90EE90, #228B22)',
                  color: 'white'
                }}>
                  نشط
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" style={{ color: '#8B7500' }} />
                  <span style={{ color: '#8B7500' }}>
                    بداية: {new Date(tree.contract_start).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4" style={{ color: '#8B7500' }} />
                  <span style={{ color: '#8B7500' }}>
                    المدة: {tree.contract_duration} سنوات
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="px-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: '#B8860B' }}>
          <TrendingUp className="w-7 h-7" />
          الاستفادة
        </h2>
        <div className="space-y-4">
          {benefits.map((benefit, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border-2 shadow-lg"
              style={{
                background: benefit.type === 'waste'
                  ? 'linear-gradient(135deg, rgba(144, 238, 144, 0.2), rgba(255, 255, 255, 0.95))'
                  : 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 255, 255, 0.95))',
                borderColor: benefit.type === 'waste' ? '#90EE90' : '#FFD700'
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold" style={{ color: '#B8860B' }}>
                  {benefit.title}
                </h3>
                <CheckCircle className="w-6 h-6" style={{ color: '#228B22' }} />
              </div>
              <div className="text-2xl font-black mb-2" style={{ color: '#228B22' }}>
                {benefit.amount.toLocaleString()} ر.س
              </div>
              <div className="text-sm" style={{ color: '#8B7500' }}>
                تاريخ الاستلام: {new Date(benefit.date).toLocaleDateString('ar-SA')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fees Section */}
      {fees.length > 0 && (
        <div className="px-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: '#B8860B' }}>
            <DollarSign className="w-7 h-7" />
            الرسوم المستحقة
          </h2>
          <div className="space-y-4">
            {fees.map((fee) => (
              <div
                key={fee.id}
                className="p-5 rounded-2xl border-2 shadow-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderColor: fee.payment_status === 'paid' ? '#90EE90' : '#FFD700'
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold mb-1" style={{ color: '#B8860B' }}>
                      صيانة {fee.maintenance_type}
                    </h3>
                    <p className="text-2xl font-black" style={{ color: '#FF8C00' }}>
                      {fee.amount_due.toLocaleString()} ر.س
                    </p>
                  </div>
                  <div
                    className="px-3 py-1 rounded-full text-sm font-bold"
                    style={{
                      background: fee.payment_status === 'paid'
                        ? 'linear-gradient(135deg, #90EE90, #228B22)'
                        : 'linear-gradient(135deg, #FFD700, #FFA500)',
                      color: 'white'
                    }}
                  >
                    {fee.payment_status === 'paid' ? 'مسدد' : 'معلق'}
                  </div>
                </div>

                {fee.payment_status === 'pending' && (
                  <>
                    <div className="text-sm mb-4" style={{ color: '#8B7500' }}>
                      تاريخ الاستحقاق: {new Date(fee.due_date).toLocaleDateString('ar-SA')}
                    </div>
                    <button
                      onClick={handlePaymentClick}
                      disabled={!isActive}
                      className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: isActive
                          ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                          : 'linear-gradient(135deg, #D3D3D3 0%, #A9A9A9 100%)'
                      }}
                    >
                      <DollarSign className="w-5 h-5" />
                      <span>سداد الآن</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for Active Users */}
      {isActive && trees.length === 0 && (
        <div className="px-6 text-center py-12">
          <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: '#DAA520' }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: '#B8860B' }}>
            لا توجد أشجار ذهبية بعد
          </h3>
          <p className="text-sm mb-6" style={{ color: '#8B7500' }}>
            ابدأ رحلتك الاستثمارية الآن
          </p>
          <button
            className="px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }}
          >
            استكشف الفرص
          </button>
        </div>
      )}
    </div>
  );
}
