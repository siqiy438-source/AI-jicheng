/**
 * Supabase Edge Function: AI Chat
 * 代理 ZenMux API 调用，保护 API Key
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { AGENT_SYSTEM_PROMPTS } from "./agent-prompts.ts"

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


// 穿搭推荐专用系统提示词
const OUTFIT_RECOMMEND_SYSTEM_PROMPT = `你是「穿搭推荐」智能体，一位拥有20年服装零售经验的资深搭配专家。你精通系统的服装搭配方法论，包括五大体型穿搭法则、九大风格定位、服装四要素（色彩/廓形/材质/图案）理论。

你的服务对象是服装店店主。当店主上传某件单品照片，你要提供完整的专业服务：搭配方案 + 商品档案 + 客诉应对 + 陈列指导。

只返回有效 JSON，不要 markdown 和多余文字。所有内容用中文。

## 知识库

### 五大体型理论
- A型（梨形）：臀>肩，上浅下深，适合直筒裤/A字裙，提高腰线
- O型（苹果）：腰腹丰满，全身同色系上衣深色，适合H型/阔腿裤，必穿V领
- T型（倒三角）：肩>臀，上深下浅，弱化肩部，适合阔腿裤/伞裙
- H型（矩形）：无腰线，全身同色，裤腿与身高成正比
- X型（沙漏）：腰细，强调腰线，合体不宽松

### 九大风格定位
- 直线型：少年型（中性/H型）、知性型（高级/套装）、自然型（文艺/宽松）
- 曲线型：少女型（可爱/短裙）、优雅型（精致/连衣裙）、性感型（紧身/高纯度色）

### 服装四要素
- 色彩：无彩色（黑白灰）、基础色（米咖驼）、有彩色
- 廓形：H/A/X/T/O/OS型
- 材质：柔软（真丝/雪纺）vs硬挺（牛仔/皮革）
- 图案：条纹显瘦、大花膨胀、小花精致

## 输出规则
1. 禁止反问：不问年龄场合，直接给方案
2. 严格两套搭配：combinations 数组恰好2个元素，不多不少
3. 搭配逻辑必写：用专业术语，如"上柔下硬，材质对比显高级"
4. 销售话术必写：店主可直接对顾客说，口语化有感染力
5. 针对体型：两套方案分别针对不同体型或场景
6. 商品档案、客诉应对、陈列指导必须全部输出，不能省略

## 语言风格（极其重要）
- 话术要像真人店主说话，不要像AI生成的模板。禁止出现"克数对应话术""面料克重""性价比之选"等机械表达
- 客诉应对要具体、有温度，像老板娘跟熟客聊天，不要用"首先…其次…最后…"的排比句式
- salesTalk 要自然随意，像朋友推荐，比如"这件搭高腰裤特别显腿长，我自己也这么穿"，而不是"这款采用XX面料，具有XX特点"
- 禁止使用以下AI味词汇：赋予、彰显、打造、呈现、营造、兼具、完美、恰到好处、不失、尽显
- 用大白话说人话，短句为主，可以用口语化的语气词

返回 JSON：
{
  "inputAnalysis": {
    "itemType": "单品类型",
    "color": "具体颜色",
    "style": "风格标签，如'知性型+自然型'",
    "material": "面料和质感",
    "silhouette": "廓形，如H型/A型",
    "bestFor": "最适合的体型"
  },
  "combinations": [
    {
      "name": "方案名称，如'职场干练风'",
      "theme": "适合推给什么客人",
      "targetBody": "针对体型",
      "items": [
        {
          "category": "内搭/外套/下装/鞋子/包包/配饰",
          "description": "颜色+面料+版型+关键细节",
          "colorSuggestion": "具体色名",
          "styleTip": "为什么选这件"
        }
      ],
      "matchingLogic": "搭配逻辑，用专业术语",
      "stylingTips": ["穿搭技巧1", "穿搭技巧2", "穿搭技巧3"],
      "overallLook": "整体效果，80字",
      "salesTalk": "店主话术，80字"
    }
  ],
  "productProfile": {
    "styleTags": "风格标签，如'知性型+自然型'",
    "displayArea": "建议陈列区域",
    "targetCustomer": "目标客群：体型+风格+年龄",
    "bodyFit": "体型适配：✅最适合XX，⚠️需注意XX",
    "colorMatch": {
      "safe": "安全搭配色",
      "advanced": "进阶搭配色",
      "avoid": "避雷色"
    }
  },
  "objectionHandling": {
    "looksFat": "客人说'显胖'的应对话术",
    "tooExpensive": "客人说'太贵'的应对话术",
    "notSuitable": "客人说'不适合我'的应对话术"
  },
  "displayGuide": {
    "zone": "应该放在哪个区",
    "vpDisplay": "VP点展示的具体组合",
    "colorArrangement": "色彩排列建议",
    "tagTip": "衣架卡提示语"
  },
  "generalTips": ["通用搭配建议1", "通用搭配建议2"]
}`

// 面料成分说明生成器专用系统提示词
const FABRIC_ANALYSIS_SYSTEM_PROMPT = `你是一位在档口干了十几年的面料老手，帮服装店主把水洗标翻译成顾客听得懂、愿意掏钱的话。

只返回有效 JSON，不要 markdown 和多余文字。所有内容用中文。

## 核心原则
1. 看图识别：仔细看水洗标/面料照片，准确识别成分和比例
2. 说人话：顾客不懂"聚酯纤维"，但懂"滑滑的不起球"
3. 有卖点：再普通的面料也有优势，找到它用体感描述放大
4. 实用：保养建议要具体到动作，不要笼统的"注意保养"

## 语言风格（极其重要，必须严格遵守）

### 禁用词（出现任何一个都算失败）
赋予、彰显、打造、呈现、营造、兼具、完美、恰到好处、不失、尽显、
甄选、匠心、品质之选、性价比之选、奢华质感、高端品质、
精心、精致工艺、卓越、非凡、独特魅力、优雅气质、时尚感、
舒适体验、极致、臻享、焕发、绽放、演绎、诠释、融合、
品味生活、质感生活、轻奢、高级感、氛围感、松弛感

### 禁用句式
- "XX含量，XX品质" — 这是AI最爱写的废话
- "不仅…更…" "既…又…" — 排比句式太假
- "为您的XX增添一份XX" — 典型AI腔
- "让您在XX中感受XX" — 没人这么说话
- "采用XX工艺/面料，具有XX特点" — 说明书不是文案

### headline 写法（必须遵守）
用反问句、场景句或体感句，像朋友圈文案：
✅ 好的："摸过这件再摸别的，手感回不去了"
✅ 好的："下雨天也敢穿白色的底气"
✅ 好的："开了一天会，衬衫还是平的"
❌ 坏的："95%棉含量，亲肤透气之选"
❌ 坏的："甄选优质面料，打造舒适体验"

### whyExpensive 写法（回答"为什么卖这么贵"）
顾客问"为什么这么贵"，导购要能接住。用体感+成本+对比来说服：
✅ 好的："这个面料是长绒棉，纤维比普通棉长一倍，织出来的布更细腻。你摸摸看，是不是比一般T恤滑很多？普通棉洗几次就毛了，这个洗二十次还是这个手感。光面料成本就比普通款高三倍。"
❌ 坏的："采用优质长绒棉面料，品质卓越，物超所值。"
要点：说清面料贵在哪、体感好在哪、耐用在哪，让顾客觉得值。80-120字。

### whatsDifferent 写法（回答"和其他衣服有什么区别"）
顾客问"这件和那件有什么不一样"，导购要能说出具体差别：
✅ 好的："最大的区别你上身就知道——同样是雪纺，这件加了真丝成分，垂感完全不一样，不会像普通雪纺那样飘得廉价。而且你看这个光泽，普通雪纺是塑料感的亮，这个是哑光的润，拍照特别好看。"
❌ 坏的："区别于普通面料，本品具有更优越的品质和更舒适的穿着体验。"
要点：说具体差别，用"你摸/你看/你穿"引导体验，80-120字。

### sellingPoints 写法
用短句说体感，不要用形容词堆砌：
✅ "洗10次不起球" "夏天不粘皮肤" "胖MM穿也不勒"
❌ "优质亲肤面料" "卓越透气性能" "舒适穿着体验"

### productDetailCopy 写法
分2-3个小段落，有节奏感。先说体感，再说成分，最后说适合谁：
✅ "拿到手第一感觉就是软，不是那种塌塌的软，是带点弹力的糯。\n\n65%棉+35%天丝，棉管吸汗，天丝管垂感。两个加一起，就是穿上身不闷还有型。\n\n通勤穿、周末穿都行，怕热的姐妹夏天闭眼入。"
❌ "本品采用65%棉35%天丝混纺面料，兼具棉的亲肤透气与天丝的丝滑垂坠，为您打造舒适优雅的穿着体验，适合各种场合穿着。"

## 输出规则
1. fabricIdentification：准确识别成分比例、面料类型、质感、厚薄
2. marketingDescription：headline 必须是反问句/场景句/体感句；whyExpensive 回答"为什么卖这么贵"80-120字；whatsDifferent 回答"和别的有什么区别"80-120字；sellingPoints 3-4个体感短句
3. careInstructions：具体的洗涤、晾晒、熨烫、收纳建议，warnings 列出容易踩的坑
4. maintenanceTips：3-4条日常保养小技巧，说人话
5. fabricComparison：和1-2种常见面料对比，说清优劣势
6. productDetailCopy：分段落写，先体感再成分再适合谁，150-200字，禁止说明书口吻

返回 JSON：
{
  "fabricIdentification": {
    "composition": "成分比例，如65%聚酯纤维 35%棉",
    "fabricType": "面料类型，如涤棉混纺",
    "texture": "质感描述，如柔软亲肤、略带弹性",
    "weight": "厚薄描述，如薄款/中等/厚实"
  },
  "marketingDescription": {
    "headline": "反问句/场景句/体感句，如'摸过这件再摸别的，手感回不去了'",
    "whyExpensive": "回答顾客'为什么卖这么贵'，用体感+成本+对比说服，80-120字",
    "whatsDifferent": "回答顾客'和其他衣服有什么区别'，说具体差别引导体验，80-120字",
    "sellingPoints": ["体感短句1", "体感短句2", "体感短句3"],
    "suitableSeasons": "适合季节",
    "suitableScenes": ["场景1", "场景2", "场景3"]
  },
  "careInstructions": {
    "washing": "洗涤建议",
    "drying": "晾晒建议",
    "ironing": "熨烫建议",
    "storage": "收纳建议",
    "warnings": ["注意事项1", "注意事项2"]
  },
  "maintenanceTips": ["保养提示1", "保养提示2", "保养提示3"],
  "fabricComparison": [
    {
      "comparedTo": "对比面料名称",
      "advantages": ["优势1", "优势2"],
      "disadvantages": ["劣势1"]
    }
  ],
  "productDetailCopy": "分段落的详情页文案，先体感再成分再适合谁，150-200字"
}`

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

function toPositiveNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return 0
  return parsed
}

function parseTotalTokens(payload: Record<string, any>): number {
  const usageTotal = toPositiveNumber(payload?.usage?.total_tokens)
  if (usageTotal > 0) return usageTotal
  return toPositiveNumber(payload?.usageMetadata?.totalTokenCount)
}

function normalizeMessageContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .map((part) => {
      if (typeof part === 'string') return part
      if (typeof part?.text === 'string') return part.text
      return ''
    })
    .join('')
}

function extractAssistantMessage(payload: Record<string, any>): string {
  const choices = payload?.choices || []
  if (!Array.isArray(choices) || choices.length === 0) return ''
  const message = choices[0]?.message
  return normalizeMessageContent(message?.content).trim()
}

function estimateTokensFromText(parts: Array<string | null | undefined>): number {
  const totalChars = parts
    .map((part) => (typeof part === 'string' ? part : ''))
    .join('')
    .trim()
    .length
  if (totalChars <= 0) return 0
  return Math.max(1, Math.ceil(totalChars / 4))
}

function estimateImageTokens(images: unknown): number {
  if (!Array.isArray(images)) return 0
  return images.length * 256
}

function extractHistoryTexts(history: unknown): string[] {
  if (!Array.isArray(history)) return []
  return history
    .map((item) => normalizeMessageContent((item as Record<string, unknown>)?.content))
    .filter((text) => text.trim().length > 0)
}

function calculateTokenCreditCost(totalTokens: number, tokenCostPerK: number, multiplier: number): number {
  if (!Number.isFinite(totalTokens) || totalTokens <= 0) return 0
  const raw = (totalTokens / 1000) * tokenCostPerK * multiplier
  const rounded = Number(raw.toFixed(2))
  if (rounded <= 0 && raw > 0) return 0.01
  return rounded
}

function createSseResponse(content: string): Response {
  const chunks: string[] = []
  if (content) {
    chunks.push(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`)
  }
  chunks.push('data: [DONE]\n\n')
  return new Response(chunks.join(''), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

serve(async (req) => {
  // 处理 CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let supabaseAdmin: ReturnType<typeof createClient> | null = null
  let userId: string | null = null
  let creditCost = 0
  let savedFeatureCode: string | null = null
  let tokenCreditsCharged = 0
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
        console.error('[ai-chat] finalize_credit_operation failed:', finalizeError || finalizeResult)
      }
    } catch (finalizeErr) {
      console.error('[ai-chat] finalize_credit_operation exception:', finalizeErr)
    }
  }

  try {
    // 获取环境变量中的 API Key（BLTCY 文字 API）
    const TEXT_API_KEY = Deno.env.get('BLTCY_TEXT_API_KEY')
    const TEXT_BASE_URL = (Deno.env.get('BLTCY_TEXT_BASE_URL') || 'https://api.bltcy.ai').replace(/\/$/, '')
    const TEXT_MODEL = Deno.env.get('BLTCY_TEXT_MODEL') || 'claude-sonnet-4-5-20250929'
    const TEXT_TOKEN_COST_PER_K = toPositiveNumber(Deno.env.get('TEXT_TOKEN_COST_PER_K') || '0.0024') || 0.0024
    const TEXT_TOKEN_MULTIPLIER = toPositiveNumber(Deno.env.get('TEXT_TOKEN_MULTIPLIER') || '6.5') || 6.5

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
    const { prompt, agentId, history, stream = true, mode, images, feature_code, phase, request_id } = await req.json()
    savedFeatureCode = feature_code || null

    if (!prompt) {
      throw new Error('prompt is required')
    }

    // ========== 积分计费 ==========
    const FIXED_CREDIT_COSTS: Record<string, number> = {
      'ai_report_page': 40,
    }
    const TOKEN_BILLED_FEATURES = new Set([
      'ai_display_analysis',
      'ai_outfit_recommend',
      'ai_fabric_analysis',
    ])
    // ai_copywriting: 固定积分计费，每轮探索扣5积分，生成阶段扣40积分
    let fixedCreditCost = 0
    if (feature_code === 'ai_copywriting') {
      fixedCreditCost = phase === 'generate' ? 40 : 5
    } else {
      const shouldChargeFixedByPhase = !phase || phase === 'generate'
      fixedCreditCost = shouldChargeFixedByPhase ? (FIXED_CREDIT_COSTS[feature_code] || 0) : 0
    }
    const isTokenBilledFeature = TOKEN_BILLED_FEATURES.has(feature_code || '')
    const needsCreditAuth = fixedCreditCost > 0 || isTokenBilledFeature

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (needsCreditAuth && SUPABASE_URL && SUPABASE_SERVICE_KEY && token) {
      supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
      if (authError || !user) {
        return new Response(JSON.stringify({ error: '用户认证失败，请重新登录' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      userId = user.id
      if (fixedCreditCost > 0) {
        // V1：先覆盖 ai_copywriting，使用幂等扣费/退款操作
        if (feature_code === 'ai_copywriting') {
          const resolvedRequestId = typeof request_id === 'string' && request_id.trim() ? request_id.trim() : crypto.randomUUID()
          fixedCreditOperationId = resolvedRequestId
          fixedCreditOperationFeatureCode = feature_code

          const { data: beginResult, error: beginError } = await supabaseAdmin.rpc('begin_credit_operation', {
            p_user_id: userId,
            p_operation_id: resolvedRequestId,
            p_feature_code: feature_code,
            p_amount: fixedCreditCost.toFixed(2),
            p_description: feature_code,
          })
          if (beginError || !beginResult?.success) {
            const currentBalance = Number(beginResult?.balance || 0).toFixed(2)
            const errMsg = beginResult?.error === 'INSUFFICIENT_BALANCE'
              ? `积分不足，需要 ${fixedCreditCost.toFixed(2)} 积分，当前余额 ${currentBalance}`
              : '积分扣减失败'
            return new Response(JSON.stringify({ error: errMsg }), {
              status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
          if (!beginResult?.already_exists) {
            console.log(`[ai-chat] Deducted ${fixedCreditCost.toFixed(2)} credits from user ${userId}`)
          } else {
            console.log(`[ai-chat] Reused credit operation ${resolvedRequestId} for user ${userId} (status=${beginResult?.status})`)
          }
        } else {
          const { data: deductResult, error: deductError } = await supabaseAdmin.rpc('deduct_credits', {
            p_user_id: userId,
            p_amount: fixedCreditCost.toFixed(2),
            p_description: feature_code || 'ai_chat',
          })
          if (deductError || !deductResult?.success) {
            const currentBalance = Number(deductResult?.balance || 0).toFixed(2)
            const errMsg = deductResult?.error === 'INSUFFICIENT_BALANCE'
              ? `积分不足，需要 ${fixedCreditCost.toFixed(2)} 积分，当前余额 ${currentBalance}`
              : '积分扣减失败'
            return new Response(JSON.stringify({ error: errMsg }), {
              status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
          creditCost = fixedCreditCost
          console.log(`[ai-chat] Deducted ${fixedCreditCost.toFixed(2)} credits from user ${userId}`)
        }
      }
    }

    if (needsCreditAuth && !userId) {
      return new Response(JSON.stringify({ error: '请先登录后再使用该功能' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // token 计费：提问即实时预扣（基于输入 token 估算）
    if (isTokenBilledFeature && userId && supabaseAdmin && feature_code) {
      const estimatedInputTokens =
        estimateTokensFromText([prompt, ...extractHistoryTexts(history)]) + estimateImageTokens(images)
      const upfrontCredits = calculateTokenCreditCost(
        estimatedInputTokens,
        TEXT_TOKEN_COST_PER_K,
        TEXT_TOKEN_MULTIPLIER,
      )

      if (upfrontCredits > 0) {
        const { data: deductResult, error: deductError } = await supabaseAdmin.rpc('deduct_credits', {
          p_user_id: userId,
          p_amount: upfrontCredits.toFixed(2),
          p_description: `${feature_code}-实时预扣`,
        })
        if (deductError || !deductResult?.success) {
          const currentBalance = Number(deductResult?.balance || 0).toFixed(2)
          const errMsg = deductResult?.error === 'INSUFFICIENT_BALANCE'
            ? `积分不足，需要 ${upfrontCredits.toFixed(2)} 积分，当前余额 ${currentBalance}`
            : '积分扣减失败'
          return new Response(JSON.stringify({ error: errMsg }), {
            status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        tokenCreditsCharged += upfrontCredits
        creditCost += upfrontCredits
        console.log(`[ai-chat] Upfront token charge ${feature_code}: input_tokens=${estimatedInputTokens}, credits=${upfrontCredits.toFixed(2)}`)
      }
    }

    const chargeTokenCredits = async (
      payload: Record<string, any>,
      fallbackTextParts: Array<string | null | undefined>,
    ): Promise<Response | null> => {
      if (!isTokenBilledFeature || !userId || !supabaseAdmin || !feature_code) return null
      const totalTokens = parseTotalTokens(payload) || estimateTokensFromText(fallbackTextParts)
      const targetCredits = calculateTokenCreditCost(totalTokens, TEXT_TOKEN_COST_PER_K, TEXT_TOKEN_MULTIPLIER)
      const delta = Number((targetCredits - tokenCreditsCharged).toFixed(2))
      if (delta === 0) {
        console.log(`[ai-chat] Token settled ${feature_code}: tokens=${totalTokens}, charged=${tokenCreditsCharged.toFixed(2)}`)
        return null
      }

      if (delta > 0) {
        const { data: deductResult, error: deductError } = await supabaseAdmin.rpc('deduct_credits', {
          p_user_id: userId,
          p_amount: delta.toFixed(2),
          p_description: feature_code,
        })
        if (deductError || !deductResult?.success) {
          const currentBalance = Number(deductResult?.balance || 0).toFixed(2)
          const errMsg = deductResult?.error === 'INSUFFICIENT_BALANCE'
            ? `积分不足，需要 ${delta.toFixed(2)} 积分，当前余额 ${currentBalance}`
            : '积分扣减失败'
          return new Response(JSON.stringify({ error: errMsg }), {
            status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        tokenCreditsCharged = Number((tokenCreditsCharged + delta).toFixed(2))
        creditCost = Number((creditCost + delta).toFixed(2))
      } else {
        const refundAmount = Number(Math.abs(delta).toFixed(2))
        if (refundAmount > 0) {
          await supabaseAdmin.rpc('add_credits', {
            p_user_id: userId,
            p_amount: refundAmount.toFixed(2),
            p_description: `退款-${feature_code}-结算差额`,
          })
          tokenCreditsCharged = Number((tokenCreditsCharged - refundAmount).toFixed(2))
          creditCost = Number((creditCost - refundAmount).toFixed(2))
        }
      }

      console.log(`[ai-chat] Token settled ${feature_code}: tokens=${totalTokens}, charged=${tokenCreditsCharged.toFixed(2)}, multiplier=${TEXT_TOKEN_MULTIPLIER}`)
      return null
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

      const identifyResponse = await fetch(`${TEXT_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEXT_API_KEY}`,
        },
        body: JSON.stringify({
          model: TEXT_MODEL,
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
      // vm-analysis 需要扣积分，必须认证
      if (!userId) {
        return new Response(JSON.stringify({ error: '请先登录后再使用陈列分析功能' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
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

      const vmResponse = await fetch(`${TEXT_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEXT_API_KEY}`,
        },
        body: JSON.stringify({
          model: TEXT_MODEL,
          messages: vmMessages,
          temperature: 0.3,
          max_tokens: 8000,
          stream: false,
        }),
      })

      if (!vmResponse.ok) {
        const errorText = await vmResponse.text()
        throw new Error(`VM Analysis error: ${vmResponse.status} - ${errorText}`)
      }

      const vmData = await vmResponse.json()
      const chargeError = await chargeTokenCredits(vmData, [prompt, extractAssistantMessage(vmData)])
      if (chargeError) return chargeError
      return new Response(JSON.stringify(vmData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ========== 穿搭推荐模式 ==========
    if (mode === 'outfit-recommend') {
      if (!userId) {
        return new Response(JSON.stringify({ error: '请先登录后再使用穿搭推荐功能' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (!TEXT_API_KEY) {
        throw new Error('BLTCY_TEXT_API_KEY not configured for outfit-recommend mode')
      }

      const userContent: Array<{type: string; text?: string; image_url?: {url: string}}> = []
      userContent.push({ type: 'text', text: prompt })
      if (images && Array.isArray(images)) {
        for (const imageBase64 of images) {
          if (typeof imageBase64 === 'string' && imageBase64.startsWith('data:')) {
            userContent.push({ type: 'image_url', image_url: { url: imageBase64 } })
          }
        }
      }

      const outfitMessages = [
        { role: 'system', content: OUTFIT_RECOMMEND_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ]

      const outfitResponse = await fetch(`${TEXT_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEXT_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          messages: outfitMessages,
          temperature: 0.4,
          max_tokens: 4000,
          stream: false,
        }),
      })

      if (!outfitResponse.ok) {
        const errorText = await outfitResponse.text()
        throw new Error(`Outfit Recommend error: ${outfitResponse.status} - ${errorText}`)
      }

      const outfitData = await outfitResponse.json()
      const chargeError = await chargeTokenCredits(outfitData, [prompt, extractAssistantMessage(outfitData)])
      if (chargeError) return chargeError
      return new Response(JSON.stringify(outfitData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ========== 面料成分说明模式 ==========
    if (mode === 'fabric-analysis') {
      if (!userId) {
        return new Response(JSON.stringify({ error: '请先登录后再使用面料分析功能' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (!TEXT_API_KEY) {
        throw new Error('BLTCY_TEXT_API_KEY not configured for fabric-analysis mode')
      }

      const userContent: Array<{type: string; text?: string; image_url?: {url: string}}> = []
      userContent.push({ type: 'text', text: prompt })
      if (images && Array.isArray(images)) {
        for (const imageBase64 of images) {
          if (typeof imageBase64 === 'string' && imageBase64.startsWith('data:')) {
            userContent.push({ type: 'image_url', image_url: { url: imageBase64 } })
          }
        }
      }

      const fabricMessages = [
        { role: 'system', content: FABRIC_ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ]

      const fabricResponse = await fetch(`${TEXT_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEXT_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          messages: fabricMessages,
          temperature: 0.3,
          max_tokens: 4000,
          stream: false,
        }),
      })

      if (!fabricResponse.ok) {
        const errorText = await fabricResponse.text()
        throw new Error(`Fabric Analysis error: ${fabricResponse.status} - ${errorText}`)
      }

      const fabricData = await fabricResponse.json()
      const chargeError = await chargeTokenCredits(fabricData, [prompt, extractAssistantMessage(fabricData)])
      if (chargeError) return chargeError
      return new Response(JSON.stringify(fabricData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ========== 生成式报告模式 ==========
    if (mode === 'generative-report') {
      // 生成式报告需要扣积分，必须认证
      if (!userId) {
        return new Response(JSON.stringify({ error: '请先登录后再使用报告生成功能' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
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
          usage: reportData?.usageMetadata?.totalTokenCount
            ? { total_tokens: reportData.usageMetadata.totalTokenCount }
            : undefined,
        }

        const chargeError = await chargeTokenCredits(normalized, [prompt, responseText])
        if (chargeError) return chargeError
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
      const chargeError = await chargeTokenCredits(reportData, [prompt, extractAssistantMessage(reportData)])
      if (chargeError) return chargeError
      return new Response(JSON.stringify(reportData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 其它模式使用 BLTCY Text API
    if (!TEXT_API_KEY) {
      throw new Error('BLTCY_TEXT_API_KEY not configured')
    }

    // ========== 原有文案生成模式 ==========

    // 构建消息
    const systemPrompt = AGENT_SYSTEM_PROMPTS[agentId] || AGENT_SYSTEM_PROMPTS.general
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: prompt },
    ]

    // 调用 BLTCY Text API
    const shouldForceNonStreaming = isTokenBilledFeature
    const response = await fetch(`${TEXT_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEXT_API_KEY}`,
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
        stream: shouldForceNonStreaming ? false : stream,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Text API error: ${response.status} - ${error}`)
    }

    // 固定积分/非 token 功能保持透传流式响应
    if (stream && !shouldForceNonStreaming) {
      const sseHeaders = {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
      // 有积分操作时，用 TransformStream 拦截流结束事件来 finalize
      if (fixedCreditOperationId && response.body) {
        const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
        const pipePromise = response.body.pipeTo(writable).then(
          () => finalizeFixedCreditOperation(true),
          (err: unknown) => finalizeFixedCreditOperation(false, String(err))
        )
        try { (globalThis as any).EdgeRuntime?.waitUntil?.(pipePromise) } catch (_) { /* ignore */ }
        return new Response(readable, { headers: sseHeaders })
      }
      return new Response(response.body, { headers: sseHeaders })
    }

    // token 计费场景使用非流式上游响应，结算后再返回给前端
    const data = await response.json()
    const assistantText = extractAssistantMessage(data)
    const chargeError = await chargeTokenCredits(data, [prompt, assistantText])
    if (chargeError) return chargeError

    await finalizeFixedCreditOperation(true)

    if (stream) {
      return createSseResponse(assistantText)
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    await finalizeFixedCreditOperation(false, error instanceof Error ? error.message : String(error))

    // 生成失败时退还积分
    if (supabaseAdmin && userId && creditCost > 0) {
      try {
        await supabaseAdmin.rpc('add_credits', { p_user_id: userId, p_amount: creditCost.toFixed(2), p_description: '退款-' + (savedFeatureCode || 'ai_chat') })
        console.log(`[ai-chat] Refunded ${creditCost.toFixed(2)} credits to user ${userId}`)
      } catch (refundErr) {
        console.error(`[ai-chat] Refund failed:`, refundErr)
      }
    }
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
