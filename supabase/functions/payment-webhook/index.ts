import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

async function md5(str: string): Promise<string> {
  const data = new TextEncoder().encode(str)
  const hashBuffer = await crypto.subtle.digest('MD5', data)
  const hashArray = new Uint8Array(hashBuffer)
  return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function buildSign(params: Record<string, string>, key: string): Promise<string> {
  const sorted = Object.keys(params)
    .filter(k => k !== 'sign' && k !== 'sign_type' && params[k] !== '')
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&')
  return md5(sorted + key)
}

serve(async (req) => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const ZPAY_KEY = Deno.env.get('ZPAY_KEY')!

  try {
    const url = new URL(req.url)
    const searchParams = url.searchParams

    const receivedSign = searchParams.get('sign') || ''
    const params: Record<string, string> = {}
    for (const key of ['pid', 'name', 'money', 'out_trade_no', 'trade_no', 'trade_status', 'type', 'param']) {
      params[key] = searchParams.get(key) || ''
    }

    const expectedSign = await buildSign(params, ZPAY_KEY)
    if (receivedSign !== expectedSign) {
      console.error('[payment-webhook] Signature mismatch', { receivedSign, expectedSign, params })
      return new Response('success', { status: 200 })
    }

    if (params.trade_status !== 'TRADE_SUCCESS') {
      console.log('[payment-webhook] Trade not success:', params.trade_status)
      return new Response('success', { status: 200 })
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data: order, error: queryError } = await supabaseAdmin
      .from('payment_orders')
      .select('*')
      .eq('order_no', params.out_trade_no)
      .single()

    if (queryError || !order) {
      console.error('[payment-webhook] Order not found:', params.out_trade_no, queryError)
      return new Response('success', { status: 200 })
    }

    if (order.status === 'paid') {
      console.log('[payment-webhook] Order already paid:', params.out_trade_no)
      return new Response('success', { status: 200 })
    }

    const receivedMoney = parseFloat(params.money)
    if (Math.abs(receivedMoney - order.amount) > 0.01) {
      console.error('[payment-webhook] Amount mismatch', { received: receivedMoney, expected: order.amount })
      return new Response('success', { status: 200 })
    }

    // 原子更新：仅当 status 仍为 pending 时才更新，防止并发回调重复加积分
    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from('payment_orders')
      .update({
        status: 'paid',
        trade_no: params.trade_no,
        paid_at: new Date().toISOString(),
      })
      .eq('order_no', params.out_trade_no)
      .eq('status', 'pending')
      .select()

    if (updateError) {
      console.error('[payment-webhook] Update order error:', updateError)
      return new Response('success', { status: 200 })
    }

    if (!updatedRows || updatedRows.length === 0) {
      console.log('[payment-webhook] Order already processed (concurrent):', params.out_trade_no)
      return new Response('success', { status: 200 })
    }

    const { error: rpcError } = await supabaseAdmin.rpc('add_credits', {
      p_user_id: order.user_id,
      p_amount: order.credits_total,
    })

    if (rpcError) {
      console.error('[payment-webhook] add_credits RPC error:', rpcError)
    }

    console.log('[payment-webhook] Payment processed:', params.out_trade_no, 'credits:', order.credits_total)
    return new Response('success', { status: 200 })

  } catch (error) {
    console.error('[payment-webhook] Unexpected error:', error)
    return new Response('success', { status: 200 })
  }
})