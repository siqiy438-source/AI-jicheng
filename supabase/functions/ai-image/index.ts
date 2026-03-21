/**
 * Supabase Edge Function: AI Image Generation
 * 使用 BLTCY API 生成图像（标准/极速/2K/4K 线路走 Gemini generateContent，支持多图参考）
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { buildGenerateContentUrl, getImageProvider, getProviderConfig, isHDResolution, isPremiumHD, getHDModel, getHDApiUrl, PIXEL_ART_MODEL, SPEED_IMAGE_MODEL, ZENMUX_PRO_IMAGE_MODEL, getZenMuxImageUrl } from "./provider.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_REMOTE_IMAGE_BYTES = 10 * 1024 * 1024

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

function isPrivateOrLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host === '::1' || host === '[::1]') return true
  if (host.endsWith('.local')) return true

  const ipv4Match = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (!ipv4Match) return false

  const octets = ipv4Match.slice(1).map(Number)
  if (octets.some((num) => Number.isNaN(num) || num < 0 || num > 255)) return true
  if (octets[0] === 10) return true
  if (octets[0] === 127) return true
  if (octets[0] === 169 && octets[1] === 254) return true
  if (octets[0] === 192 && octets[1] === 168) return true
  if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true

  return false
}

function buildAllowedImageHosts(supabaseUrl?: string | null): Set<string> {
  const hosts = new Set<string>()
  if (!supabaseUrl) return hosts

  try {
    const parsed = new URL(supabaseUrl)
    hosts.add(parsed.hostname.toLowerCase())
  } catch (error) {
    console.warn('[ai-image] Invalid SUPABASE_URL when building allowlist:', error)
  }

  return hosts
}

function isAllowedRemoteHost(hostname: string, allowedHosts: Set<string>): boolean {
  const host = hostname.toLowerCase()
  for (const allowedHost of allowedHosts) {
    if (host === allowedHost || host.endsWith(`.${allowedHost}`)) {
      return true
    }
  }
  return false
}

/** 如果 image 是 https URL 且在 allowlist 内则下载并转为 data URL，否则原样返回 */
async function resolveImageToDataUrl(image: string, allowedHosts: Set<string>): Promise<string> {
  if (image.startsWith('data:')) return image
  if (image.startsWith('http://')) {
    throw new Error('仅支持 HTTPS 远程图片链接')
  }
  if (image.startsWith('https://')) {
    const parsed = new URL(image)
    if (isPrivateOrLocalHostname(parsed.hostname)) {
      throw new Error('不允许访问本地或内网地址')
    }
    if (!isAllowedRemoteHost(parsed.hostname, allowedHosts)) {
      throw new Error('远程图片域名不在允许列表')
    }

    const resp = await fetch(image, { redirect: 'error' })
    if (!resp.ok) {
      throw new Error(`远程图片下载失败: ${resp.status}`)
    }

    const contentLengthHeader = resp.headers.get('content-length')
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader)
      if (Number.isFinite(contentLength) && contentLength > MAX_REMOTE_IMAGE_BYTES) {
        throw new Error('远程图片过大，超过 10MB 限制')
      }
    }

    const buf = await resp.arrayBuffer()
    if (buf.byteLength > MAX_REMOTE_IMAGE_BYTES) {
      throw new Error('远程图片过大，超过 10MB 限制')
    }

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
  let creditOperationId: string | null = null
  let creditOperationFeatureCode: string | null = null

  const finalizeCreditOperation = async (isSuccess: boolean, errorMessage?: string) => {
    if (!supabaseAdmin || !userId || !creditOperationId || !creditOperationFeatureCode) return
    try {
      const { data: finalizeResult, error: finalizeError } = await supabaseAdmin.rpc('finalize_credit_operation', {
        p_user_id: userId,
        p_operation_id: creditOperationId,
        p_feature_code: creditOperationFeatureCode,
        p_success: isSuccess,
        p_error_message: errorMessage || null,
      })
      if (finalizeError || !finalizeResult?.success) {
        console.error('[ai-image] finalize_credit_operation failed:', finalizeError || finalizeResult)
      }
    } catch (finalizeErr) {
      console.error('[ai-image] finalize_credit_operation exception:', finalizeErr)
    }
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const { prompt, style, aspectRatio, negativePrompt, styleId, images, line, resolution, hasFrameworkPrompt, conversationHistory, feature_code, request_id } = await req.json()

    // ========== 积分扣减 ==========
    const CREDIT_COSTS: Record<string, number> = {
      ai_image_standard: 50, ai_image_premium: 100, ai_image_hd: 100,
      ai_display_standard: 50, ai_display_premium: 100, ai_display_hd: 100,
      ai_outfit_standard: 50, ai_outfit_premium: 100, ai_outfit_hd: 100,
      ai_fashion_standard: 50, ai_fashion_premium: 100, ai_fashion_hd: 100,
      ai_virtual_tryon_standard: 50, ai_virtual_tryon_premium: 100, ai_virtual_tryon_hd: 100,
      ai_detail_standard: 50, ai_detail_premium: 100, ai_detail_hd: 100,
      ai_flatlay_standard: 50, ai_flatlay_premium: 100, ai_flatlay_hd: 100,
      ai_outfit_visual_standard: 50,
      ai_ppt_image_standard: 50, ai_ppt_image_hd: 100,
      ai_pixel_art: 50,
    }

    if (!feature_code || !(feature_code in CREDIT_COSTS)) {
      return new Response(JSON.stringify({ success: false, error: 'feature_code 缺失或无效' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: '请先登录后再使用图像生成功能' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('服务端配置错误：SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 未配置')
    }

    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: '用户认证失败，请重新登录' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    userId = user.id
    creditCost = CREDIT_COSTS[feature_code]

    if (creditCost > 0) {
      const resolvedRequestId = typeof request_id === 'string' && request_id.trim() ? request_id.trim() : crypto.randomUUID()
      creditOperationId = resolvedRequestId
      creditOperationFeatureCode = feature_code

      const { data: beginResult, error: beginError } = await supabaseAdmin.rpc('begin_credit_operation', {
        p_user_id: userId,
        p_operation_id: resolvedRequestId,
        p_feature_code: creditOperationFeatureCode,
        p_amount: creditCost,
        p_description: creditOperationFeatureCode,
      })

      if (beginError || !beginResult?.success) {
        const errMsg = beginResult?.error === 'INSUFFICIENT_BALANCE'
          ? `积分不足，需要 ${creditCost} 积分，当前余额 ${beginResult?.balance || 0}`
          : '积分扣减失败'
        return new Response(JSON.stringify({ success: false, error: errMsg }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (!beginResult?.already_exists) {
        console.log(`[ai-image] Deducted ${creditCost} credits from user ${userId}`)
      } else {
        console.log(`[ai-image] Reused credit operation ${resolvedRequestId} for user ${userId} (status=${beginResult?.status})`)
      }
    }
    const allowedImageHosts = buildAllowedImageHosts(SUPABASE_URL)

    const isPixelArt = feature_code === 'ai_pixel_art'
    const resolvedLine = getImageProvider(line)
    // 优质线路走 ZenMux 专属分支，不需要强制 2K
    const resolvedResolution = resolution || "default"
    const providerConfig = getProviderConfig(resolvedLine)

    // 像素块生成使用专用模型
    if (isPixelArt) {
      providerConfig.model = PIXEL_ART_MODEL
    }
    // 极速线路使用 BLTCY 的 Gemini 3.1 Flash Image Preview 兼容别名
    else if (!isPixelArt && resolvedResolution === 'speed') {
      providerConfig.model = SPEED_IMAGE_MODEL
    }
    // 2K/4K 高清线路使用对应的高清模型（改为走 generateContent 接口以支持多图参考）
    else if (isHDResolution(resolvedResolution)) {
      providerConfig.model = getHDModel(resolvedResolution)
    }

    const providerApiKey = Deno.env.get(providerConfig.apiKeyEnv)
    const providerName = "BLTCY"

    // 调试日志：确认线路和模型选择
    const actualModel = isHDResolution(resolvedResolution) ? getHDModel(resolvedResolution) : providerConfig.model
    console.log(`[ai-image] 请求参数 → line=${line}, resolution=${resolution}, feature=${feature_code}`)
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

    // 像素块生成：使用专属 prompt，跳过通用平铺摄影指令
    if (isPixelArt && images && Array.isArray(images) && images.length > 0) {
      fullPrompt = `Convert this image into a cute, flat pixel art style like Miffy or Sanrio characters — large solid color blocks, minimal total colors.
Requirements:
- FACE / SKIN: use at most 2-3 flat colors total (one main skin tone, one for eyes/features, optionally one for blush). Absolutely NO gradients, shadows, highlights, or color variations on skin areas
- Every color region must be large, solid, and perfectly uniform — no dithering, no anti-aliasing, no subtle shading
- Use bold, saturated colors with sharp pixel-perfect boundaries between regions
- Keep the main subject clearly recognizable but highly simplified and stylized into a cartoon look
- Minimize total distinct colors (ideally ≤ 15 across the entire image)
- The result should look like it was made with colored beads or cross-stitch thread
- Make each color region large enough to be counted and reproduced by hand
- No text, no watermarks, no decorative elements
- Square output preferred`
      hasStylePrompt = true
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

    // ========== 灵犀Pro线路：走 ZenMux Vertex AI generateContent ==========
    if (resolvedLine === "premium") {
      const zenMuxApiKey = Deno.env.get('ZENMUX_API_KEY')
      if (!zenMuxApiKey) {
        throw new Error('图像服务配置错误：ZENMUX_API_KEY 未配置，请联系管理员')
      }

      // 构建 parts：文字提示词 + 参考图片（如有）
      type ZenPartType = { text: string } | { inlineData: { mimeType: string; data: string } }
      const zenParts: ZenPartType[] = [{ text: fullPrompt }]

      if (images && Array.isArray(images) && images.length > 0) {
        for (const img of images) {
          const resolved = await resolveImageToDataUrl(img, allowedImageHosts)
          const matches = resolved.match(/^data:([^;]+);base64,(.+)$/)
          if (matches) {
            zenParts.push({ inlineData: { mimeType: matches[1], data: matches[2] } })
          }
        }
      }

      const zenRequestBody = JSON.stringify({
        contents: [{ role: 'user', parts: zenParts }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
          ...(aspectRatio ? { imageConfig: { aspectRatio } } : {}),
        },
      })

      const zenApiUrl = `https://zenmux.ai/api/vertex-ai/v1/models/${ZENMUX_PRO_IMAGE_MODEL}:generateContent`
      console.log(`[ai-image] ZenMux Pro → model=${ZENMUX_PRO_IMAGE_MODEL}, images=${zenParts.length - 1}`)
      const zenResponse = await fetch(zenApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${zenMuxApiKey}`,
        },
        body: zenRequestBody,
      })

      if (!zenResponse.ok) {
        const errorText = await zenResponse.text()
        console.error(`[ai-image] ZenMux Pro API error: ${zenResponse.status} - ${errorText}`)
        throw new Error(`ZenMux Pro API 错误: ${zenResponse.status} - ${errorText}`)
      }

      const zenData = await zenResponse.json()

      // 解析 Vertex AI 格式响应
      let imageBase64: string | null = null
      const zenCandidates = zenData.candidates || []
      for (const candidate of zenCandidates) {
        for (const part of (candidate.content?.parts || [])) {
          if (part.inlineData) {
            imageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
            break
          }
        }
        if (imageBase64) break
      }

      if (!imageBase64) {
        console.error(`[ai-image] ZenMux Pro 未找到图片，candidates=${zenCandidates.length}`)
        throw new Error('ZenMux Pro 未能生成图片')
      }

      let imageUrl: string | null = null
      if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
        imageUrl = await uploadImageToStorage(SUPABASE_URL, SUPABASE_SERVICE_KEY, imageBase64)
      }

      if (imageUrl) {
        await finalizeCreditOperation(true)
        console.log(`[ai-image] ZenMux Pro 图片已上传 Storage，返回 URL`)
        return new Response(JSON.stringify({ success: true, imageUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      await finalizeCreditOperation(true)
      console.log(`[ai-image] ZenMux Pro Storage 上传失败，回退 base64`)
      return new Response(JSON.stringify({ success: true, imageBase64 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }


    // ========== 2K/4K 高清线路：走 BLTCY images/edits 接口 ==========
    if (isHDResolution(resolvedResolution)) {
      const hdModel = getHDModel(resolvedResolution)
      const hdUrl = getHDApiUrl()

      const formData = new FormData()
      formData.append('model', hdModel)
      formData.append('prompt', fullPrompt)
      formData.append('n', '1')
      formData.append('response_format', 'b64_json')

      // BLTCY 的高清编辑接口要求始终传 image 字段。
      // 有参考图时使用第一张；纯文生图时回退到 1x1 占位图。
      if (images && Array.isArray(images) && images.length > 0) {
        const firstImage = await resolveImageToDataUrl(images[0], allowedImageHosts)
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
          'Authorization': `Bearer ${providerApiKey}`,
        },
        body: formData,
      })

      if (!hdResponse.ok) {
        const errorText = await hdResponse.text()
        console.error(`[ai-image] BLTCY HD (${hdModel}) API error: ${hdResponse.status} - ${errorText}`)
        throw new Error(`BLTCY ${resolvedResolution.toUpperCase()} API 错误: ${hdResponse.status} - ${errorText}`)
      }

      const hdData = await hdResponse.json()
      console.log(`[ai-image] BLTCY HD 响应结构 model=${hdModel}:`, JSON.stringify({
        ...hdData,
        data: Array.isArray(hdData?.data)
          ? hdData.data.map((item: Record<string, unknown>) => (
              item?.b64_json
                ? { ...item, b64_json: '[BASE64_OMITTED]' }
                : item
            ))
          : hdData?.data,
      }))

      let imageBase64: string | null = null
      if (Array.isArray(hdData?.data) && hdData.data.length > 0) {
        const item = hdData.data[0]
        if (item?.b64_json) {
          imageBase64 = `data:image/png;base64,${item.b64_json}`
        } else if (item?.url) {
          const imgResp = await fetch(item.url)
          if (!imgResp.ok) {
            throw new Error(`高清图片下载失败: ${imgResp.status}`)
          }
          const imgBuffer = await imgResp.arrayBuffer()
          const imgBytes = new Uint8Array(imgBuffer)
          let imgBinary = ''
          const chunkSize = 8192
          for (let i = 0; i < imgBytes.length; i += chunkSize) {
            imgBinary += String.fromCharCode(...imgBytes.subarray(i, i + chunkSize))
          }
          imageBase64 = `data:image/png;base64,${btoa(imgBinary)}`
        }
      }

      if (!imageBase64) {
        console.error(`[ai-image] BLTCY HD 未找到图片数据，model=${hdModel}`)
        throw new Error('未能生成高清图片')
      }

      let imageUrl: string | null = null
      if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
        imageUrl = await uploadImageToStorage(SUPABASE_URL, SUPABASE_SERVICE_KEY, imageBase64)
      }

      if (imageUrl) {
        await finalizeCreditOperation(true)
        console.log(`[ai-image] HD 图片已上传 Storage，返回 URL`)
        return new Response(JSON.stringify({
          success: true,
          imageUrl,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      await finalizeCreditOperation(true)
      console.log(`[ai-image] HD Storage 上传失败，回退 base64`)
      return new Response(JSON.stringify({
        success: true,
        imageBase64,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ========== 标准/极速线路：走 BLTCY generateContent 接口 ==========

    // 构建 Vertex AI 格式的请求内容
    type PartType = { text: string } | { inlineData: { mimeType: string; data: string } }
    const parts: PartType[] = []

    // 添加文本提示词
    parts.push({ text: fullPrompt })

    // 如果有上传的图片，添加到请求中（支持 data URL 和 http URL）
    if (images && Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        const resolved = await resolveImageToDataUrl(img, allowedImageHosts)
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

    // 调用对应线路 API 生成图像（546 自动重试，最多 2 次）
    const apiUrl = buildGenerateContentUrl(providerConfig)
    const generationConfig = {
      responseModalities: ['IMAGE', 'TEXT'],
      ...(aspectRatio ? { imageConfig: { aspectRatio } } : {}),
    }
    const requestBody = JSON.stringify({ contents, generationConfig })

    let response: Response | null = null
    const MAX_RETRIES = 2
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providerApiKey}`,
        },
        body: requestBody,
      })

      if (response.ok) break

      const errorText = await response.text()
      console.error(`[ai-image] ${providerName} API error (attempt ${attempt}/${MAX_RETRIES}): ${response.status} - ${errorText}`)

      if (response.status === 546 && attempt < MAX_RETRIES) {
        console.log(`[ai-image] 546 服务过载，1.5s 后重试 (${attempt}/${MAX_RETRIES})...`)
        await new Promise(r => setTimeout(r, 1500))
        continue
      }

      // 不可重试的错误直接抛出
      if (response.status === 401) {
        throw new Error(`${providerName} 认证失败：API Key 无效或已过期，请联系管理员更新`)
      } else if (response.status === 403) {
        throw new Error(`${providerName} 访问被拒绝：API Key 权限不足`)
      } else if (response.status === 429) {
        throw new Error(`${providerName} 请求过于频繁，请稍后再试`)
      } else if (response.status === 546) {
        throw new Error(`当前线路服务繁忙，请点击重试或切换到其他线路`)
      } else if (response.status >= 500) {
        throw new Error(`${providerName} 服务暂时不可用，请稍后再试`)
      } else {
        throw new Error(`${providerName} API 错误: ${response.status} - ${errorText}`)
      }
    }

    const data = await response.json()

    // 调试：打印 BLTCY 返回结构（排除 base64 图片数据）
    const debugData = JSON.parse(JSON.stringify(data))
    if (debugData.candidates) {
      debugData.candidates = debugData.candidates.map((c: Record<string, unknown>) => ({
        ...c,
        content: c.content ? {
          ...(c.content as Record<string, unknown>),
          parts: ((c.content as Record<string, unknown>).parts as Array<Record<string, unknown>>)?.map((p: Record<string, unknown>) => (
            p.inlineData ? { inlineData: { mimeType: (p.inlineData as Record<string, unknown>).mimeType, data: '[BASE64_OMITTED]' } } : p
          ))
        } : c.content
      }))
    }
    console.log(`[ai-image] BLTCY 响应结构 model=${providerConfig.model}:`, JSON.stringify(debugData))

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
      console.error(`[ai-image] 未找到图片数据，候选项数量=${candidates.length}，finishReasons=${candidates.map((c: Record<string, unknown>) => c.finishReason).join(',')}`)
      throw new Error('未能生成图片')
    }

    // 尝试上传到 Storage 返回 URL（减小响应体积，优化手机端）
    let imageUrl: string | null = null
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      imageUrl = await uploadImageToStorage(SUPABASE_URL, SUPABASE_SERVICE_KEY, imageBase64)
    }

    if (imageUrl) {
      await finalizeCreditOperation(true)
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
    await finalizeCreditOperation(true)
    console.log(`[ai-image] 标准线路 Storage 上传失败，回退 base64`)
    return new Response(JSON.stringify({
      success: true,
      imageBase64,
      textContent,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    await finalizeCreditOperation(false, error instanceof Error ? error.message : String(error))

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
