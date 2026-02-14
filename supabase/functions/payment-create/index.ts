import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const TIERS: Record<string, { label: string; amount: number; credits_base: number; credits_bonus: number }> = {
  'tier_1':    { label: '1元',    amount: 1,    credits_base: 100,  credits_bonus: 0 },
  'tier_9.9':  { label: '9.9元',  amount: 9.9,  credits_base: 990,  credits_bonus: 100 },
  'tier_19.9': { label: '19.9元', amount: 19.9, credits_base: 1990, credits_bonus: 200 },
  'tier_39.9': { label: '39.9元', amount: 39.9, credits_base: 3990, credits_bonus: 704 },
  'tier_79.9': { label: '79.9元', amount: 79.9, credits_base: 7990, credits_bonus: 1998 },
}

async function md5(str: string): Promise<string> {
  const data = new TextEncoder().encode(str)
  const hashBuffer = await crypto.subtle.digest('MD5', data)
  const hashArray = new Uint8Array(hashBuffer)
  return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')
}

function buildSign(params: Record<string, string>, key: string): Promise<string> {
  const sorted = Object.keys(params)
    .filter(k => k !== 'sign' && k !== 'sign_type' && params[k] !== '')
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&')
  return md5(sorted + key)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const ZPAY_PID = Deno.env.get('ZPAY_PID')!
    const ZPAY_KEY = Deno.env.get('ZPAY_KEY')!
    const SITE_URL = Deno.env.get('SITE_URL') || ''

    const { tier_id, payment_method = 'alipay' } = await req.json()

    const tier = TIERS[tier_id]
    if (!tier) {
      throw new Error(`无效的充值档位: ${tier_id}`)
    }

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      throw new Error('未提供认证信息')
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      throw new Error('用户认证失败')
    }

    const timestamp = Date.now()
    const random4 = Math.floor(1000 + Math.random() * 9000)
    const order_no = `${timestamp}${random4}`

    const credits_total = tier.credits_base + tier.credits_bonus

    const { error: insertError } = await supabaseAdmin
      .from('payment_orders')
      .insert({
        user_id: user.id,
        order_no,
        amount: tier.amount,
        credits_base: tier.credits_base,
        credits_bonus: tier.credits_bonus,
        credits_total,
        status: 'pending',
        payment_method,
      })

    if (insertError) {
      console.error('[payment-create] Insert order error:', insertError)
      throw new Error('创建订单失败')
    }

    const payParams: Record<string, string> = {
      pid: ZPAY_PID,
      type: payment_method,
      out_trade_no: order_no,
      notify_url: `${SUPABASE_URL}/functions/v1/payment-webhook`,
      return_url: `${SITE_URL}/payment-result`,
      name: `灵犀积分充值-${tier.label}`,
      money: tier.amount.toFixed(2),
    }

    const sign = await buildSign(payParams, ZPAY_KEY)

    const queryString = Object.keys(payParams)
      .filter(k => k !== 'sign' && k !== 'sign_type' && payParams[k] !== '')
      .sort()
      .map(k => `${k}=${encodeURIComponent(payParams[k])}`)
      .join('&')

    const payment_url = `https://zpayz.cn/submit.php?${queryString}&sign=${sign}&sign_type=MD5`

    return new Response(JSON.stringify({ success: true, payment_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
