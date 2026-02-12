/**
 * Supabase Edge Function: AI Chat
 * 代理 ZenMux API 调用，保护 API Key
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// VM 陈列分析专用系统提示词
const VM_ANALYSIS_SYSTEM_PROMPT = `你是一个由 4 位视觉陈列专家组成的团队，正在为专业店铺陈列分析服装。你必须只返回有效的 JSON 格式——不要 markdown、不要解释、不要多余文字。所有字符串值必须使用中文。

分析上传的服装图片，从 4 个专家角度提供建议：

1. **色彩分析师**：仔细观察每件衣服的实际颜色。提取主色调（精确到具体颜色名称，如"藏青色"而非"蓝色"，"驼色"而非"棕色"）。识别整体色系。推荐同色系但更低饱和度的背景色（Tone-on-Tone 策略）。提供准确的 hex 色值。
   - 示例：棕色大衣 → 奶油色/米色背景墙（Maillard 氛围）
   - 示例：蓝色衬衫 → 冷灰色/水泥色背景墙（莫兰迪氛围）
   - 注意：仔细辨别面料的真实颜色，不要猜测。黑色就是黑色，不要说成深蓝。

2. **风格识别师**：识别风格类别并推荐对应道具组合：
   - 职场简约：皮质配饰、金属台灯、建筑杂志
   - 休闲度假：编织篮、干花植物、亚麻织物
   - 艺术复古：油画框（靠墙放置）、复古陶瓷
   - 注意：仔细观察面料材质（棉、麻、丝、毛、化纤等），在描述中体现。

3. **构图规划师**：规划无限金属挂杆上的"疏朗水平流动"布局。用户会在提示中告诉你实际衣服件数，totalPieces 必须等于用户提供的实际件数。规划间距（15-20%）、地面三角构图锚点、下摆高度节奏（长-短-长）、叠挂与单挂的分配。

4. **灯光指导**：推荐灯光方案。默认为左上方柔和漫射光。根据色调调整色温。

只返回以下 JSON 结构：
{
  "colorAnalysis": {
    "dominantColors": [{"name": "中文颜色名", "hex": "#XXXXXX"}],
    "colorFamily": "中文色系名称",
    "backgroundRecommendation": {"color": "中文颜色名", "hex": "#XXXXXX", "reasoning": "中文推荐理由"}
  },
  "styleDetection": {
    "styleCategory": "职场简约 | 休闲度假 | 艺术复古",
    "styleDescription": "中文风格描述",
    "recommendedProps": ["中文道具1", "中文道具2", "中文道具3"],
    "propPlacement": "中文摆放建议"
  },
  "compositionPlan": {
    "totalPieces": "必须等于用户提供的实际衣服件数",
    "soloHangers": "单挂数量",
    "layeredHangers": "叠挂数量",
    "spacingPercent": 18,
    "hemRhythm": "中文节奏描述",
    "anchorItems": "中文地面锚点描述",
    "railDescription": "中文挂杆描述"
  },
  "lightingPlan": {
    "direction": "中文方向描述",
    "warmth": "中文色温描述",
    "colorTemperature": "3200K",
    "shadowStyle": "中文阴影描述",
    "specialNotes": "中文特别说明"
  },
  "summary": "2-3句中文总结推荐"
}`

// 生成式报告专用系统提示词
const GENERATIVE_REPORT_SYSTEM_PROMPT = `你是一位跨行业的视觉分析报告专家，擅长把专业结论翻译成用户听得懂的大白话。

核心要求：
1) 你必须阅读用户上传图片并基于图片内容分析，不能只复述模板。
2) 你必须只输出合法 JSON，不要 Markdown，不要额外解释。
3) 每一页都必须包含：title, visual_focus_area, plain_language_explanation, key_metaphor, action_items, image_refs。
4) plain_language_explanation 必须是通俗中文，避免术语堆砌。
5) key_metaphor 必须是生活化比喻，不能为空。
6) action_items 必须是可执行建议，2-4 条。
7) 如果用户要求 6/8 页且上传多图，必须包含 comparison 页并填写 compare_pair。

输出 JSON 必须满足：
{
  "version": "1.0",
  "domain": "dental|veterinary|k12_education|gym|general",
  "report_depth": 4|6|8,
  "generated_at": "ISO8601",
  "summary": "一句话总结",
  "assets": {
    "images": [
      {"image_id":"img_1","url":"原图地址","label":"术前"}
    ]
  },
  "slides": [
    {
      "slide_id": "slide_1",
      "page_number": 1,
      "slide_type": "overview|finding|comparison|action|summary",
      "title": "页面标题",
      "visual_focus_area": "文字描述或坐标对象",
      "plain_language_explanation": "大白话解释",
      "key_metaphor": "生活化比喻",
      "action_items": ["建议1", "建议2"],
      "image_refs": [{"image_id":"img_1","note":"重点区域"}],
      "compare_pair": {
        "before_image_id": "img_1",
        "after_image_id": "img_2",
        "improvement_points": ["改进点"],
        "advantages": ["优势点"]
      }
    }
  ]
}`

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

function dataUrlToInlineData(dataUrl: string): { mimeType: string; data: string } | null {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!matches) return null
  return {
    mimeType: matches[1],
    data: matches[2],
  }
}

function extractTextFromGeminiResponse(payload: Record<string, any>): string {
  const candidates = payload?.candidates || []
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts || []
    for (const part of parts) {
      if (typeof part?.text === 'string' && part.text.trim()) {
        return part.text
      }
    }
  }
  return ''
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

    // 生成式报告独立 API（仅使用报告专用 Key，避免误用图像 Key）
    const REPORT_API_KEY =
      Deno.env.get('REPORT_API_KEY') ||
      Deno.env.get('GENERATIVE_REPORT_API_KEY')
    const REPORT_API_BASE_URL = (Deno.env.get('REPORT_API_BASE_URL') || 'https://api.bltcy.ai').replace(/\/$/, '')
    const REPORT_API_PROVIDER =
      Deno.env.get('REPORT_API_PROVIDER') ||
      (REPORT_API_BASE_URL.includes('bltcy.ai') ? 'openai-compatible' : 'openai-compatible')
    const REPORT_API_CHAT_PATH = Deno.env.get('REPORT_API_CHAT_PATH') || '/v1/chat/completions'
    const REPORT_API_MODEL = Deno.env.get('REPORT_API_MODEL') || 'gemini-3-flash-preview'

    // 解析请求
    const { prompt, agentId, history, stream = true, mode, images } = await req.json()

    if (!prompt) {
      throw new Error('prompt is required')
    }

    // ========== VM 陈列分析模式 ==========
    if (mode === 'vm-analysis') {
      // 构建多模态消息（OpenAI vision 格式）
      const userContent: Array<{type: string; text?: string; image_url?: {url: string}}> = []

      // 添加文本指令
      userContent.push({
        type: 'text',
        text: prompt,
      })

      // 添加图片
      if (images && Array.isArray(images)) {
        for (const imageBase64 of images) {
          if (typeof imageBase64 === 'string' && imageBase64.startsWith('data:')) {
            userContent.push({
              type: 'image_url',
              image_url: { url: imageBase64 },
            })
          }
        }
      }

      const vmMessages = [
        { role: 'system', content: VM_ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ]

      const vmResponse = await fetch(`${ZENMUX_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ZENMUX_API_KEY}`,
        },
        body: JSON.stringify({
          model: ZENMUX_MODEL,
          messages: vmMessages,
          temperature: 0.3,
          max_tokens: 4000,
          stream: false,
        }),
      })

      if (!vmResponse.ok) {
        const errorText = await vmResponse.text()
        throw new Error(`ZenMux VM Analysis error: ${vmResponse.status} - ${errorText}`)
      }

      const vmData = await vmResponse.json()
      return new Response(JSON.stringify(vmData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ========== 生成式报告模式 ==========
    if (mode === 'generative-report') {
      if (!REPORT_API_KEY) {
        throw new Error('REPORT_API_KEY not configured for generative-report mode')
      }

      // BLTCY Gemini generateContent 协议
      if (REPORT_API_PROVIDER === 'bltcy-gemini') {
        const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []

        parts.push({
          text: `${GENERATIVE_REPORT_SYSTEM_PROMPT}\n\n用户任务：\n${prompt}\n\n注意：仅输出 JSON。`,
        })

        if (images && Array.isArray(images)) {
          for (const imageBase64 of images) {
            if (typeof imageBase64 !== 'string') continue
            const inline = dataUrlToInlineData(imageBase64)
            if (inline) {
              parts.push({ inlineData: inline })
            }
          }
        }

        const reportApiUrl = `${REPORT_API_BASE_URL}/v1beta/models/${REPORT_API_MODEL}:generateContent`
        const reportResponse = await fetch(reportApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${REPORT_API_KEY}`,
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 6000,
              responseMimeType: 'application/json',
            },
          }),
        })

        if (!reportResponse.ok) {
          const errorText = await reportResponse.text()
          throw new Error(`Generative Report API error: ${reportResponse.status} - ${errorText}`)
        }

        const reportData = await reportResponse.json()
        const responseText = extractTextFromGeminiResponse(reportData)
        if (!responseText) {
          throw new Error('Generative Report API returned empty content')
        }

        // 对齐前端既有解析格式（OpenAI 风格）
        const normalized = {
          id: crypto.randomUUID(),
          model: REPORT_API_MODEL,
          choices: [
            {
              finish_reason: 'stop',
              message: {
                role: 'assistant',
                content: responseText,
              },
            },
          ],
        }

        return new Response(JSON.stringify(normalized), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: 'text', text: prompt },
      ]

      if (images && Array.isArray(images)) {
        for (const imageBase64 of images) {
          if (typeof imageBase64 === 'string' && imageBase64.startsWith('data:')) {
            userContent.push({
              type: 'image_url',
              image_url: { url: imageBase64 },
            })
          }
        }
      }

      const reportMessages = [
        { role: 'system', content: GENERATIVE_REPORT_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ]

      const reportResponse = await fetch(`${REPORT_API_BASE_URL}${REPORT_API_CHAT_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${REPORT_API_KEY}`,
        },
        body: JSON.stringify({
          model: REPORT_API_MODEL,
          messages: reportMessages,
          temperature: 0.2,
          max_tokens: 5000,
          stream: false,
          response_format: { type: 'json_object' },
        }),
      })

      if (!reportResponse.ok) {
        const errorText = await reportResponse.text()
        throw new Error(`Generative Report API error: ${reportResponse.status} - ${errorText}`)
      }

      const reportData = await reportResponse.json()
      return new Response(JSON.stringify(reportData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 其它模式仍使用 ZenMux
    if (!ZENMUX_API_KEY) {
      throw new Error('ZENMUX_API_KEY not configured')
    }

    // ========== 原有文案生成模式 ==========

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
