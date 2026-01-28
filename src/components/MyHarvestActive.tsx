import { useState, useEffect } from 'react';
import { X, Sprout, TreePine, Leaf, TrendingUp, Calendar, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MyHarvestActiveProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HarvestData {
  totalTrees: number;
  farmNames: string[];
  startDate: string;
}

export default function MyHarvestActive({ isOpen, onClose }: MyHarvestActiveProps) {
  const [loading, setLoading] = useState(true);
  const [harvestData, setHarvestData] = useState<HarvestData | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHarvestData();
    }
  }, [isOpen]);

  async function loadHarvestData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          id,
          number_of_trees,
          created_at,
          farms!inner(name_ar)
        `)
        .eq('user_id', user.id)
        .eq('status', 'transferred_to_harvest');

      if (error) throw error;

      if (reservations && reservations.length > 0) {
        const totalTrees = reservations.reduce((sum, r) => sum + r.number_of_trees, 0);
        const farmNames = [...new Set(reservations.map(r => (r.farms as any).name_ar))];
        const startDate = new Date(reservations[0].created_at).toLocaleDateString('ar-SA');

        setHarvestData({
          totalTrees,
          farmNames,
          startDate
        });
      }
    } catch (error) {
      console.error('Error loading harvest data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />

      <div
        className="fixed inset-x-0 bottom-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 z-50 max-h-[90vh] overflow-y-auto rounded-t-3xl"
        style={{
          animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 py-5 flex items-center justify-between backdrop-blur-lg border-b border-emerald-200/50"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">محصولي</h2>
              <p className="text-xs text-white/80">أشجارك النشطة</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-8">
          <div className="max-w-2xl mx-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">جاري التحميل...</p>
              </div>
            ) : harvestData ? (
              <>
                {/* Success Banner */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 mb-6 text-white">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                      <TreePine className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-1">مبروك!</h3>
                      <p className="text-white/90">أشجارك الآن نشطة ومسجلة باسمك</p>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-emerald-200">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">
                      <TreePine className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">إجمالي الأشجار</p>
                    <p className="text-2xl font-bold text-gray-800">{harvestData.totalTrees}</p>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-emerald-200">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                      <Leaf className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">المزارع</p>
                    <p className="text-2xl font-bold text-gray-800">{harvestData.farmNames.length}</p>
                  </div>
                </div>

                {/* Farm Details */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 mb-6">
                  <h4 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-emerald-600" />
                    مزارعك
                  </h4>
                  <div className="space-y-2">
                    {harvestData.farmNames.map((name, index) => (
                      <div key={index} className="flex items-center gap-2 text-gray-700">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coming Soon Features */}
                <div className="bg-gradient-to-br from-slate-100 to-gray-100 rounded-2xl p-6 border border-gray-300">
                  <div className="flex items-center gap-3 mb-4">
                    <Settings className="w-6 h-6 text-gray-600" />
                    <h4 className="font-bold text-lg text-gray-800">قريباً في محصولي</h4>
                  </div>

                  <div className="space-y-3">
                    {[
                      { icon: Calendar, text: 'جدول الري والصيانة' },
                      { icon: TrendingUp, text: 'تقارير الإنتاج والعوائد' },
                      { icon: TreePine, text: 'صور ومقاطع فيديو للأشجار' },
                      { icon: Leaf, text: 'شهادات الجودة والفحص' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3 text-gray-700">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                          <item.icon className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    سيتم إضافة هذه الميزات تدريجياً لتوفير أفضل تجربة متابعة لمحصولك
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <TreePine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد أشجار نشطة حالياً</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
