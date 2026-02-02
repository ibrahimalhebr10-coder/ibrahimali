import { supabase } from '../lib/supabase';

export interface SmartReport {
  id: string;
  reportType: 'quarterly' | 'annual';
  reportPeriod: string;
  summaryWhatHappened: string;
  summaryWhatDone: string;
  summaryWhatNext: string;
  generatedAt: string;
  reportData: Record<string, any>;
}

const reportTypeLabels: Record<string, string> = {
  quarterly: 'تقرير ربع سنوي',
  annual: 'تقرير سنوي'
};

export async function getSmartReports(): Promise<SmartReport[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('smart_reports')
      .select('*')
      .eq('investor_id', user.id)
      .order('generated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(report => ({
      id: report.id,
      reportType: report.report_type,
      reportPeriod: report.report_period,
      summaryWhatHappened: report.summary_what_happened,
      summaryWhatDone: report.summary_what_done,
      summaryWhatNext: report.summary_what_next,
      generatedAt: report.generated_at,
      reportData: report.report_data || {}
    }));
  } catch (error) {
    console.error('Error fetching smart reports:', error);
    return [];
  }
}

export async function getLatestReport(): Promise<SmartReport | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('smart_reports')
      .select('*')
      .eq('investor_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      reportType: data.report_type,
      reportPeriod: data.report_period,
      summaryWhatHappened: data.summary_what_happened,
      summaryWhatDone: data.summary_what_done,
      summaryWhatNext: data.summary_what_next,
      generatedAt: data.generated_at,
      reportData: data.report_data || {}
    };
  } catch (error) {
    console.error('Error fetching latest report:', error);
    return null;
  }
}

export function getReportTypeLabel(type: string): string {
  return reportTypeLabels[type] || type;
}

export function formatReportPeriod(period: string): string {
  const periodMap: Record<string, string> = {
    'Q1': 'الربع الأول',
    'Q2': 'الربع الثاني',
    'Q3': 'الربع الثالث',
    'Q4': 'الربع الرابع'
  };

  const parts = period.split(' ');
  if (parts.length === 2) {
    const quarter = periodMap[parts[0]] || parts[0];
    return `${quarter} ${parts[1]}`;
  }

  return period;
}
