/**
 * Supabase Edge Function: AI Image Generation
 * 使用 Gemini 3 Pro Image (Nano Banana) 通过 ZenMux Vertex AI 协议生成图像
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
    const ZENMUX_API_KEY = Deno.env.get('ZENMUX_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // ZenMux Vertex AI 端点和 Gemini 3 Pro Image 模型
    const VERTEX_AI_BASE_URL = 'https://zenmux.ai/api/vertex-ai'
    const IMAGE_MODEL = 'google/gemini-3-pro-image-preview'

    if (!ZENMUX_API_KEY) {
      throw new Error('ZENMUX_API_KEY not configured')
    }

    const { prompt, style, aspectRatio, negativePrompt, styleId, images } = await req.json()

    // 构建图像生成提示词
    let fullPrompt = prompt || ''

    // 如果有 styleId，从数据库获取预设提示词
    if (styleId && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

      const { data: promptData, error } = await supabase
        .from('prompts')
        .select('prompt')
        .eq('id', styleId)
        .eq('is_active', true)
        .single()

      if (!error && promptData?.prompt) {
        // 用预设提示词，用户输入作为补充
        fullPrompt = prompt
          ? `${promptData.prompt}\n\n用户补充说明：${prompt}`
          : promptData.prompt
      }
    } else if (style) {
      fullPrompt = `${style} style: ${prompt}`
    }

    // 如果有上传图片，添加智能背景匹配指令
    if (images && Array.isArray(images) && images.length > 0) {
      const backgroundInstruction = `
重要背景设计要求：
1. 分析上传服装的颜色、风格和季节感
2. 根据服装特点自动选择最协调的背景：
   - 暖色系服装（红、橙、黄、棕）→ 使用暖色调背景（米色、浅棕、暖灰、奶油色）
   - 冷色系服装（蓝、绿、紫）→ 使用冷色调背景（浅蓝、薄荷绿、淡紫、冷灰）
   - 黑白灰服装 → 使用简洁纯色背景或轻微渐变
   - 花色/印花服装 → 使用纯色简洁背景，避免喧宾夺主
   - 春夏服装 → 清新明亮的背景色
   - 秋冬服装 → 温暖沉稳的背景色
3. 背景要干净、专业，突出服装本身
4. 可以添加轻微的阴影或光影效果增加层次感
`
      fullPrompt = backgroundInstruction + '\n\n' + (fullPrompt || '请根据上传的服装图片生成搭配展示图')
    }

    if (!fullPrompt) {
      throw new Error('prompt or styleId is required')
    }

    if (negativePrompt) {
      fullPrompt += `. Avoid: ${negativePrompt}`
    }

    if (aspectRatio) {
      fullPrompt += `. Aspect ratio: ${aspectRatio}`
    }

    // 构建 Vertex AI 格式的请求内容
    type PartType = { text: string } | { inlineData: { mimeType: string; data: string } }
    const parts: PartType[] = []

    // 添加文本提示词
    parts.push({ text: fullPrompt })

    // 如果有上传的图片，添加到请求中
    if (images && Array.isArray(images) && images.length > 0) {
      for (const imageBase64 of images) {
        // 从 base64 data URL 中提取实际数据
        const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/)
        if (matches) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          })
        }
      }
    }

    // 调用 ZenMux Vertex AI API 生成图像
    // 使用 models/{model}:generateContent 端点格式
    const apiUrl = `${VERTEX_AI_BASE_URL}/v1/models/${IMAGE_MODEL}:generateContent`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZENMUX_API_KEY}`,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts
          }
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          temperature: 1,
          maxOutputTokens: 8192,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ZenMux API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    // 解析 Vertex AI 响应
    let imageBase64: string | null = null
    let textContent: string | null = null

    const candidates = data.candidates || []
    for (const candidate of candidates) {
      const responseParts = candidate.content?.parts || []
      for (const part of responseParts) {
        if (part.inlineData) {
          // 图片数据
          const { mimeType, data: imgData } = part.inlineData
          imageBase64 = `data:${mimeType};base64,${imgData}`
        }
        if (part.text) {
          textContent = part.text
        }
      }
    }

    if (!imageBase64) {
      throw new Error('未能生成图片')
    }

    return new Response(JSON.stringify({
      success: true,
      imageBase64,
      textContent,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
