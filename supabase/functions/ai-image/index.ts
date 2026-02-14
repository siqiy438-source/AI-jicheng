/**
 * Supabase Edge Function: AI Image Generation
 * 使用 BLTCY API 生成图像（普通线路走 Gemini generateContent，优质/2K/4K 走 images/edits）
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { buildGenerateContentUrl, getImageProvider, getProviderConfig, isHDResolution, isPremiumHD, getHDModel, getHDApiUrl } from "./provider.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** 将 base64 图片上传到 Supabase Storage，返回签名 URL（失败返回 null） */
async function uploadImageToStorage(
  supabaseUrl: string,
  serviceKey: string,
  imageBase64: string,
): Promise<string | null> {
  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceKey)
    const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) return null

    const mimeType = matches[1]
    const raw = atob(matches[2])
    const bytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)

    const ext = mimeType.includes('png') ? 'png' : 'jpg'
    const path = `temp/${crypto.randomUUID()}.${ext}`

    const { error: upErr } = await supabaseAdmin.storage
      .from('works-assets')
      .upload(path, bytes, { contentType: mimeType, upsert: false })
    if (upErr) { console.error('[ai-image] Storage upload error:', upErr); return null }

    const { data, error: urlErr } = await supabaseAdmin.storage
      .from('works-assets')
      .createSignedUrl(path, 3600) // 1 小时有效
    if (urlErr) { console.error('[ai-image] Signed URL error:', urlErr); return null }

    return data.signedUrl
  } catch (e) {
    console.error('[ai-image] uploadImageToStorage failed:', e)
    return null
  }
}

/** 如果 image 是 http(s) URL 则下载并转为 data URL，否则原样返回 */
async function resolveImageToDataUrl(image: string): Promise<string> {
  if (image.startsWith('data:')) return image
  if (image.startsWith('http')) {
    const resp = await fetch(image)
    const buf = await resp.arrayBuffer()
    const bytes = new Uint8Array(buf)
    let binary = ''
    const chunk = 8192
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
    }
    const b64 = btoa(binary)
    const ct = resp.headers.get('content-type') || 'image/png'
    return `data:${ct};base64,${b64}`
  }
  return image
}

