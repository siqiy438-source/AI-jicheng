/**
 * Supabase Edge Function: Line Health Check
 * 并行探测各 AI 线路的连通性，返回每条线路的健康状态
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Status = 'normal' | 'degraded' | 'down'

interface ProbeResult {
  status: Status
  latencyMs: number | null
}

async function probeEndpoint(url: string, apiKey: string, timeoutMs = 5000): Promise<ProbeResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const start = Date.now()

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: controller.signal,
    })
    clearTimeout(timer)
    const latencyMs = Date.now() - start

    if (!response.ok) {
      return { status: 'down', latencyMs }
    }
    if (latencyMs > 3000) {
      return { status: 'degraded', latencyMs }
    }
    return { status: 'normal', latencyMs }
  } catch (error) {
    clearTimeout(timer)
    const latencyMs = Date.now() - start
    // AbortError = timeout，其他 = 网络错误，均视为 down
    return { status: 'down', latencyMs: (error as Error).name === 'AbortError' ? null : latencyMs }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const BLTCY_API_KEY = Deno.env.get('BLTCY_API_KEY') || ''
  const ZENMUX_API_KEY = Deno.env.get('ZENMUX_API_KEY') || ''

  // BLTCY 探测 /v1/models（轻量端点，不触发计费）
  // ZenMux 探测 vertex-ai 的模型列表端点
  const [bltcy, zenmux] = await Promise.all([
    probeEndpoint('https://api.bltcy.ai/v1/models', BLTCY_API_KEY),
    probeEndpoint('https://zenmux.ai/api/vertex-ai/v1/models', ZENMUX_API_KEY),
  ])

  // BLTCY 4条线路共享同一 API 域名，状态相同
  // ZenMux Pro 独立一条线路
  const results = [
    { id: 'speed',       status: bltcy.status,  latencyMs: bltcy.latencyMs },
    { id: 'standard',    status: bltcy.status,  latencyMs: bltcy.latencyMs },
    { id: 'standard_2k', status: bltcy.status,  latencyMs: bltcy.latencyMs },
    { id: 'standard_4k', status: bltcy.status,  latencyMs: bltcy.latencyMs },
    { id: 'premium',     status: zenmux.status, latencyMs: zenmux.latencyMs },
  ]

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
