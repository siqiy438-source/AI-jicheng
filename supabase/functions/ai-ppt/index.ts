/**
 * Supabase Edge Function: AI PPT
 * 使用 Gemini 3 Pro (BLTCY 线路) 生成 PPT 大纲和页面描述
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// BLTCY 固定配置
const BLTCY_BASE_URL = "https://api.bltcy.ai"
const MODEL = "gemini-3-pro-image-preview"
const API_URL = `${BLTCY_BASE_URL}/v1beta/models/${MODEL}:generateContent`

// 请求超时时间（毫秒）
const REQUEST_TIMEOUT = 60000

// ============================================================
// Prompt 构建函数
// ============================================================

interface SlideData {
  id: number
  title: string
  outlinePoints: string[]
  description: string
}

/**
 * 构建大纲生成的 prompt
 */
function buildOutlinePrompt(
  content: string,
  mode: string,
  pageCount: number,
): string {
  const modeInstructions: Record<string, string> = {
    sentence: `用户提供了一句话描述，请根据这句话展开生成一个${pageCount}页的PPT大纲。`,
    outline: `用户已经提供了大纲内容，请将其整理并扩展为${pageCount}页的PPT结构。请尽量保留用户原有的要点，同时补充完善。`,
    description: `用户已经提供了详细描述，请将其拆分并组织为${pageCount}页的PPT结构。请从描述中提取关键信息，合理分配到各页面。`,
  }

  const modeInstruction = modeInstructions[mode] || modeInstructions.sentence

  return `你是一个专业的PPT大纲生成助手。${modeInstruction}

用户输入内容：
${content}

请严格按照以下JSON格式返回，不要包含任何其他文字：
[
  {
    "id": 1,
    "title": "页面标题",
    "outlinePoints": ["要点1", "要点2", "要点3"],
    "description": ""
  }
]

要求：
1. 生成恰好${pageCount}个页面
2. 每个页面有一个简洁有力的标题
3. 每个页面有3-5个大纲要点
4. description 字段留空（后续单独生成）
5. 第一页应该是封面/引言，最后一页应该是总结/结语
6. 内容要有逻辑递进关系
7. 只返回JSON数组，不要有任何额外文字、解释或markdown代码块标记`
}

/**
 * 构建单页描述生成的 prompt
 */
function buildDescriptionPrompt(
  slideTitle: string,
  outlinePoints: string[],
  overallTheme: string,
  slideIndex: number,
  totalSlides: number,
): string {
  const pointsList = outlinePoints
    .map((p: string, i: number) => `${i + 1}. ${p}`)
    .join('\n')

  return `你是一个专业的PPT内容描述生成助手。请为以下PPT页面生成详细的内容描述和视觉设计建议。

整体主题：${overallTheme}
当前页面：第${slideIndex}页 / 共${totalSlides}页
页面标题：${slideTitle}
大纲要点：
${pointsList}

请生成详细的页面描述，包括：
1. **具体细节**：展开每个大纲要点的具体内容
2. **文字内容**：主标题、副标题、关键要点的具体文案
3. **视觉元素建议**：建议使用什么样的图表、图标、配色方案
4. **画面构想**：描述整体画面的氛围和视觉效果

请直接返回描述文本，不需要JSON格式。`
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 从 AI 返回的文本中提取 JSON 数组
 * 处理可能包含 markdown 代码块标记的情况
 */
function extractJsonFromText(text: string): SlideData[] {
  // 尝试直接解析
  try {
    const parsed = JSON.parse(text.trim())
    if (Array.isArray(parsed)) return parsed
  } catch {
    // 继续尝试其他方式
  }

  // 尝试从 markdown 代码块中提取
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim())
      if (Array.isArray(parsed)) return parsed
    } catch {
      // 继续尝试
    }
  }

  // 尝试找到第一个 [ 和最后一个 ] 之间的内容
  const firstBracket = text.indexOf('[')
  const lastBracket = text.lastIndexOf(']')
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try {
      const jsonStr = text.substring(firstBracket, lastBracket + 1)
      const parsed = JSON.parse(jsonStr)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // 解析失败
    }
  }

  throw new Error('无法从AI响应中提取有效的JSON大纲数据，请重试')
}

