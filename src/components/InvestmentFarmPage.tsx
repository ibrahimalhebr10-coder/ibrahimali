import { useState, useEffect } from 'react';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { FarmProject, FarmContract } from '../services/farmService';
import { investmentPackagesService, type InvestmentPackage } from '../services/investmentPackagesService';
import UnifiedBookingFlow from './UnifiedBookingFlow';
import { usePageTracking } from '../hooks/useLeadTracking';

interface InvestmentFarmPageProps {
  farm: FarmProject;
  onClose: () => void;
  onGoToAccount?: () => void;
}

export default function InvestmentFarmPage({ farm, onClose, onGoToAccount }: InvestmentFarmPageProps) {
  const { user } = useAuth();
  const leadService = usePageTracking('مزرعة استثمارية');

  useEffect(() => {
    leadService.trackFarmView(farm.id, farm.name);
  }, [farm.id, farm.name]);

  const [packages, setPackages] = useState<InvestmentPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<InvestmentPackage | null>(null);
  const [selectedContract, setSelectedContract] = useState<FarmContract | null>(null);
  const [treeCount, setTreeCount] = useState(50);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [showPartnerCode, setShowPartnerCode] = useState(false);
  const [partnerCode, setPartnerCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [influencerCode, setInfluencerCode] = useState<string | null>(null);

  useEffect(() => {
    if (farm.contracts && farm.contracts.length > 0) {
      const firstContract = farm.contracts[0];
      setSelectedContract(firstContract);
    }
  }, [farm.contracts]);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const pkgs = await investmentPackagesService.getActivePackages();
        setPackages(pkgs);
        if (pkgs.length > 0) {
          const defaultPackage = pkgs[1] || pkgs[0];
          handleSelectPackage(defaultPackage);
        }
      } catch (error) {
        console.error('Error loading packages:', error);
      }
    };
    loadPackages();
  }, []);

  const handleSelectPackage = async (pkg: InvestmentPackage) => {
    setSelectedPackage(pkg);
    setTreeCount(pkg.min_trees);

    try {
      const { data: contract, error } = await supabase
        .from('farm_contracts')
        .select('*')
        .eq('id', pkg.contract_id)
        .maybeSingle();

      if (contract && !error) {
        setSelectedContract(contract);
      }
    } catch (error) {
      console.error('Error loading contract:', error);
    }
  };

  const handleTreeCountChange = (delta: number) => {
    const minTrees = selectedPackage?.min_trees || 50;
    const increment = selectedPackage?.tree_increment || 50;
    const maxTrees = farm.availableTrees || 3000;

    let newCount = treeCount + delta;
    newCount = Math.max(minTrees, Math.min(maxTrees, newCount));

    const remainder = newCount % increment;
    if (remainder !== 0) {
      if (delta > 0) {
        newCount = Math.ceil(newCount / increment) * increment;
      } else {
        newCount = Math.floor(newCount / increment) * increment;
      }
    }

    setTreeCount(Math.max(minTrees, Math.min(maxTrees, newCount)));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setTreeCount(value);
  };

  const calculateTotal = () => {
    if (selectedPackage) {
      return treeCount * selectedPackage.price_per_tree;
    }
    if (selectedContract) {
      return treeCount * selectedContract.investor_price;
    }
    return 0;
  };

  const handleVerifyCode = () => {
    if (partnerCode.trim()) {
      setCodeVerified(true);
      setInfluencerCode(partnerCode);
    }
  };

  const handleInvestNow = () => {
    if (!selectedPackage || !selectedContract) {
      alert('يرجى اختيار باقة استثمارية أولاً');
      return;
    }
    setShowBookingFlow(true);
  };

  const handleBookingComplete = () => {
    setShowBookingFlow(false);
    handleGoToAccount();
  };

  const handleBookingBack = () => {
    setShowBookingFlow(false);
  };

  const handleGoToAccount = () => {
    onClose();
    if (onGoToAccount) {
      onGoToAccount();
    }
  };

  const maxTrees = farm.availableTrees || 3000;
  const minTrees = selectedPackage?.min_trees || 50;

  return (
    <>
      {!showBookingFlow && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="min-h-screen p-4 pb-32">

            {/* HEADER PLACEHOLDER */}
            <div className="mb-6">
              <button onClick={onClose} className="mb-4">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold">صفحة الحجز - جاهزة للتصميم الجديد</h1>
              <p className="text-sm text-gray-600 mt-2">{farm.name}</p>
              <p className="text-xs text-gray-500">متاح: {maxTrees} شجرة</p>
            </div>

            {/* TREE COUNTER PLACEHOLDER */}
            <div className="mb-6 p-4 border rounded">
              <h3 className="font-bold mb-4">عدد الأشجار</h3>
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => handleTreeCountChange(-50)}
                  disabled={treeCount <= minTrees}
                  className="w-12 h-12 border rounded flex items-center justify-center"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <div className="text-4xl font-bold">{treeCount}</div>
                  <div className="text-sm text-gray-600">شجرة</div>
                </div>
                <button
                  onClick={() => handleTreeCountChange(50)}
                  disabled={treeCount >= maxTrees}
                  className="w-12 h-12 border rounded flex items-center justify-center"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <input
                type="range"
                min={minTrees}
                max={maxTrees}
                value={treeCount}
                onChange={handleSliderChange}
                step={50}
                className="w-full"
              />
            </div>

            {/* PACKAGES PLACEHOLDER */}
            <div className="mb-6">
              <h3 className="font-bold mb-4">الباقات</h3>
              <div className="grid grid-cols-3 gap-2">
                {packages.slice(0, 3).map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`p-3 border rounded ${
                      selectedPackage?.id === pkg.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                  >
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
                <span className="font-bold text-sm">كود شريك النجاح</span>
                <button
                  onClick={() => setShowPartnerCode(!showPartnerCode)}
                  className="text-sm text-blue-600"
                >
                  {showPartnerCode ? 'إخفاء' : 'إظهار'}
                </button>
              </div>
              {showPartnerCode && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={partnerCode}
                    onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                    placeholder="أدخل الكود"
                    className="w-full px-3 py-2 border rounded"
                  />
                  <button
                    onClick={handleVerifyCode}
                    disabled={!partnerCode.trim() || codeVerified}
                    className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                  >
                    تحقق
                  </button>
                  {codeVerified && (
                    <div className="text-sm text-green-600">تم التحقق بنجاح</div>
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
              onClick={handleInvestNow}
              className="w-full py-3 bg-blue-600 text-white rounded font-bold"
            >
              احجز الآن
            </button>
          </div>
        </div>
      )}

      {/* BOOKING FLOW - NO CHANGES */}
      {showBookingFlow && selectedContract && selectedPackage && (
        <UnifiedBookingFlow
          farmId={farm.id}
          farmName={farm.name}
          pathType="investment"
          packageName={selectedPackage.package_name}
          treeCount={treeCount}
          contractId={selectedContract.id}
          contractName={selectedPackage.package_name || selectedContract.contract_name}
          durationYears={selectedPackage.base_duration_years || selectedContract.duration_years}
          bonusYears={selectedPackage.bonus_free_years || selectedContract.bonus_years}
          totalPrice={calculateTotal()}
          influencerCode={influencerCode}
          onBack={handleBookingBack}
          onComplete={handleBookingComplete}
        />
      )}
    </>
  );
}
