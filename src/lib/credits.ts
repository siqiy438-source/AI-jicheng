import { supabase } from './supabase'

export const RECHARGE_TIERS = [
  { id: 'tier_1', amount: 1, amountCents: 100, pointsBase: 100, pointsBonus: 0, pointsTotal: 100, label: '1元', badge: null },
  { id: 'tier_9.9', amount: 9.9, amountCents: 990, pointsBase: 990, pointsBonus: 100, pointsTotal: 1090, label: '9.9元', badge: null },
  { id: 'tier_19.9', amount: 19.9, amountCents: 1990, pointsBase: 1990, pointsBonus: 200, pointsTotal: 2190, label: '19.9元', badge: '热门' },
  { id: 'tier_39.9', amount: 39.9, amountCents: 3990, pointsBase: 3990, pointsBonus: 704, pointsTotal: 4694, label: '39.9元', badge: '超值' },
  { id: 'tier_79.9', amount: 79.9, amountCents: 7990, pointsBase: 7990, pointsBonus: 1998, pointsTotal: 9988, label: '79.9元', badge: '最划算' },
] as const

export const FEATURE_PRICES: Record<string, { name: string; cost: number }> = {
  ai_image_standard: { name: '标准绘图', cost: 50 },
  ai_image_premium: { name: 'Pro绘图', cost: 100 },
  ai_display_standard: { name: '陈列图(标准)', cost: 50 },
  ai_display_premium: { name: '陈列图(Pro)', cost: 100 },
  ai_outfit_standard: { name: '挂搭图(标准)', cost: 50 },
  ai_outfit_premium: { name: '挂搭图(Pro)', cost: 100 },
  ai_fashion_standard: { name: '模特图(标准)', cost: 50 },
  ai_fashion_premium: { name: '模特图(Pro)', cost: 100 },
  ai_detail_standard: { name: '细节特写(标准)', cost: 50 },
  ai_detail_premium: { name: '细节特写(Pro)', cost: 100 },
  ai_flatlay_standard: { name: '平铺摆拍(标准)', cost: 50 },
  ai_flatlay_premium: { name: '平铺摆拍(Pro)', cost: 100 },
  ai_copywriting: { name: 'AI文案', cost: 20 },
  ai_ppt_outline: { name: 'PPT大纲', cost: 30 },
  ai_ppt_slide: { name: 'PPT单页', cost: 50 },
  ai_report_page: { name: '报告(每页)', cost: 40 },
  ai_outfit_recommend: { name: '专业搭配师', cost: 20 },
  ai_fabric_analysis: { name: '面料说明生成器', cost: 10 },
}

export async function getBalance() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()
  return data?.credits ?? null
}

export async function getPaymentOrders(page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error, count } = await supabase
    .from('payment_orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)
  return { data, error, count }
}

export async function getCreditTransactions(page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error, count } = await supabase
    .from('credit_transactions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)
  return { data, error, count }
}

export function getFeatureCost(featureCode: string): number {
  return FEATURE_PRICES[featureCode]?.cost ?? 0
}
