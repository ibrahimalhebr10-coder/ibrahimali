import { useState, useEffect } from 'react';
import { Rocket, TrendingUp, Loader2, TreePine, Building2, FileUp } from 'lucide-react';
import {
  getPersonalizedOpportunities,
  getOpportunityTypeLabel,
  type ExpansionOpportunity
} from '../../services/expansionOpportunitiesService';

const opportunityTypeIcons = {
  add_trees: TreePine,
  new_farm: Building2,
  upgrade_contract: FileUp
};

const opportunityTypeColors = {
  add_trees: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', accent: 'text-green-600' },
  new_farm: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', accent: 'text-blue-600' },
  upgrade_contract: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', accent: 'text-purple-600' }
};

export default function ExpansionOpportunitiesTab() {
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<ExpansionOpportunity[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getPersonalizedOpportunities();
      setOpportunities(data);
    } catch (error) {
      console.error('Error loading expansion opportunities:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleOpportunityClick(opportunity: ExpansionOpportunity) {
    console.log('Expansion opportunity clicked:', opportunity);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-darkgreen animate-spin" />
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Rocket className="w-10 h-10 text-blue-700" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">لا توجد فرص توسعة حالياً</h3>
        <p className="text-gray-600">سنخبرك عند توفر فرص جديدة</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 p-6 rounded-2xl border border-blue-100">
        <div className="flex items-center gap-3 mb-2">
          <Rocket className="w-8 h-8 text-blue-700" />
          <h3 className="text-2xl font-bold text-gray-900">فرص التوسعة</h3>
        </div>
        <p className="text-gray-700">امتداد طبيعي لاستثمارك الحالي - بدون ضغط، بدون إلحاح</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {opportunities.map(opportunity => {
          const Icon = opportunityTypeIcons[opportunity.opportunityType];
          const colors = opportunityTypeColors[opportunity.opportunityType];

          return (
            <div
              key={opportunity.id}
              className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-7 h-7 ${colors.accent}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                      {getOpportunityTypeLabel(opportunity.opportunityType)}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{opportunity.title}</h4>
                </div>
              </div>

              <p className="text-gray-700 mb-4 leading-relaxed">{opportunity.description}</p>

              {opportunity.relatedFarmName && (
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span>مرتبط بـ: {opportunity.relatedFarmName}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                {opportunity.treesCount && (
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <TreePine className="w-4 h-4 text-gray-600" />
                      <div className="text-xs text-gray-600">عدد الأشجار</div>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{opportunity.treesCount}</div>
                  </div>
                )}

                {opportunity.estimatedValue && (
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-gray-600" />
                      <div className="text-xs text-gray-600">القيمة التقديرية</div>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {opportunity.estimatedValue.toFixed(0)} ريال
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleOpportunityClick(opportunity)}
                className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-300 ${colors.bg} ${colors.text} hover:shadow-md border ${colors.border}`}
              >
                {opportunity.ctaButtonText}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-2">لماذا التوسعة؟</h4>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-1">•</span>
            <span>زيادة عوائدك بشكل تدريجي</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-1">•</span>
            <span>تنويع محفظتك الاستثمارية</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-1">•</span>
            <span>الاستفادة من فرص موسمية محدودة</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
