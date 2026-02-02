import { X, Sprout, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import type { AgriculturalPackage } from '../services/agriculturalPackagesService';

interface PackageDetailsModalProps {
  package: AgriculturalPackage;
  onClose: () => void;
  onSelectPackage: (pkg: AgriculturalPackage) => void;
}

export default function PackageDetailsModal({
  package: pkg,
  onClose,
  onSelectPackage
}: PackageDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 z-[100000] flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{pkg.package_name}</h2>
            <p className="text-green-50 text-sm mt-1">تفاصيل الباقة الكاملة</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Price Banner */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 text-center">
            <div className="text-sm text-gray-600 mb-2">سعر الشجرة الواحدة</div>
            <div className="text-4xl font-bold text-darkgreen mb-2">
              {pkg.price_per_tree} ر.س
            </div>
            {pkg.motivational_text && (
              <div className="inline-block bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                {pkg.motivational_text}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
            <h3 className="font-bold text-darkgreen mb-3 flex items-center gap-2">
              <Sprout className="w-5 h-5" />
              تعريف الباقة
            </h3>
            <p className="text-gray-700 leading-relaxed">{pkg.description}</p>
          </div>

          {/* What's Included */}
          {pkg.what_is_included && pkg.what_is_included.length > 0 && (
            <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
              <h3 className="font-bold text-darkgreen mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                ماذا يشمل هذا السعر
              </h3>
              <ul className="space-y-2">
                {pkg.what_is_included.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Duration Info */}
          {pkg.base_duration_info && (
            <div className="bg-blue-50 rounded-xl border-2 border-blue-200 p-5">
              <h3 className="font-bold text-blue-900 mb-2">مدة الانتفاع الأساسية</h3>
              <p className="text-blue-800">{pkg.base_duration_info}</p>
            </div>
          )}

          {/* Free Years Info */}
          {pkg.free_years_info && (
            <div className="bg-green-50 rounded-xl border-2 border-green-200 p-5">
              <h3 className="font-bold text-green-900 mb-2">السنوات المجانية</h3>
              <p className="text-green-800">{pkg.free_years_info}</p>
            </div>
          )}

          {/* Features */}
          {pkg.features && pkg.features.length > 0 && (
            <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
              <h3 className="font-bold text-darkgreen mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                مميزات الباقة
              </h3>
              <ul className="space-y-2">
                {pkg.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700">
                    <span className="text-darkgreen mt-1">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Conditions */}
          {pkg.conditions && pkg.conditions.length > 0 && (
            <div className="bg-amber-50 rounded-xl border-2 border-amber-200 p-5">
              <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                شروط الباقة
              </h3>
              <ul className="space-y-2">
                {pkg.conditions.map((condition, index) => (
                  <li key={index} className="flex items-start gap-3 text-amber-900">
                    <span className="mt-1">•</span>
                    <span>{condition}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Management Info */}
          {pkg.management_info && (
            <div className="bg-slate-50 rounded-xl border-2 border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                كيف تُدار هذه الباقة من المنصة
              </h3>
              <p className="text-slate-700 leading-relaxed">{pkg.management_info}</p>
            </div>
          )}
        </div>

        {/* Footer - Select Button */}
        <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-6">
          <button
            onClick={() => onSelectPackage(pkg)}
            className="w-full py-4 bg-gradient-to-r from-darkgreen to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Sprout className="w-5 h-5" />
            <span>اختيار هذه الباقة وبدء محصولي الزراعي</span>
          </button>
        </div>
      </div>
    </div>
  );
}
