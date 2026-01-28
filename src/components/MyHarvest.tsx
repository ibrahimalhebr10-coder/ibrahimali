import { useState, useEffect } from 'react';
import { X, Sprout, MapPin, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import FarmDetails from './harvest/FarmDetails';

interface MyHarvestProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Farm {
  id: string;
  name_ar: string;
  name_en: string;
  location: string;
  total_area: number;
  status: string;
}

export default function MyHarvest({ isOpen, onClose }: MyHarvestProps) {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCompletedFarms();
    }
  }, [isOpen]);

  async function loadCompletedFarms() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('status', 'completed')
        .order('name_ar');

      if (error) throw error;
      setFarms(data || []);
    } catch (error) {
      console.error('Error loading farms:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  if (selectedFarm) {
    return (
      <FarmDetails
        farm={selectedFarm}
        onBack={() => setSelectedFarm(null)}
        onClose={onClose}
      />
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />

      <div
        className="fixed inset-x-0 bottom-0 bg-white z-50 max-h-[90vh] overflow-hidden rounded-t-3xl"
        style={{
          animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <div
          className="sticky top-0 z-10 px-6 py-5 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #3AA17E 0%, #2D8B6A 100%)',
            boxShadow: '0 4px 12px rgba(58, 161, 126, 0.2)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">محصولي</h2>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">جاري التحميل...</p>
            </div>
          ) : farms.length === 0 ? (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 text-center">
              <MapPin className="w-16 h-16 text-amber-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-3">لا توجد مزارع مكتملة</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                لم يتم العثور على مزارع مكتملة حالياً
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {farms.map((farm) => (
                <button
                  key={farm.id}
                  onClick={() => setSelectedFarm(farm)}
                  className="w-full p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl hover:border-green-400 transition-all duration-200 text-right group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">
                        {farm.name_ar}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">{farm.name_en}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{farm.location}</span>
                        </div>
                        <span>المساحة: {farm.total_area} دونم</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-600 text-white group-hover:bg-green-700 transition-colors">
                      <ArrowLeft className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
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
