/**
 * Supabase Edge Function: AI Chat
 * 代理 ZenMux API 调用，保护 API Key
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 智能体系统提示词
const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  xiaohongshu: `你是一个专业的小红书文案创作专家。
你的任务是帮助用户创作吸引人的小红书笔记。

创作要求：
- 标题要吸引眼球，可以使用数字、悬念、情感词
- 适当使用emoji表情符号增加活力
- 语言口语化、亲切自然
- 内容要有真实感和互动性
- 加入话题标签 #
- 结构清晰：开头吸引→正文干货→结尾互动

请直接输出文案内容，不要解释你在做什么。`,

  douyin: `你是一个专业的抖音短视频文案策划师。
你的任务是帮助用户创作抖音爆款视频文案。

创作要求：
- 开头3秒必须抓住注意力（悬念/冲突/好奇）
- 节奏紧凑，语言简洁有力
- 口语化表达，适合口播
- 有记忆点和金句
- 结尾引导互动（点赞、关注、评论）
- 加入热门话题 #

请直接输出文案内容，不要解释你在做什么。`,

  weixin: `你是一个资深的微信公众号内容创作者。
你的任务是帮助用户撰写高质量的公众号文章。

创作要求：
- 标题精炼有吸引力
- 开头引入话题，建立共鸣
- 内容有深度、有价值
- 逻辑清晰，层次分明
- 善用金句，引发思考
- 结尾升华主题或引导互动
- 使用适当的markdown格式

请直接输出文案内容，不要解释你在做什么。`,

  ad: `你是一个资深的广告文案策划专家。
你的任务是帮助用户创作高转化率的营销广告文案。

创作要求：
- 突出核心卖点
- 制造紧迫感和稀缺性
- 明确的行动号召 (CTA)
- 简洁有力，直击痛点
- 数据和案例增加可信度
- 符合广告法规范

请直接输出文案内容，不要解释你在做什么。`,

  product: `你是一个专业的产品文案撰写专家。
你的任务是帮助用户创作产品详情页和卖点文案。

创作要求：
- 精准提炼核心卖点
- 场景化描述，解决用户痛点
- 用数据和案例支撑
- 突出产品差异化优势
- 清晰的产品规格说明
- 增强信任感的表达

请直接输出文案内容，不要解释你在做什么。`,

  general: `你是一个专业的文案创作助手。
你的任务是根据用户需求创作高质量的文案内容。

创作要求：
- 理解用户意图，精准表达
- 结构清晰，逻辑通顺
- 语言流畅，重点突出
- 根据场景调整语气风格
- 使用适当的格式排版

请直接输出文案内容，不要解释你在做什么。`,
}

serve(async (req) => {
  // 处理 CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 获取环境变量中的 API Key
    const ZENMUX_API_KEY = Deno.env.get('ZENMUX_API_KEY')
    const ZENMUX_BASE_URL = Deno.env.get('ZENMUX_BASE_URL') || 'https://zenmux.ai/api/v1'
    // 文案生成使用 Gemini 2.5 Flash
    const ZENMUX_MODEL = Deno.env.get('ZENMUX_MODEL') || 'google/gemini-2.5-flash'

    if (!ZENMUX_API_KEY) {
      throw new Error('ZENMUX_API_KEY not configured')
    }

    // 解析请求
    const { prompt, agentId, history, stream = true } = await req.json()

    if (!prompt) {
      throw new Error('prompt is required')
    }

    // 构建消息
    const systemPrompt = AGENT_SYSTEM_PROMPTS[agentId] || AGENT_SYSTEM_PROMPTS.general
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: prompt },
    ]

    // 调用 ZenMux API
    const response = await fetch(`${ZENMUX_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZENMUX_API_KEY}`,
      },
      body: JSON.stringify({
        model: ZENMUX_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ZenMux API error: ${response.status} - ${error}`)
    }

    // 流式响应
    if (stream) {
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // 非流式响应
    const data = await response.json()
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
