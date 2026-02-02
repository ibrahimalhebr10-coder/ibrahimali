import { useState, useEffect } from 'react';
import { FileText, TrendingUp, Loader2, CheckCircle, Clock, Sparkles } from 'lucide-react';
import {
  getSmartReports,
  getLatestReport,
  getReportTypeLabel,
  formatReportPeriod,
  type SmartReport
} from '../../services/smartReportsService';

const reportTypeColors = {
  quarterly: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  annual: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' }
};

export default function SmartReportsTab() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<SmartReport[]>([]);
  const [latestReport, setLatestReport] = useState<SmartReport | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [reportsData, latestData] = await Promise.all([
        getSmartReports(),
        getLatestReport()
      ]);
      setReports(reportsData);
      setLatestReport(latestData);
    } catch (error) {
      console.error('Error loading smart reports:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-darkgreen animate-spin" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-10 h-10 text-purple-700" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">لا توجد تقارير بعد</h3>
        <p className="text-gray-600">سيتم إنشاء تقاريرك الدورية قريباً</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 p-6 rounded-2xl border border-purple-100">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-purple-700" />
          <h3 className="text-2xl font-bold text-gray-900">التقارير الذكية</h3>
        </div>
        <p className="text-gray-700">ملخصات دورية بصيغة بشرية - بدون جداول، بدون تعقيد</p>
      </div>

      {latestReport && (
        <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-700" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-xl font-bold text-gray-900">أحدث تقرير</h4>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${reportTypeColors[latestReport.reportType].bg} ${reportTypeColors[latestReport.reportType].text} ${reportTypeColors[latestReport.reportType].border} border`}>
                  {getReportTypeLabel(latestReport.reportType)}
                </span>
              </div>
              <div className="text-sm text-gray-600">{formatReportPeriod(latestReport.reportPeriod)}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-700" />
                <h5 className="font-bold text-gray-900">ماذا حدث</h5>
              </div>
              <p className="text-gray-700 leading-relaxed">{latestReport.summaryWhatHappened}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-700" />
                <h5 className="font-bold text-gray-900">ماذا تم</h5>
              </div>
              <p className="text-gray-700 leading-relaxed">{latestReport.summaryWhatDone}</p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-700" />
                <h5 className="font-bold text-gray-900">ماذا هو القادم</h5>
              </div>
              <p className="text-gray-700 leading-relaxed">{latestReport.summaryWhatNext}</p>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500 text-center">
            تم إنشاؤه في: {new Date(latestReport.generatedAt).toLocaleDateString('ar-SA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      )}

      {reports.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-gray-900">التقارير السابقة</h3>

          {reports.slice(1).map(report => {
            const colors = reportTypeColors[report.reportType];

            return (
              <div
                key={report.id}
                className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <FileText className={`w-6 h-6 ${colors.text}`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                        {getReportTypeLabel(report.reportType)}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      {formatReportPeriod(report.reportPeriod)}
                    </h4>
                    <div className="text-sm text-gray-500">
                      {new Date(report.generatedAt).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-sm font-medium text-gray-900 mb-1">ماذا حدث</div>
                    <p className="text-sm text-gray-700 line-clamp-2">{report.summaryWhatHappened}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-sm font-medium text-gray-900 mb-1">ماذا تم</div>
                    <p className="text-sm text-gray-700 line-clamp-2">{report.summaryWhatDone}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-sm font-medium text-gray-900 mb-1">ماذا هو القادم</div>
                    <p className="text-sm text-gray-700 line-clamp-2">{report.summaryWhatNext}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
