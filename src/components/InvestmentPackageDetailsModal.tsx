import { X, CheckCircle2, TrendingUp, Shield, Clock, AlertCircle } from 'lucide-react';
import type { InvestmentPackage } from '../services/investmentPackagesService';

interface InvestmentPackageDetailsModalProps {
  package: InvestmentPackage | null;
  onClose: () => void;
  onSelectPackage: (pkg: InvestmentPackage) => void;
}

export default function InvestmentPackageDetailsModal({
  package: pkg,
  onClose,
  onSelectPackage
}: InvestmentPackageDetailsModalProps) {
  if (!pkg) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-br from-darkgreen to-emerald-700 text-white p-6 rounded-t-2xl z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{pkg.package_name}</h2>
              <p className="text-green-100 text-sm">باقة الاستثمار في الأشجار المثمرة</p>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-darkgreen text-white rounded-lg p-2">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-darkgreen text-lg">تعريف الباقة</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">{pkg.description}</p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-600 text-white rounded-lg p-2">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-blue-900 text-lg">{pkg.investment_duration_title}</h3>
            </div>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>مدة أساسية محددة للعقد</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>سنوات إضافية تشجيعية</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>السنوات الإضافية غير ملزمة قانونياً وموضحة ضمن شروط الباقة</span>
              </li>
            </ul>
          </div>

          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-emerald-600 text-white rounded-lg p-2">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-emerald-900 text-lg">حقوق المستثمر</h3>
            </div>
            <p className="text-gray-700 mb-3">يحق للمستثمر الاستفادة من القيمة الكاملة للشجرة، وتشمل:</p>
            <ul className="space-y-2">
              {pkg.investor_rights.map((right, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{right}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-600 mt-3 bg-white/50 rounded-lg p-3">
              جميع المنتجات والمخلفات تُدار وتُباع ضمن منظومة التشغيل وتُضاف قيمتها لصالح المستثمر.
            </p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-5">
            <h3 className="font-bold text-purple-900 mb-3 text-lg">آلية الإدارة</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pkg.management_approach}</p>
          </div>

          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5">
            <h3 className="font-bold text-amber-900 mb-3 text-lg">العائد</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pkg.returns_info}</p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-red-900 text-lg">تنويه</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">{pkg.disclaimer}</p>
          </div>

          {pkg.motivational_text && (
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl p-5">
              <p className="text-center text-darkgreen font-bold text-lg">{pkg.motivational_text}</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-6 rounded-b-2xl">
          <button
            onClick={() => onSelectPackage(pkg)}
            className="w-full bg-gradient-to-br from-darkgreen to-emerald-700 hover:from-emerald-700 hover:to-darkgreen text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{pkg.action_button_text}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
