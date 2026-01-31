import { TreePine, Plus, ArrowLeft } from 'lucide-react';
import { InvestorInvestment } from '../services/investorAccountService';

interface TreeTypeInfo {
  name: string;
  count: number;
  color: string;
}

interface InvestorVirtualFarmProps {
  investorName: string;
  investments: InvestorInvestment[];
  onViewContract: (investmentId: string) => void;
  onInvestMore: () => void;
}

export default function InvestorVirtualFarm({
  investorName,
  investments,
  onViewContract,
  onInvestMore
}: InvestorVirtualFarmProps) {
  const totalTrees = investments.reduce((sum, inv) => sum + inv.treeCount, 0);

  const treesByType = investments.reduce((acc, inv) => {
    const types = inv.treeTypes.split('، ');
    types.forEach(type => {
      const existing = acc.find(t => t.name === type);
      if (existing) {
        existing.count += Math.floor(inv.treeCount / types.length);
      } else {
        acc.push({
          name: type,
          count: Math.floor(inv.treeCount / types.length),
          color: getTreeColor(type)
        });
      }
    });
    return acc;
  }, [] as TreeTypeInfo[]);

  function getTreeColor(treeType: string): string {
    const colors: { [key: string]: string } = {
      'زيتون': '#86A873',
      'تين': '#8B7355',
      'رمان': '#C73E3A',
      'نخيل': '#CD853F',
      'مانجو': '#FFB347',
      'حمضيات': '#FFA500',
      'تفاح': '#DC143C',
      'عنب': '#800080'
    };

    for (const [key, color] of Object.entries(colors)) {
      if (treeType.includes(key)) return color;
    }

    return '#22c55e';
  }

  return (
    <div className="space-y-6">
      {/* Contracts Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-green-800 text-right">عقودي الاستثمارية</h3>
        <div className="space-y-3">
          {investments.map((investment, index) => (
            <div
              key={investment.id}
              className="bg-white rounded-2xl p-5 shadow-lg border-2 border-cyan-200 hover:border-cyan-300 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-cyan-700 bg-cyan-100 px-3 py-1 rounded-full">
                      عقد #{index + 1}
                    </span>
                    {investment.status === 'confirmed' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                        مفعل
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">{investment.farmName}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <TreePine className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">{investment.treeCount} شجرة</span>
                    </div>
                    <div className="bg-gray-100 px-2 py-1 rounded-md">
                      <span>{investment.treeTypes}</span>
                    </div>
                    <div>
                      <span>{investment.durationYears} سنوات</span>
                      {investment.bonusYears > 0 && (
                        <span className="text-green-600 font-bold mr-1">+ {investment.bonusYears} مجانًا</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    رقم العقد: {investment.investmentNumber}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onViewContract(investment.id)}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                <span>عرض العقد الرسمي</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Virtual Farm Section */}
      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl p-6 shadow-2xl border-4 border-green-300">
        <div className="text-center mb-6">
          <div className="inline-block bg-white rounded-2xl px-6 py-3 shadow-xl border-2 border-green-400 mb-4">
            <h3 className="text-2xl font-extrabold text-green-800">
              مزرعة {investorName}
            </h3>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-700">
            <TreePine className="w-5 h-5 text-green-600" />
            <p className="text-lg font-bold">
              {totalTrees} شجرة نشطة
            </p>
          </div>
        </div>

        {/* Tree Types Summary */}
        <div className="bg-white rounded-2xl p-5 mb-6 shadow-lg border-2 border-green-200">
          <h4 className="text-base font-bold text-gray-800 mb-4 text-right">أنواع الأشجار في مزرعتك</h4>
          <div className="grid grid-cols-2 gap-3">
            {treesByType.map((tree) => (
              <div
                key={tree.name}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border-2 hover:shadow-md transition-all"
                style={{ borderColor: tree.color }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tree.color }}
                  ></div>
                  <span className="text-sm font-bold text-gray-800">{tree.name}</span>
                </div>
                <p className="text-2xl font-extrabold" style={{ color: tree.color }}>
                  {tree.count}
                </p>
                <p className="text-xs text-gray-600">شجرة</p>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Tree Representation */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border-2 border-green-200">
          <h4 className="text-base font-bold text-gray-800 mb-4 text-center">
            أشجارك النشطة
          </h4>
          <div className="grid grid-cols-5 gap-3 max-h-64 overflow-y-auto">
            {Array.from({ length: Math.min(totalTrees, 50) }).map((_, i) => {
              const treeType = treesByType[i % treesByType.length];
              return (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg hover:scale-110 transition-transform"
                  title={treeType.name}
                >
                  <TreePine
                    className="w-8 h-8"
                    style={{ color: treeType.color }}
                  />
                  <span className="text-xs text-gray-600 mt-1">#{i + 1}</span>
                </div>
              );
            })}
          </div>
          {totalTrees > 50 && (
            <p className="text-center text-sm text-gray-600 mt-4">
              + {totalTrees - 50} شجرة أخرى
            </p>
          )}
        </div>

        {/* Growth Status */}
        <div className="bg-gradient-to-r from-green-100 via-emerald-100 to-green-100 rounded-2xl p-5 mb-4 border-2 border-green-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h4 className="text-lg font-bold text-green-800">استثمارك نشط ومفعل</h4>
          </div>
          <p className="text-sm text-green-700 text-right leading-relaxed">
            نحن نعتني بأشجارك يوميًا من ري وتسميد ورعاية شاملة لضمان أفضل محصول وأعلى عوائد لك
          </p>
        </div>

        {/* Add More Trees Button */}
        <button
          onClick={onInvestMore}
          className="w-full py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <Plus className="w-6 h-6" />
          <span className="text-lg">هل تريد زيادة أشجارك الاستثمارية؟</span>
        </button>
        <p className="text-center text-sm text-gray-600 mt-3">
          استثمر في المزيد من الأشجار من المزارع المتاحة
        </p>
      </div>
    </div>
  );
}
