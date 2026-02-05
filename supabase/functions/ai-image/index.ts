/**
 * Supabase Edge Function: AI Image Generation
 * 使用 Gemini 2.5 Flash Image (Nano Banana) 生成图像
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const ZENMUX_BASE_URL = Deno.env.get('ZENMUX_BASE_URL') || 'https://zenmux.ai/api/v1'
    // 图像生成使用 Nano Banana 模型
    const IMAGE_MODEL = 'google/gemini-2.5-flash-image'

    if (!ZENMUX_API_KEY) {
      throw new Error('ZENMUX_API_KEY not configured')
    }

    const { prompt, style, aspectRatio, negativePrompt } = await req.json()

    if (!prompt) {
      throw new Error('prompt is required')
    }

    // 构建图像生成提示词
    let fullPrompt = prompt
    if (style) {
      fullPrompt = `${style} style: ${prompt}`
    }
    if (negativePrompt) {
      fullPrompt += `. Avoid: ${negativePrompt}`
    }

    // 调用 ZenMux API 生成图像
    // Gemini 2.5 Flash Image 支持通过 chat completions 生成图像
    const response = await fetch(`${ZENMUX_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZENMUX_API_KEY}`,
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        messages: [
          {
            role: 'user',
            content: `Generate an image: ${fullPrompt}${aspectRatio ? `. Aspect ratio: ${aspectRatio}` : ''}`
          }
        ],
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ZenMux API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    // 解析响应，提取图像 URL 或 base64
    const content = data.choices?.[0]?.message?.content

    // Gemini 图像模型可能返回 markdown 格式的图像或 base64
    let imageUrl = null
    let imageBase64 = null

    // 尝试提取 markdown 图像链接
    const markdownMatch = content?.match(/!\[.*?\]\((.*?)\)/)
    if (markdownMatch) {
      imageUrl = markdownMatch[1]
    }

    // 检查是否有 base64 数据
    if (content?.includes('data:image')) {
      const base64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/)
      if (base64Match) {
        imageBase64 = base64Match[0]
      }
    }

    return new Response(JSON.stringify({
      success: true,
      imageUrl,
      imageBase64,
      rawContent: content,
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