serve(async (req) => {
  // 处理 CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let supabaseAdmin: ReturnType<typeof createClient> | null = null
  let userId: string | null = null
  let creditCost = 0

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const { prompt, style, aspectRatio, negativePrompt, styleId, images, line, resolution, hasFrameworkPrompt, conversationHistory, feature_code } = await req.json()

    // ========== 积分扣减 ==========
    const CREDIT_COSTS: Record<string, number> = {
      ai_image_standard: 50, ai_image_premium: 100,
      ai_display_standard: 50, ai_display_premium: 100,
      ai_outfit_standard: 50, ai_outfit_premium: 100,
      ai_fashion_standard: 50, ai_fashion_premium: 100,
      ai_detail_standard: 50, ai_detail_premium: 100,
      ai_flatlay_standard: 50, ai_flatlay_premium: 100,
    }

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (SUPABASE_URL && SUPABASE_SERVICE_KEY && token) {
      supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
      if (authError || !user) {
        return new Response(JSON.stringify({ success: false, error: '用户认证失败，请重新登录' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      userId = user.id
      creditCost = CREDIT_COSTS[feature_code] || 0

      if (creditCost > 0) {
        const { data: deductResult, error: deductError } = await supabaseAdmin.rpc('deduct_credits', {
          p_user_id: userId,
          p_amount: creditCost,
          p_description: feature_code || 'ai_image',
        })
        if (deductError || !deductResult?.success) {
          const errMsg = deductResult?.error === 'INSUFFICIENT_BALANCE'
            ? `积分不足，需要 ${creditCost} 积分，当前余额 ${deductResult?.balance || 0}`
            : '积分扣减失败'
          return new Response(JSON.stringify({ success: false, error: errMsg }), {
            status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        console.log(`[ai-image] Deducted ${creditCost} credits from user ${userId}`)
      }
    }

    const resolvedLine = getImageProvider(line)
    // 优质线路固定走 2K HD
    const resolvedResolution = resolvedLine === "premium" ? "2k" : (resolution || "default")
    const providerConfig = getProviderConfig(resolvedLine)
    const providerApiKey = Deno.env.get(providerConfig.apiKeyEnv)
    const providerName = "BLTCY"

    // 调试日志：确认线路和模型选择
    const actualModel = isHDResolution(resolvedResolution) ? getHDModel(resolvedResolution) : providerConfig.model
    console.log(`[ai-image] 请求参数 → line=${line}, resolution=${resolution}`)
    console.log(`[ai-image] 解析结果 → resolvedLine=${resolvedLine}, resolvedResolution=${resolvedResolution}, HD=${isHDResolution(resolvedResolution)}, model=${actualModel}`)

    if (!providerApiKey) {
      console.error(`[ai-image] Missing API key: ${providerConfig.apiKeyEnv} for ${providerName} provider`)
      throw new Error(`图像服务配置错误：${providerName} API Key 未配置，请联系管理员`)
    }

    // 构建图像生成提示词
    let fullPrompt = prompt || ''
    let hasStylePrompt = false

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
        hasStylePrompt = true
        // 替换 {user_prompt} 占位符，或直接拼接用户补充说明
        if (prompt) {
          fullPrompt = promptData.prompt.replace('{user_prompt}', prompt)
          // 如果没有占位符，追加用户说明
          if (fullPrompt === promptData.prompt) {
            fullPrompt = `${promptData.prompt}\n\nAdditional user notes: ${prompt}`
          }
        } else {
          // 无用户输入时，替换占位符为通用描述
          fullPrompt = promptData.prompt
            .replace(
              /User uploaded clothing:?\s*\{user_prompt\}/i,
              'User uploaded clothing is shown in the reference images below.'
            )
            .replace(
              /User request:?\s*\{user_prompt\}/i,
              'Please create an example illustration showcasing this style.'
            )
            .replace('{user_prompt}', '')
        }
      }
    } else if (style) {
      fullPrompt = `${style} style: ${prompt}`
    }

    // 如果有上传图片但没有专用风格提示词，添加通用背景匹配指令（英文）
    // 有专用风格提示词（如 fashion-outfit）时跳过，避免指令冲突
    if (images && Array.isArray(images) && images.length > 0 && !hasStylePrompt && !hasFrameworkPrompt) {
      const imageCount = images.length
      const backgroundInstruction = `
IMPORTANT INSTRUCTIONS - Please read carefully:

${imageCount > 1
  ? `You are provided with ${imageCount} reference images of clothing. These show the SAME clothing items from different angles or in different conditions.

CRITICAL: DO NOT create multiple copies of the same item (e.g., do not show two pairs of pants side by side).
INSTEAD: Create ONE professional flat-lay product showcase image combining all the clothing items shown in the references.`
  : 'You are provided with 1 reference image of clothing item(s).'}

Flat-lay product showcase requirements:
1. Create a professional flat-lay product image with clothing laid flat on a surface (NOT on a model or mannequin).
2. Arrange the clothing items neatly with proper spacing - DO NOT stack or overlap items. Each piece should be clearly visible and separated.
3. Analyze the clothing colors and style, then choose a harmonious background:
   - Warm-toned clothing (red, orange, yellow, brown) → warm backgrounds (beige, light brown, warm gray, cream)
   - Cool-toned clothing (blue, green, purple) → cool backgrounds (light blue, mint green, light purple, cool gray)
   - Black/white/gray clothing → clean solid backgrounds or subtle gradients
   - Patterned/printed clothing → solid clean backgrounds to avoid visual competition
   - Spring/summer items → fresh and bright background colors
   - Fall/winter items → warm and sophisticated background colors
4. Background should be clean, professional, and highlight the clothing.
5. Add subtle shadows and natural lighting for depth and dimension.
6. The image should look like a professional e-commerce or Instagram flat-lay photo.
7. Show each clothing type ONCE only - no duplicates.
`
      fullPrompt = backgroundInstruction + '\n\n' + (fullPrompt || 'Generate a professional flat-lay product showcase image based on the uploaded clothing photos.')
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

    // ========== 2K/4K 高清线路（含优质线路）：走 images/edits 接口 ==========
    if (isHDResolution(resolvedResolution)) {
      const hdApiKey = providerApiKey
      if (!hdApiKey) {
        throw new Error(`图像服务配置错误：${providerConfig.apiKeyEnv} 未配置，请联系管理员`)
      }

      const hdModel = getHDModel(resolvedResolution)
      const hdUrl = getHDApiUrl()

      // 构建 FormData（images/edits 接口使用 multipart/form-data）
      const formData = new FormData()
      formData.append('model', hdModel)
      formData.append('prompt', fullPrompt)
      formData.append('n', '1')
      formData.append('response_format', 'b64_json')

      // images/edits 接口要求 image 参数
      // 如果用户上传了参考图片，使用第一张；否则发送一个 1x1 透明占位图
      if (images && Array.isArray(images) && images.length > 0) {
        const firstImage = await resolveImageToDataUrl(images[0])
        const matches = firstImage.match(/^data:([^;]+);base64,(.+)$/)
        if (matches) {
          const binaryStr = atob(matches[2])
          const bytes = new Uint8Array(binaryStr.length)
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i)
          }
          const blob = new Blob([bytes], { type: matches[1] })
          formData.append('image', blob, 'image.png')
        }
      } else {
        // 1x1 透明 PNG 占位图
        const placeholderB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
        const binaryStr = atob(placeholderB64)
        const bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: 'image/png' })
        formData.append('image', blob, 'placeholder.png')
      }

      const hdResponse = await fetch(hdUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hdApiKey}`,
        },
        body: formData,
      })

      if (!hdResponse.ok) {
        const errorText = await hdResponse.text()
        console.error(`[ai-image] BLTCY HD (${hdModel}) API error: ${hdResponse.status} - ${errorText}`)
        throw new Error(`BLTCY ${resolvedResolution.toUpperCase()} API 错误: ${hdResponse.status} - ${errorText}`)
      }

      const hdData = await hdResponse.json()

      // 解析 OpenAI 格式响应
      let imageBase64: string | null = null
      if (hdData.data && hdData.data.length > 0) {
        const item = hdData.data[0]
        if (item.b64_json) {
          imageBase64 = `data:image/png;base64,${item.b64_json}`
        } else if (item.url) {
          // 如果返回的是 URL，需要下载图片
          const imgResp = await fetch(item.url)
          const imgBuffer = await imgResp.arrayBuffer()
          const imgBytes = new Uint8Array(imgBuffer)
          let imgBinary = ''
          const chunkSize = 8192
          for (let i = 0; i < imgBytes.length; i += chunkSize) {
            imgBinary += String.fromCharCode(...imgBytes.subarray(i, i + chunkSize))
          }
          const base64 = btoa(imgBinary)
          imageBase64 = `data:image/png;base64,${base64}`
        }
      }

      if (!imageBase64) {
        throw new Error('未能生成高清图片')
      }

      // 尝试上传到 Storage 返回 URL（减小响应体积，优化手机端）
      let imageUrl: string | null = null
      if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
        imageUrl = await uploadImageToStorage(SUPABASE_URL, SUPABASE_SERVICE_KEY, imageBase64)
      }

      if (imageUrl) {
        console.log(`[ai-image] HD 图片已上传 Storage，返回 URL`)
        return new Response(JSON.stringify({
          success: true,
          imageUrl,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Storage 上传失败时回退到 base64
      console.log(`[ai-image] HD Storage 上传失败，回退 base64`)
      return new Response(JSON.stringify({
        success: true,
        imageBase64,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ========== 普通线路：走 Gemini generateContent 接口 ==========

    // 构建 Vertex AI 格式的请求内容
    type PartType = { text: string } | { inlineData: { mimeType: string; data: string } }
    const parts: PartType[] = []

    // 添加文本提示词
    parts.push({ text: fullPrompt })

    // 如果有上传的图片，添加到请求中（支持 data URL 和 http URL）
    if (images && Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        const resolved = await resolveImageToDataUrl(img)
        // 从 base64 data URL 中提取实际数据
        const matches = resolved.match(/^data:([^;]+);base64,(.+)$/)
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

    // 构建 contents 数组：支持多轮对话
    type ContentType = { role: string; parts: PartType[] }
    let contents: ContentType[] = []

    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      // 多轮对话模式：使用历史记录 + 当前新消息
      contents = [...conversationHistory, { role: 'user', parts }]
    } else {
      // 单轮模式（首次生成）
      contents = [{ role: 'user', parts }]
    }

    // 调用对应线路 API 生成图像
    const apiUrl = buildGenerateContentUrl(providerConfig)
    const generationConfig = {
      responseModalities: ['IMAGE'],
      imageConfig: aspectRatio ? { aspectRatio } : undefined,
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${providerApiKey}`,
      },
      body: JSON.stringify({
        contents,
        generationConfig,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[ai-image] ${providerName} API error: ${response.status} - ${errorText}`)

      // 区分不同的错误类型，提供更友好的错误信息
      if (response.status === 401) {
        throw new Error(`${providerName} 认证失败：API Key 无效或已过期，请联系管理员更新`)
      } else if (response.status === 403) {
        throw new Error(`${providerName} 访问被拒绝：API Key 权限不足`)
      } else if (response.status === 429) {
        throw new Error(`${providerName} 请求过于频繁，请稍后再试`)
      } else if (response.status === 546) {
        throw new Error(`BLTCY 服务暂时不可用（错误码 546），请切换到高级线路或稍后重试`)
      } else if (response.status >= 500) {
        throw new Error(`${providerName} 服务暂时不可用，请稍后再试`)
      } else {
        throw new Error(`${providerName} API 错误: ${response.status} - ${errorText}`)
      }
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

    // 尝试上传到 Storage 返回 URL（减小响应体积，优化手机端）
    let imageUrl: string | null = null
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      imageUrl = await uploadImageToStorage(SUPABASE_URL, SUPABASE_SERVICE_KEY, imageBase64)
    }

    if (imageUrl) {
      console.log(`[ai-image] 标准线路图片已上传 Storage，返回 URL`)
      return new Response(JSON.stringify({
        success: true,
        imageUrl,
        textContent,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Storage 上传失败时回退到 base64
    console.log(`[ai-image] 标准线路 Storage 上传失败，回退 base64`)
    return new Response(JSON.stringify({
      success: true,
      imageBase64,
      textContent,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    // 生成失败时退还积分
    if (supabaseAdmin && userId && creditCost > 0) {
      try {
        await supabaseAdmin.rpc('add_credits', { p_user_id: userId, p_amount: creditCost, p_description: '退款-' + (feature_code || 'ai_image') })
        console.log(`[ai-image] Refunded ${creditCost} credits to user ${userId}`)
      } catch (refundErr) {
        console.error(`[ai-image] Refund failed:`, refundErr)
      }
    }

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
