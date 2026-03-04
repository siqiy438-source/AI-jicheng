/**
 * Supabase Edge Function: 清理旧的视频分析会话
 * 用于清理可能导致约束错误的旧数据
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 处理 CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Missing environment variables')
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // 1. 删除状态不在允许列表中的会话
    const { error: deleteInvalidStatusError } = await supabaseAdmin
      .from('video_analysis_sessions')
      .delete()
      .not('status', 'in', '(pending,analyzing,completed,failed)')

    if (deleteInvalidStatusError) {
      console.error('Error deleting invalid status sessions:', deleteInvalidStatusError)
    }

    // 2. 删除7天前的旧会话
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { error: deleteOldError } = await supabaseAdmin
      .from('video_analysis_sessions')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('created_at', sevenDaysAgo.toISOString())

    if (deleteOldError) {
      console.error('Error deleting old sessions:', deleteOldError)
    }

    // 3. 获取清理后的统计信息
    const { count, error: countError } = await supabaseAdmin
      .from('video_analysis_sessions')
      .select('*', { count: 'exact', head: true })

    return new Response(JSON.stringify({
      success: true,
      message: '清理完成',
      remaining_sessions: count || 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[cleanup-sessions] Error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
