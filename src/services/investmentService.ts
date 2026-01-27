import { supabase } from '../lib/supabase'
import type { Database, InvestmentWithFarm, UserPortfolio } from '../types/database.types'

type InvestmentInsert = Database['public']['Tables']['investments']['Insert']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']

export const investmentService = {
  async getUserPortfolio(userId: string): Promise<UserPortfolio> {
    const { data, error } = await supabase
      .from('investments')
      .select(`
        *,
        farm:farms(*)
      `)
      .eq('user_id', userId)
      .order('invested_at', { ascending: false })

    if (error) throw error

    const investments = data as unknown as InvestmentWithFarm[]

    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0)
    const totalExpectedReturn = investments.reduce((sum, inv) => sum + inv.expected_return, 0)
    const totalActualReturn = investments.reduce((sum, inv) => sum + inv.actual_return, 0)
    const activeInvestmentsCount = investments.filter(inv => inv.status === 'active').length

    return {
      total_invested: totalInvested,
      total_expected_return: totalExpectedReturn,
      total_actual_return: totalActualReturn,
      active_investments_count: activeInvestmentsCount,
      investments
    }
  },

  async createInvestment(params: {
    userId: string
    farmId: string
    amount: number
    shares: number
  }) {
    const { userId, farmId, amount, shares } = params

    const { data: farm, error: farmError } = await supabase
      .from('farms')
      .select('*')
      .eq('id', farmId)
      .single()

    if (farmError) throw farmError

    if (amount < farm.min_investment) {
      throw new Error(`الحد الأدنى للاستثمار هو ${farm.min_investment} ريال`)
    }

    if (amount > farm.max_investment) {
      throw new Error(`الحد الأقصى للاستثمار هو ${farm.max_investment} ريال`)
    }

    if (farm.current_invested + amount > farm.total_capacity) {
      throw new Error('المزرعة وصلت للطاقة الاستيعابية القصوى')
    }

    const expectedReturn = amount * (farm.annual_return_rate / 100)
    const maturityDate = new Date()
    maturityDate.setMonth(maturityDate.getMonth() + 12)

    const investment: InvestmentInsert = {
      user_id: userId,
      farm_id: farmId,
      amount,
      shares,
      expected_return: expectedReturn,
      maturity_date: maturityDate.toISOString().split('T')[0]
    }

    const { data: newInvestment, error: investmentError } = await supabase
      .from('investments')
      .insert(investment)
      .select()
      .single()

    if (investmentError) throw investmentError

    const transaction: TransactionInsert = {
      user_id: userId,
      investment_id: newInvestment.id,
      type: 'investment',
      amount,
      status: 'completed',
      description_ar: `استثمار في ${farm.name_ar}`
    }

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert(transaction)

    if (transactionError) throw transactionError

    const { error: updateFarmError } = await supabase
      .from('farms')
      .update({ current_invested: farm.current_invested + amount })
      .eq('id', farmId)

    if (updateFarmError) throw updateFarmError

    const { error: updateProfileError } = await supabase.rpc('increment_user_investment', {
      user_id: userId,
      amount_to_add: amount
    })

    if (updateProfileError) {
      console.warn('Could not update user profile:', updateProfileError)
    }

    return newInvestment
  },

  async getInvestmentById(investmentId: string) {
    const { data, error } = await supabase
      .from('investments')
      .select(`
        *,
        farm:farms(*)
      `)
      .eq('id', investmentId)
      .single()

    if (error) throw error
    return data as unknown as InvestmentWithFarm
  },

  async getUserTransactions(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}
