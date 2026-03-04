/**
 * Supabase Edge Function: AI Video Analysis (方法论融合版)
 * 使用豆包 2.0 Pro 进行视频深度分析 + Gemini 2.5 Flash Image 生成可视化报告
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { generateReportPrompt } from "./report-prompt-template.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 薛辉短视频创作方法论 System Prompt
const METHODOLOGY_SYSTEM_PROMPT = `你是短视频分析专家，精通薛辉短视频创作方法论。

核心评估框架：
1. 选题评估：是否触及用户痛点/爽点/痒点，是否符合账号定位
2. 脚本类型识别：晒过程/聊观点/教知识/讲故事
3. 爆款元素检测（8大元素）：反差、共鸣、新奇、实用、争议、颜值、情绪、热点
4. 钩子设计分析：前3秒是否抓人，是否使用悬念/冲突/提问/反常识
5. 完播率预测：节奏控制、信息密度、情绪曲线

请基于以上框架，对视频进行深度分析，识别爆点、优点、缺点，并给出优化建议。

**重要**：你的回复必须是纯 JSON 格式，不要包含任何 markdown 标记（如 \`\`\`json）或其他文字说明。`

// 分析 User Prompt
const ANALYSIS_USER_PROMPT = `你是一位资深短视频创作导师，正在拆解一个爆款视频。用户下载了这个视频是为了学习它的成功方法论。

**分析目标**：拆解这个视频为什么能成为爆款，提取可复制的方法论。

返回以下 JSON 结构：

{
  "basic_info": {
    "duration": 视频时长（秒）,
    "scene_count": 场景数量,
    "main_characters": ["人物描述1", "人物描述2"]
  },
  "viral_analysis": {
    "why_viral": "这个视频为什么能火？核心成功因素（100字以内）",
    "key_techniques": ["技巧1", "技巧2", "技巧3"]
  },
  "topic_analysis": {
    "topic_type": "选题类型",
    "pain_point": "触及的痛点/爽点",
    "target_audience": "目标受众",
    "score": 选题质量评分（0-100）,
    "topic_formula": "选题公式（如：痛点+解决方案）",
    "replication_tips": "如何复制这个选题思路？"
  },
  "script_type": {
    "primary_type": "晒过程/聊观点/教知识/讲故事",
    "confidence": 置信度（0-100）
  },
  "script_structure": {
    "structure_breakdown": [
      {
        "time_range": "0-3秒",
        "content": "内容描述",
        "purpose": "作用",
        "replicable_pattern": "可复制的套路"
      }
    ],
    "script_formula": "脚本公式"
  },
  "viral_elements": {
    "detected": ["检测到的爆款元素"],
    "missing": ["缺失的爆款元素"],
    "highlight_moments": [
      {
        "element": "元素名称",
        "timestamp": 时间戳（秒）,
        "description": "描述",
        "why_works": "为什么有效",
        "how_to_copy": "如何复制"
      }
    ]
  },
  "hook_analysis": {
    "first_3_seconds": "前3秒内容",
    "hook_type": "钩子类型（送温暖/金钱/怀旧/对抗/意外惊喜/盲盒/验证/解密/整蛊/荷尔蒙）",
    "effectiveness_score": 有效性评分（0-100）,
    "hook_formula": "钩子公式",
    "suggestions": ["应用建议1", "应用建议2"]
  },
  "completion_prediction": {
    "predicted_rate": 预测完播率（0-100）,
    "pacing_score": 节奏控制评分（0-100）,
    "info_density_score": 信息密度评分（0-100）,
    "emotion_curve": "情绪曲线描述",
    "retention_techniques": ["留人技巧1", "留人技巧2"]
  },
  "copywriting_patterns": {
    "opening_line": "开篇第一句",
    "key_phrases": ["关键话术1", "关键话术2"],
    "closing_cta": "结尾号召"
  },
  "visual_techniques": {
    "shooting_style": "拍摄手法",
    "editing_rhythm": "剪辑节奏",
    "key_techniques": ["技巧1", "技巧2"]
  },
  "strengths": ["优点1", "优点2", "优点3"],
  "weaknesses": ["可改进点1", "可改进点2"],
  "optimization_suggestions": [
    {
      "priority": "high/medium/low",
      "category": "类别",
      "suggestion": "具体建议"
    }
  ],
  "replication_guide": {
    "top_3_learnings": ["学习点1", "学习点2", "学习点3"],
    "quick_wins": ["快速见效的技巧1", "快速见效的技巧2"],
    "step_by_step": ["步骤1", "步骤2", "步骤3"]
  },
  "overall_scores": {
    "viral_potential": 爆款潜力（0-100）,
    "topic_quality": 选题质量（0-100）,
    "script_structure": 脚本结构（0-100）,
    "visual_presentation": 视觉呈现（0-100）,
    "completion_expectation": 完播预期（0-100）
  }
}

请确保返回的是纯 JSON，不要包含任何其他文字。`

serve(async (req) => {
  // 处理 CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let supabaseAdmin: ReturnType<typeof createClient> | null = null
  let userId: string | null = null
  let fixedCreditOperationId: string | null = null
  let fixedCreditOperationFeatureCode: string | null = null

  const finalizeFixedCreditOperation = async (isSuccess: boolean, errorMessage?: string) => {
    if (!supabaseAdmin || !userId || !fixedCreditOperationId || !fixedCreditOperationFeatureCode) return
    try {
      const { data: finalizeResult, error: finalizeError } = await supabaseAdmin.rpc('finalize_credit_operation', {
        p_user_id: userId,
        p_operation_id: fixedCreditOperationId,
        p_feature_code: fixedCreditOperationFeatureCode,
        p_success: isSuccess,
        p_error_message: errorMessage || null,
      })
      if (finalizeError || !finalizeResult?.success) {
        console.error('[ai-video-analysis] finalize_credit_operation failed:', finalizeError || finalizeResult)
      }
    } catch (finalizeErr) {
      console.error('[ai-video-analysis] finalize_credit_operation exception:', finalizeErr)
    }
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const DOUBAO_API_KEY = Deno.env.get('DOUBAO_API_KEY')
    const DOUBAO_API_BASE_URL = Deno.env.get('DOUBAO_API_BASE_URL') || 'https://ark.cn-beijing.volces.com'
    const BLTCY_API_KEY = Deno.env.get('BLTCY_API_KEY')
    const BLTCY_API_BASE_URL = 'https://api.bltcy.ai'

    if (!DOUBAO_API_KEY) {
      throw new Error('DOUBAO_API_KEY not configured')
    }

    if (!BLTCY_API_KEY) {
      throw new Error('BLTCY_API_KEY not configured')
    }

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !token) {
      return new Response(JSON.stringify({ error: '用户认证失败，请重新登录' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: '用户认证失败，请重新登录' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    userId = user.id

    const { action, video_url, video_path, video_filename, feature_code, session_id } = await req.json()

    // ========== Action: create_session ==========
    // 创建会话并立即返回，不等待分析完成
    if (action === 'create_session') {
      if (!video_url || !video_filename || !video_path) {
        throw new Error('video_url, video_filename, and video_path are required')
      }

      // 积分扣费（200 积分）
      const operationId = crypto.randomUUID()
      fixedCreditOperationId = operationId
      fixedCreditOperationFeatureCode = feature_code || 'ai_video_analysis'

      const { data: beginResult, error: beginError } = await supabaseAdmin.rpc('begin_credit_operation', {
        p_user_id: userId,
        p_operation_id: operationId,
        p_feature_code: fixedCreditOperationFeatureCode,
        p_amount: '200',
        p_description: '视频深度拉片分析',
      })

      if (beginError || !beginResult?.success) {
        const currentBalance = Number(beginResult?.balance || 0).toFixed(2)
        const errMsg = beginResult?.error === 'INSUFFICIENT_BALANCE'
          ? `积分不足，需要 200 积分，当前余额 ${currentBalance}`
          : '积分扣减失败'
        return new Response(JSON.stringify({ error: errMsg }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log(`[ai-video-analysis] Deducted 200 credits from user ${userId}`)

      // 创建会话（状态为 pending）
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('video_analysis_sessions')
        .insert({
          user_id: userId,
          video_filename,
          video_url,
          video_path,
          status: 'pending',
          credits_cost: 200,
          operation_id: operationId,
        })
        .select()
        .single()

      if (sessionError) {
        await finalizeFixedCreditOperation(false, `创建会话失败: ${sessionError.message}`)
        throw new Error(`创建会话失败: ${sessionError.message}`)
      }

      // 标记积分操作为进行中（分析完成后再 finalize）
      console.log(`[ai-video-analysis] Session created: ${session.id}, status: pending`)

      // 立即返回会话信息
      return new Response(JSON.stringify({
        success: true,
        session,
        message: '会话创建成功，正在后台分析中...'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ========== Action: process_analysis ==========
    // 后台处理分析（可能超时，但不影响前端）
    if (action === 'process_analysis') {
      if (!session_id) {
        throw new Error('session_id is required')
      }

      // 获取会话信息
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('video_analysis_sessions')
        .select('*')
        .eq('id', session_id)
        .eq('user_id', userId)
        .single()

      if (sessionError || !session) {
        throw new Error('会话不存在或无权访问')
      }

      if (session.status !== 'pending') {
        return new Response(JSON.stringify({
          success: true,
          message: '会话已在处理中或已完成'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // 更新状态为 analyzing
      await supabaseAdmin
        .from('video_analysis_sessions')
        .update({ status: 'analyzing' })
        .eq('id', session_id)

      console.log(`[ai-video-analysis] Starting analysis for session ${session_id}`)

      // 使用会话中存储的 operation_id
      fixedCreditOperationId = session.operation_id
      fixedCreditOperationFeatureCode = 'ai_video_analysis'

      try {
        // 1. 调用豆包 API 分析视频
        console.log('[ai-video-analysis] Calling Doubao API with video_url:', session.video_url)
        console.log('[ai-video-analysis] This may take several minutes for large videos')

        const doubaoStartTime = Date.now()

        // 构建豆包 API 请求体
        const requestBody = {
          model: 'doubao-seed-2-0-pro-260215',
          messages: [
            {
              role: 'system',
              content: METHODOLOGY_SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'video_url',
                  video_url: {
                    url: session.video_url,
                  },
                },
                {
                  type: 'text',
                  text: ANALYSIS_USER_PROMPT,
                },
              ],
            },
          ],
          temperature: 0.7,
        }

        console.log('[ai-video-analysis] Request body:', JSON.stringify(requestBody, null, 2).substring(0, 800))

        const doubaoResponse = await fetch(`${DOUBAO_API_BASE_URL}/api/v3/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DOUBAO_API_KEY}`,
          },
          body: JSON.stringify(requestBody),
        })

        if (!doubaoResponse.ok) {
          const errorText = await doubaoResponse.text()
          const doubaoElapsed = ((Date.now() - doubaoStartTime) / 1000).toFixed(1)
          console.error('[ai-video-analysis] Doubao API error:', {
            status: doubaoResponse.status,
            statusText: doubaoResponse.statusText,
            error: errorText,
            elapsedSeconds: doubaoElapsed,
          })
          throw new Error(`Doubao API error: ${doubaoResponse.status} ${errorText}`)
        }

        const doubaoElapsed = ((Date.now() - doubaoStartTime) / 1000).toFixed(1)
        console.log(`[ai-video-analysis] Doubao API responded in ${doubaoElapsed}s`)

        const doubaoResult = await doubaoResponse.json()
        console.log('[ai-video-analysis] Doubao API response structure:', JSON.stringify(doubaoResult, null, 2).substring(0, 1000))

        // 尝试多种可能的响应格式
        let analysisText = ''

        // 格式 1: { output: { text: "..." } }
        if (doubaoResult?.output?.text) {
          analysisText = doubaoResult.output.text
          console.log('[ai-video-analysis] Using format: output.text')
        }
        // 格式 2: { choices: [{ message: { content: "..." } }] }
        else if (doubaoResult?.choices?.[0]?.message?.content) {
          analysisText = doubaoResult.choices[0].message.content
          console.log('[ai-video-analysis] Using format: choices[0].message.content')
        }
        // 格式 3: { result: { text: "..." } }
        else if (doubaoResult?.result?.text) {
          analysisText = doubaoResult.result.text
          console.log('[ai-video-analysis] Using format: result.text')
        }
        // 格式 4: { response: { text: "..." } }
        else if (doubaoResult?.response?.text) {
          analysisText = doubaoResult.response.text
          console.log('[ai-video-analysis] Using format: response.text')
        }
        // 格式 5: { data: { output: { text: "..." } } }
        else if (doubaoResult?.data?.output?.text) {
          analysisText = doubaoResult.data.output.text
          console.log('[ai-video-analysis] Using format: data.output.text')
        }
        // 格式 6: { text: "..." } (直接在顶层)
        else if (doubaoResult?.text) {
          analysisText = doubaoResult.text
          console.log('[ai-video-analysis] Using format: text')
        }
        // 格式 7: { content: "..." }
        else if (doubaoResult?.content) {
          analysisText = doubaoResult.content
          console.log('[ai-video-analysis] Using format: content')
        }

        if (!analysisText) {
          console.error('[ai-video-analysis] Could not find text in response. Available keys:', Object.keys(doubaoResult))
          console.error('[ai-video-analysis] Full response:', JSON.stringify(doubaoResult))
          throw new Error('Doubao API returned empty response - check logs for response structure')
        }

        // 解析 JSON 结果
        let analysisResult
        try {
          const cleanedText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          analysisResult = JSON.parse(cleanedText)
        } catch (parseError) {
          console.error('[ai-video-analysis] Failed to parse Doubao response:', analysisText)
          throw new Error('分析结果解析失败，请重试')
        }

        console.log('[ai-video-analysis] Doubao analysis completed')

        // 2. 不再生成图片，直接保存分析结果到数据库
        console.log('[ai-video-analysis] Saving analysis result...')

        // 3. 删除 Supabase Storage 中的视频文件
        if (session.video_path) {
          try {
            await supabaseAdmin.storage.from('user-uploads').remove([session.video_path])
            console.log('[ai-video-analysis] Video file deleted from Supabase Storage:', session.video_path)
          } catch (deleteError) {
            console.error('[ai-video-analysis] Failed to delete video:', deleteError)
          }
        }

        // 4. 更新会话结果（不再保存图片 URL）
        const { data: updatedSession, error: updateError } = await supabaseAdmin
          .from('video_analysis_sessions')
          .update({
            status: 'completed',
            analysis_result: analysisResult,
            completed_at: new Date().toISOString(),
          })
          .eq('id', session.id)
          .select()
          .single()

        if (updateError) {
          throw new Error(`更新会话失败: ${updateError.message}`)
        }

        // 标记积分操作成功
        await finalizeFixedCreditOperation(true)
        console.log('[ai-video-analysis] Analysis completed successfully')

        return new Response(JSON.stringify({
          success: true,
          session: updatedSession,
          message: '分析完成'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (apiError) {
        console.error('[ai-video-analysis] Analysis failed:', apiError)

        // 更新会话状态为 failed
        await supabaseAdmin
          .from('video_analysis_sessions')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', session_id)

        // 使用 finalize_credit_operation 退款
        await finalizeFixedCreditOperation(false, `视频分析失败: ${apiError.message}`)
        console.log('[ai-video-analysis] Credits refunded')

        return new Response(JSON.stringify({
          success: false,
          error: apiError.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // ========== Action: get_status ==========
    if (action === 'get_status') {
      if (!session_id) {
        throw new Error('session_id is required')
      }

      const { data: session, error: sessionError } = await supabaseAdmin
        .from('video_analysis_sessions')
        .select('*')
        .eq('id', session_id)
        .eq('user_id', userId)
        .single()

      if (sessionError || !session) {
        return new Response(JSON.stringify({ error: '会话不存在或无权访问' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true, session }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[ai-video-analysis] Error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