/**
 * 从大纲中自动提取项目标题
 */
function extractProjectTitle(slides: SlideData[]): string {
  if (slides.length > 0 && slides[0].title) {
    return slides[0].title
  }
  return 'PPT 演示文稿'
}

/**
 * 延迟函数，用于请求间限速
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 带超时的 fetch 请求
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('AI 服务请求超时，请稍后重试')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * 调用 Gemini API 生成纯文本内容（带重试）
 */
async function callGeminiText(
  apiKey: string,
  prompt: string,
  retries: number = 2,
): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      // 重试前等待，指数退避：2s, 4s
      const waitMs = 2000 * Math.pow(2, attempt - 1)
      console.log(`[ai-ppt] Retry attempt ${attempt}/${retries}, waiting ${waitMs}ms...`)
      await sleep(waitMs)
    }

    try {
      const response = await fetchWithTimeout(
        API_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseModalities: ['TEXT'],
              temperature: 0.7,
              maxOutputTokens: 8192,
            },
          }),
        },
        REQUEST_TIMEOUT,
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[ai-ppt] BLTCY API error: ${response.status} - ${errorText}`)

        if (response.status === 401) {
          throw new Error('BLTCY 认证失败：API Key 无效或已过期，请联系管理员更新')
        } else if (response.status === 403) {
          throw new Error('BLTCY 访问被拒绝：API Key 权限不足')
        } else if (response.status === 429 || response.status === 400) {
          // 400/429 可能是速率限制，允许重试
          lastError = new Error(`BLTCY API 错误: ${response.status}`)
          if (attempt < retries) continue
          throw new Error('请求过于频繁，请稍后再试')
        } else if (response.status === 546) {
          throw new Error('BLTCY 服务暂时不可用（错误码 546），请稍后重试')
        } else if (response.status >= 500) {
          lastError = new Error(`BLTCY 服务错误: ${response.status}`)
          if (attempt < retries) continue
          throw new Error('BLTCY 服务暂时不可用，请稍后再试')
        } else {
          throw new Error(`BLTCY API 错误: ${response.status}`)
        }
      }

      const data = await response.json()

      // 从 Gemini 响应中提取文本
      const candidates = data.candidates || []
      for (const candidate of candidates) {
        const parts = candidate.content?.parts || []
        for (const part of parts) {
          if (part.text) {
            return part.text
          }
        }
      }

      throw new Error('AI 未返回有效内容，请重试')
    } catch (error) {
      lastError = error
      // 如果是非重试类错误，直接抛出
      if (error.message && !error.message.includes('BLTCY API 错误') && !error.message.includes('BLTCY 服务错误')) {
        throw error
      }
      if (attempt >= retries) throw lastError
    }
  }

  throw lastError || new Error('未知错误')
}

// ============================================================
// Action 处理函数
// ============================================================

/**
 * 处理大纲生成请求
 */
async function handleGenerateOutline(
  apiKey: string,
  body: {
    content: string
    mode?: string
    pageCount?: number
    style?: string
  },
): Promise<Record<string, unknown>> {
  const { content, mode = 'sentence', pageCount = 8 } = body

  if (!content || !content.trim()) {
    throw new Error('请输入PPT内容')
  }

  const prompt = buildOutlinePrompt(content, mode, pageCount)
  console.log(`[ai-ppt] Generating outline: mode=${mode}, pageCount=${pageCount}`)

  const responseText = await callGeminiText(apiKey, prompt)

  // 从 AI 响应中提取 JSON 大纲
  const slides = extractJsonFromText(responseText)

  // 验证并规范化大纲数据
  const normalizedSlides: SlideData[] = slides.map((slide, index) => ({
    id: slide.id || index + 1,
    title: slide.title || `第${index + 1}页`,
    outlinePoints: Array.isArray(slide.outlinePoints)
      ? slide.outlinePoints
      : [],
    description: slide.description || '',
  }))

  const projectTitle = extractProjectTitle(normalizedSlides)

  return {
    success: true,
    slides: normalizedSlides,
    projectTitle,
  }
}

/**
 * 处理单页描述生成请求
 */
async function handleGenerateDescription(
  apiKey: string,
  body: {
    slideTitle: string
    outlinePoints: string[]
    overallTheme: string
    style?: string
    slideIndex: number
    totalSlides: number
  },
): Promise<Record<string, unknown>> {
  const {
    slideTitle,
    outlinePoints,
    overallTheme,
    slideIndex,
    totalSlides,
  } = body

  if (!slideTitle) {
    throw new Error('缺少页面标题')
  }

  const prompt = buildDescriptionPrompt(
    slideTitle,
    outlinePoints || [],
    overallTheme || '',
    slideIndex || 1,
    totalSlides || 1,
  )

  console.log(`[ai-ppt] Generating description for slide ${slideIndex}/${totalSlides}: "${slideTitle}"`)

  const description = await callGeminiText(apiKey, prompt)

  return {
    success: true,
    description: description.trim(),
  }
}

/**
 * 处理批量描述生成请求
 */
async function handleBatchGenerateDescriptions(
  apiKey: string,
  body: {
    slides: SlideData[]
    overallTheme: string
    style?: string
  },
): Promise<Record<string, unknown>> {
  const { slides, overallTheme, style } = body

  if (!slides || !Array.isArray(slides) || slides.length === 0) {
    throw new Error('缺少幻灯片数据')
  }

  const totalSlides = slides.length
  console.log(`[ai-ppt] Batch generating descriptions for ${totalSlides} slides`)

  const updatedSlides: SlideData[] = []
  let processedCount = 0

  for (const slide of slides) {
    // 如果已有描述，跳过
    if (slide.description && slide.description.trim()) {
      updatedSlides.push(slide)
      continue
    }

    // 非第一个需要生成的页面，添加延迟避免触发速率限制
    if (processedCount > 0) {
      console.log(`[ai-ppt] Waiting 1.5s before next request...`)
      await sleep(1500)
    }

    try {
      const prompt = buildDescriptionPrompt(
        slide.title,
        slide.outlinePoints || [],
        overallTheme || '',
        slide.id || updatedSlides.length + 1,
        totalSlides,
      )

      const description = await callGeminiText(apiKey, prompt)

      updatedSlides.push({
        ...slide,
        description: description.trim(),
      })

      processedCount++
      console.log(`[ai-ppt] Generated description for slide ${slide.id}: "${slide.title}"`)
    } catch (error) {
      console.error(`[ai-ppt] Failed to generate description for slide ${slide.id}: ${error.message}`)
      // 单页失败不中断整体流程，标记错误信息
      updatedSlides.push({
        ...slide,
        description: `[生成失败] ${error.message}`,
      })
      processedCount++
    }
  }

  return {
    success: true,
    slides: updatedSlides,
  }
}

// ============================================================
// 主请求处理
// ============================================================

serve(async (req) => {
  // 处理 CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const BLTCY_API_KEY = Deno.env.get('BLTCY_API_KEY')
    if (!BLTCY_API_KEY) {
      console.error('[ai-ppt] Missing BLTCY_API_KEY environment variable')
      throw new Error('BLTCY API Key 未配置，请联系管理员')
    }

    const body = await req.json()
    const { action } = body

    if (!action) {
      throw new Error('缺少 action 参数，支持: generate_outline, generate_description, batch_generate_descriptions')
    }

    console.log(`[ai-ppt] Received action: ${action}`)

    let result: Record<string, unknown>

    switch (action) {
      case 'generate_outline':
        result = await handleGenerateOutline(BLTCY_API_KEY, body)
        break

      case 'generate_description':
        result = await handleGenerateDescription(BLTCY_API_KEY, body)
        break

      case 'batch_generate_descriptions':
        result = await handleBatchGenerateDescriptions(BLTCY_API_KEY, body)
        break

      default:
        throw new Error(`不支持的操作: ${action}，支持: generate_outline, generate_description, batch_generate_descriptions`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error(`[ai-ppt] Error: ${error.message}`)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
