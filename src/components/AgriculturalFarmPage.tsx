import { useState, useEffect } from 'react';
import { ArrowRight, Minus, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { FarmProject, FarmContract } from '../services/farmService';
import { agriculturalPackagesService, type AgriculturalPackage } from '../services/agriculturalPackagesService';
import UnifiedBookingFlow from './UnifiedBookingFlow';
import { usePageTracking } from '../hooks/useLeadTracking';
import { influencerMarketingService } from '../services/influencerMarketingService';

interface AgriculturalFarmPageProps {
  farm: FarmProject;
  onClose: () => void;
  onGoToAccount?: () => void;
}

export default function AgriculturalFarmPage({ farm, onClose, onGoToAccount }: AgriculturalFarmPageProps) {
  const { user } = useAuth();
  const leadService = usePageTracking('مزرعة زراعية');

  useEffect(() => {
    leadService.trackFarmView(farm.id, farm.name);
  }, [farm.id, farm.name]);

  const [packages, setPackages] = useState<AgriculturalPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<AgriculturalPackage | null>(null);
  const [selectedContract, setSelectedContract] = useState<FarmContract | null>(null);
  const [treeCount, setTreeCount] = useState(50);
  const [showBookingFlow, setShowBookingFlow] = useState(false);

  const [showPartnerInput, setShowPartnerInput] = useState(false);
  const [partnerCode, setPartnerCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [bonusYears, setBonusYears] = useState(0);

  useEffect(() => {
    if (farm.contracts && farm.contracts.length > 0) {
      setSelectedContract(farm.contracts[0]);
    }
  }, [farm.contracts]);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const pkgs = await agriculturalPackagesService.getActivePackages();
        setPackages(pkgs);

        if (pkgs.length >= 2) {
          const middlePackage = pkgs[1];
          setSelectedPackage(middlePackage);
          setTreeCount(middlePackage.min_trees);

          const { data: contract } = await supabase
            .from('farm_contracts')
            .select('*')
            .eq('id', middlePackage.contract_id)
            .maybeSingle();

          if (contract) {
            setSelectedContract(contract);
          }
        }
      } catch (error) {
        console.error('Error loading packages:', error);
      }
    };
    loadPackages();
  }, []);

  const maxTrees = farm.availableTrees || 1000;

  const calculateTotal = () => {
    if (treeCount === 0) return 0;
    if (selectedPackage) {
      return treeCount * selectedPackage.price_per_tree;
    }
    if (selectedContract) {
      const price = selectedContract.farmer_price || selectedContract.investor_price || 0;
      return treeCount * price;
    }
    return 0;
  };

  const handleTreeCountChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(maxTrees, treeCount + delta));
    setTreeCount(newCount);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTreeCount(parseInt(e.target.value));
  };

  const handleSelectPackage = async (pkg: AgriculturalPackage) => {
    setSelectedPackage(pkg);
    setTreeCount(pkg.min_trees);

    try {
      const { data: contract } = await supabase
        .from('farm_contracts')
        .select('*')
        .eq('id', pkg.contract_id)
        .maybeSingle();

      if (contract) {
        setSelectedContract(contract);
      }
    } catch (error) {
      console.error('Error loading contract:', error);
    }
  };

  const handleVerifyPartnerCode = async () => {
    if (!partnerCode.trim()) return;

    try {
      const isValid = await influencerMarketingService.verifyInfluencerCode(partnerCode);

      if (isValid) {
        setIsCodeVerified(true);
        setBonusYears(3);
        sessionStorage.setItem('influencer_code', partnerCode);
      } else {
        alert('الكود غير صحيح');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      alert('حدث خطأ في التحقق من الكود');
    }
  };

  const handleBuyNow = () => {
    if ((!selectedContract && !selectedPackage) || treeCount === 0) {
      alert('يرجى اختيار باقة وعدد الأشجار');
      return;
    }
    setShowBookingFlow(true);
  };

  const handleGoToAccount = () => {
    onClose();
    if (onGoToAccount) {
      onGoToAccount();
    }
  };

  if (showBookingFlow && selectedContract) {
    return (
      <UnifiedBookingFlow
        farmId={farm.id}
        farmName={farm.name}
        farmLocation={farm.location}
        pathType="agricultural"
        packageName={selectedPackage?.package_name || selectedContract.contract_name}
        treeCount={treeCount}
        contractId={selectedContract.id}
        contractName={selectedContract.contract_name}
        durationYears={selectedPackage?.contract_years || selectedContract.duration_years}
        bonusYears={bonusYears || selectedPackage?.bonus_years || selectedContract.bonus_years}
        totalPrice={calculateTotal()}
        pricePerTree={selectedPackage?.price_per_tree || selectedContract.farmer_price || selectedContract.investor_price || 0}
        influencerCode={isCodeVerified ? partnerCode : null}
        onBack={() => setShowBookingFlow(false)}
        onComplete={() => {
          setShowBookingFlow(false);
          handleGoToAccount();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="min-h-screen p-4 pb-32">

        {/* HEADER PLACEHOLDER */}
        <div className="mb-6">
          <button onClick={onClose} className="mb-4">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">صفحة المزرعة الزراعية - جاهزة للتصميم الجديد</h1>
          <p className="text-sm text-gray-600 mt-2">{farm.name}</p>
          <p className="text-xs text-gray-500">متاح: {maxTrees} شجرة</p>
        </div>

        {/* TREE COUNTER PLACEHOLDER */}
        <div className="mb-6 p-4 border rounded">
          <h3 className="font-bold mb-4">اختر عدد الأشجار للاستثمار</h3>
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => handleTreeCountChange(-1)}
              disabled={treeCount <= 1}
              className="w-12 h-12 border rounded flex items-center justify-center disabled:opacity-50"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="text-4xl font-bold">{treeCount}</div>
              <div className="text-sm text-gray-600">شجرة</div>
            </div>
            <button
              onClick={() => handleTreeCountChange(1)}
              disabled={treeCount >= maxTrees}
              className="w-12 h-12 border rounded flex items-center justify-center disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <input
            type="range"
            min="1"
            max={maxTrees}
            value={treeCount}
            onChange={handleSliderChange}
            className="w-full"
          />
          <div className="text-xs text-gray-600 mt-2">متاح حتى {maxTrees} شجرة</div>
        </div>

        {/* PACKAGES PLACEHOLDER */}
        <div className="mb-6">
          <h3 className="font-bold mb-4">الباقات</h3>
          <div className="grid grid-cols-3 gap-2">
            {packages.slice(0, 3).map((pkg, index) => (
              <button
                key={pkg.id}
                onClick={() => handleSelectPackage(pkg)}
                className={`p-3 border rounded ${
                  selectedPackage?.id === pkg.id ? 'border-green-500 bg-green-50' : ''
                } ${index === 1 ? 'border-2 border-yellow-500' : ''}`}
              >
                {index === 1 && (
                  <div className="text-xs text-yellow-600 mb-1">أكثر طلباً</div>
                )}
                <div className="text-sm font-bold">{pkg.min_trees} شجرة</div>
                <div className="text-xs text-gray-600">
                  {(pkg.price_per_tree * pkg.min_trees).toLocaleString()} ر.س
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* PARTNER CODE PLACEHOLDER */}
        <div className="mb-6 p-4 border rounded">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-sm">لديك كود شريك نجاح؟</span>
            <button
              onClick={() => setShowPartnerInput(!showPartnerInput)}
              className="text-sm text-blue-600"
            >
              {showPartnerInput ? 'إخفاء' : 'إظهار'}
            </button>
          </div>
          {showPartnerInput && (
            <div className="space-y-2">
              <p className="text-xs text-gray-600">أدخل الكود للحصول على +3 سنوات مجاناً</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                  placeholder="PARTNER50"
                  disabled={isCodeVerified}
                  className="flex-1 px-3 py-2 border rounded"
                />
                <button
                  onClick={handleVerifyPartnerCode}
                  disabled={!partnerCode.trim() || isCodeVerified}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  تحقق
                </button>
              </div>
              {isCodeVerified && (
                <div className="text-sm text-green-600">تم التحقق بنجاح - حصلت على +3 سنوات</div>
              )}
            </div>
          )}
        </div>

        {/* SPACER FOR FIXED BUTTON */}
        <div className="h-20"></div>

      </div>

      {/* BOTTOM CTA PLACEHOLDER */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="mb-3 text-center">
          <div className="text-sm text-gray-600">الإجمالي</div>
          <div className="text-2xl font-bold">{calculateTotal().toLocaleString()} ر.س</div>
        </div>
        <button
          onClick={handleBuyNow}
          disabled={!selectedContract || treeCount === 0}
          className="w-full py-3 bg-green-600 text-white rounded font-bold disabled:opacity-50"
        >
          احجز أشجارك الآن
        </button>
        <p className="text-xs text-center text-gray-500 mt-2">آمن - يمكنك الإلغاء حسب الشروط</p>
      </div>
    </div>
  );
}
