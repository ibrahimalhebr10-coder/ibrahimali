import { supabase } from '../lib/supabase'
import type { MonthlyReportWithFarm } from '../types/database.types'

export const reportService = {
  async getMonthlyReports(userId?: string) {
    let query = supabase
      .from('monthly_reports')
      .select(`
        *,
        farm:farms(*)
      `)
      .order('report_month', { ascending: false })

    if (userId) {
      const { data: userInvestments } = await supabase
        .from('investments')
        .select('farm_id')
        .eq('user_id', userId)

      if (userInvestments) {
        const farmIds = userInvestments.map(inv => inv.farm_id)
        query = query.in('farm_id', farmIds)
      }
    }

    const { data, error } = await query

    if (error) throw error
    return data as unknown as MonthlyReportWithFarm[]
  },

  async getFarmReports(farmId: string) {
    const { data, error } = await supabase
      .from('monthly_reports')
      .select(`
        *,
        farm:farms(*)
      `)
      .eq('farm_id', farmId)
      .order('report_month', { ascending: false })

    if (error) throw error
    return data as unknown as MonthlyReportWithFarm[]
  },

  async getLatestReport() {
    const { data, error } = await supabase
      .from('monthly_reports')
      .select(`
        *,
        farm:farms(*)
      `)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as unknown as MonthlyReportWithFarm | null
  }
}
