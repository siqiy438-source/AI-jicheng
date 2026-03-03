/**
 * Supabase Edge Function: AI Video Analysis (方法论融合版)
 * 使用豆包 2.0 Pro 进行视频深度分析 + Gemini 2.5 Flash Image 生成可视化报告
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
const ANALYSIS_USER_PROMPT = `请对这个视频进行全方位分析，返回以下 JSON 结构：

{
  "basic_info": {
    "duration": 视频时长（秒）,
    "scene_count": 场景数量,
    "main_characters": ["人物描述1", "人物描述2"]
  },
  "topic_analysis": {
    "topic_type": "选题类型",
    "pain_point": "触及的痛点/爽点/痒点",
    "target_audience": "目标受众",
    "score": 选题质量评分（0-100）
  },
  "script_type": {
    "primary_type": "晒过程/聊观点/教知识/讲故事",
    "confidence": 置信度（0-100）
  },
  "viral_elements": {
    "detected": ["检测到的爆款元素"],
    "missing": ["缺失的爆款元素"],
    "highlight_moments": [
      {
        "element": "元素名称",
        "timestamp": 时间戳（秒）,
        "description": "描述"
      }
    ]
  },
  "hook_analysis": {
    "first_3_seconds": "前3秒内容描述",
    "hook_type": "钩子类型（悬念/冲突/提问/反常识）",
    "effectiveness_score": 有效性评分（0-100）,
    "suggestions": ["优化建议1", "优化建议2"]
  },
  "completion_prediction": {
    "predicted_rate": 预测完播率（0-100）,
    "pacing_score": 节奏控制评分（0-100）,
    "info_density_score": 信息密度评分（0-100）,
    "emotion_curve": "情绪曲线描述"
  },
  "strengths": ["优点1", "优点2", "优点3"],
  "weaknesses": ["缺点1", "缺点2", "缺点3"],
  "optimization_suggestions": [
    {
      "priority": "high/medium/low",
      "category": "类别",
      "suggestion": "具体建议"
    }
  ],
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
    const ZENMUX_API_KEY = Deno.env.get('ZENMUX_API_KEY')
    const ZENMUX_API_BASE_URL = Deno.env.get('ZENMUX_API_BASE_URL') || 'https://api.zenmux.com'

    if (!DOUBAO_API_KEY) {
      throw new Error('DOUBAO_API_KEY not configured')
    }

    if (!ZENMUX_API_KEY) {
      throw new Error('ZENMUX_API_KEY not configured')
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

    const { action, video_url, video_path, video_filename, keyframes, feature_code, session_id } = await req.json()

    // ========== Action: analyze ==========
    if (action === 'analyze') {
      if (!video_url || !video_filename || !keyframes || !Array.isArray(keyframes)) {
        throw new Error('video_url, video_filename, and keyframes are required')
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

      // 创建会话
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('video_analysis_sessions')
        .insert({
          user_id: userId,
          video_filename,
          video_url,
          status: 'analyzing',
          credits_cost: 200,
          keyframes: keyframes.map((kf: string, idx: number) => ({
            timestamp: idx * 10, // 简化处理
            data_url: kf,
          })),
        })
        .select()
        .single()

      if (sessionError) {
        await finalizeFixedCreditOperation(false, `创建会话失败: ${sessionError.message}`)
        throw new Error(`创建会话失败: ${sessionError.message}`)
      }

      try {
        // 1. 调用豆包 API 分析视频
        console.log('[ai-video-analysis] Calling Doubao API...')
        const doubaoResponse = await fetch(`${DOUBAO_API_BASE_URL}/api/v3/responses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DOUBAO_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'doubao-seed-2-0-pro-260215',
            input: [
              {
                role: 'system',
                content: METHODOLOGY_SYSTEM_PROMPT,
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'input_video',
                    video_url: video_url,
                    fps: 1,
                  },
                  {
                    type: 'input_text',
                    text: ANALYSIS_USER_PROMPT,
                  },
                ],
              },
            ],
            max_tokens: 4000,
            temperature: 0.7,
          }),
        })

        if (!doubaoResponse.ok) {
          const errorText = await doubaoResponse.text()
          throw new Error(`Doubao API error: ${doubaoResponse.status} ${errorText}`)
        }

        const doubaoResult = await doubaoResponse.json()
        const analysisText = doubaoResult?.output?.text || doubaoResult?.choices?.[0]?.message?.content || ''

        if (!analysisText) {
          throw new Error('Doubao API returned empty response')
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

        // 2. 生成可视化报告（使用 Gemini 2.5 Flash Image）
        console.log('[ai-video-analysis] Generating visualization report...')
        
        // 构建报告生成 Prompt
        const reportPrompt = `生成一张深色主题的视频分析报告长图，要求：

视觉风格：
- 深色背景（#1a1a2e, #16213e）
- 科技蓝 + 荧光绿 + 渐变紫配色
- 数据可视化风格，类似专业分析报告

布局结构（从上到下）：
1. 封面区：标题"视频深度拉片报告" + 关键帧横向排列 + 基础信息
2. 雷达图：5维度评分（爆款潜力${analysisResult.overall_scores.viral_potential}/选题质量${analysisResult.overall_scores.topic_quality}/脚本结构${analysisResult.overall_scores.script_structure}/视觉呈现${analysisResult.overall_scores.visual_presentation}/完播预期${analysisResult.overall_scores.completion_expectation}）
3. 爆款元素：已检出${analysisResult.viral_elements.detected.join('、')}，缺失${analysisResult.viral_elements.missing.join('、')}
4. 钩子分析：${analysisResult.hook_analysis.first_3_seconds}，有效性${analysisResult.hook_analysis.effectiveness_score}分
5. 完播率预测：${analysisResult.completion_prediction.predicted_rate}%
6. 优缺点对比：优点${analysisResult.strengths.join('、')}；缺点${analysisResult.weaknesses.join('、')}
7. 优化建议：${analysisResult.optimization_suggestions.map(s => s.suggestion).join('；')}
8. 底部：基于薛辉短视频创作方法论

请生成专业的数据可视化报告长图。`

        const geminiResponse = await fetch(`${ZENMUX_API_BASE_URL}/v1/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ZENMUX_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gemini-2.5-flash-image',
            prompt: reportPrompt,
            n: 1,
            size: '1024x1792', // 长图比例
          }),
        })

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text()
          console.error('[ai-video-analysis] Gemini API error:', errorText)
          throw new Error(`报告生成失败: ${geminiResponse.status}`)
        }

        const geminiResult = await geminiResponse.json()
        const reportImageUrl = geminiResult?.data?.[0]?.url || null

        if (!reportImageUrl) {
          throw new Error('报告图片生成失败')
        }

        console.log('[ai-video-analysis] Report generated successfully')

        // 3. 删除视频文件
        if (video_path) {
          try {
            await supabaseAdmin.storage.from('user-uploads').remove([video_path])
            console.log('[ai-video-analysis] Video file deleted:', video_path)
          } catch (deleteError) {
            console.error('[ai-video-analysis] Failed to delete video:', deleteError)
          }
        }

        // 4. 更新会话结果
        const { data: updatedSession, error: updateError } = await supabaseAdmin
          .from('video_analysis_sessions')
          .update({
            status: 'completed',
            analysis_result: analysisResult,
            report_image_url: reportImageUrl,
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

        return new Response(JSON.stringify({ success: true, session: updatedSession }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (apiError) {
        // API 调用失败，标记积分操作失败（自动退款）
        await finalizeFixedCreditOperation(false, apiError.message)

        // 更新会话状态为 failed
        await supabaseAdmin
          .from('video_analysis_sessions')
          .update({ status: 'failed' })
          .eq('id', session.id)

        throw apiError
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
