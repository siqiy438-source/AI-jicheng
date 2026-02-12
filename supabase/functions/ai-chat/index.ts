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
const VM_ANALYSIS_SYSTEM_PROMPT = `你是顶级奢侈品女装陈列师（Celine/The Row 级别），正在帮女装店主做陈列指导。只返回有效 JSON，不要 markdown 和多余文字。所有内容用中文。

## 规则
1. 用户会给你一份已识别的衣服清单。你的所有建议必须严格基于这份清单中的衣服来写，用清单中的名称提到每件衣服，绝对不能编造清单中没有的衣服
2. 不说废话：不要说"颜色相近放一起"这种谁都知道的话，直接说哪件和哪件放一起、为什么
3. 不给装修建议：店已装修好，只管衣服怎么挂、怎么搭
4. 客户视角：所有建议都是为了帮店主把衣服卖出去

## displayGuide 要求

garmentList：直接复制用户提供的衣服清单描述，不要修改

railStyle：这一杆的风格定位 + 适合什么客户，如"法式轻通勤风 — 适合25-35岁职场女性"

arrangementSteps（4-6步）：用清单中的衣服名称说明从左到右怎么挂。如"最左边单挂深蓝色高腰阔腿裤，旁边把白色长袖衬衫和藏青色圆领马甲叠挂"

pairingAdvice（3-4条）：用衣服名称说明具体搭配和原因。如"黑色西装+白色丝质衬衫：面料一硬一软，对比高级"

heightRhythmDescription：从左到右每个位置的衣服名称和大致长度，说明波浪节奏

salesTalk（3-4条）：店主向顾客推荐的口语化话术，自然不生硬，每条对应一组搭配。如"姐这件风衣您看一下，搭配里面白衬衫特别显气质，通勤约会都能穿"

overallNarrative（80-120字）：口语化整体思路，提到风格和卖点

返回 JSON（注意：colorAnalysis/styleDetection/compositionPlan/lightingPlan 尽量简短，把重点放在 displayGuide）：
{
  "colorAnalysis": {
    "dominantColors": [{"name": "颜色", "hex": "#XXX"}],
    "colorFamily": "色系",
    "backgroundRecommendation": {"color": "颜色", "hex": "#XXX", "reasoning": "简短理由"}
  },
  "styleDetection": {
    "styleCategory": "风格类别",
    "styleDescription": "简短描述",
    "recommendedProps": ["道具"],
    "propPlacement": "简短建议"
  },
  "compositionPlan": {
    "totalPieces": 0, "soloHangers": 0, "layeredHangers": 0, "spacingPercent": 18,
    "hemRhythm": "简短", "anchorItems": "简短", "railDescription": "简短"
  },
  "lightingPlan": {
    "direction": "简短", "warmth": "简短", "colorTemperature": "3200K",
    "shadowStyle": "简短", "specialNotes": "简短"
  },
  "displayGuide": {
    "garmentList": ["复制用户清单"],
    "railStyle": "风格定位",
    "arrangementSteps": ["步骤1", "步骤2", "步骤3", "步骤4"],
    "pairingAdvice": ["建议1", "建议2", "建议3"],
    "heightRhythmDescription": "高度节奏描述",
    "salesTalk": ["话术1", "话术2", "话术3"],
    "overallNarrative": "整体思路"
  },
  "summary": "总结"
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

    // ========== VM 单件衣服识别模式 ==========
    if (mode === 'vm-identify') {
      const userContent: Array<{type: string; text?: string; image_url?: {url: string}}> = []
      userContent.push({
        type: 'text',
        text: prompt,
      })
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

      const identifyMessages = [
        { role: 'system', content: '你是一位专业的女装买手和陈列师。看图片中的这件衣服，用中文描述以下信息，用一段话写完，不要分行：\n1. 颜色和款式（如"深蓝色高腰阔腿牛仔裤"）\n2. 面料质感（如"厚实牛仔面料"、"轻薄雪纺"、"挺括西装面料"）\n3. 大致长度（短款/中长/长款，约多少cm）\n4. 适合搭配什么类型的单品（如"适合搭配衬衫、针织衫等上装，可通勤可休闲"）\n\n示例："深蓝色高腰阔腿牛仔裤，厚实牛仔面料，长款约100cm，适合搭配衬衫或针织衫，通勤休闲都合适"\n\n只返回描述文字，不要任何其他内容。' },
        { role: 'user', content: userContent },
      ]

      const identifyResponse = await fetch(`${ZENMUX_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ZENMUX_API_KEY}`,
        },
        body: JSON.stringify({
          model: ZENMUX_MODEL,
          messages: identifyMessages,
          temperature: 0.1,
          max_tokens: 200,
          stream: false,
        }),
      })

      if (!identifyResponse.ok) {
        const errorText = await identifyResponse.text()
        throw new Error(`VM Identify error: ${identifyResponse.status} - ${errorText}`)
      }

      const identifyData = await identifyResponse.json()
      return new Response(JSON.stringify(identifyData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
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
          max_tokens: 8000,
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
