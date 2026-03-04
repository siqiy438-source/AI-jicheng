/**
 * Supabase Edge Function: Upload to Aliyun OSS
 * 将视频从 Supabase Storage 转存到阿里云 OSS
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 阿里云 OSS 配置
const OSS_ACCESS_KEY_ID = Deno.env.get('OSS_ACCESS_KEY_ID')
const OSS_ACCESS_KEY_SECRET = Deno.env.get('OSS_ACCESS_KEY_SECRET')
const OSS_BUCKET = Deno.env.get('OSS_BUCKET') || 'yuansiqi'
const OSS_REGION = Deno.env.get('OSS_REGION') || 'oss-cn-beijing'
const OSS_ENDPOINT = `https://${OSS_BUCKET}.${OSS_REGION}.aliyuncs.com`

/**
 * 生成阿里云 OSS 签名
 */
function generateOSSSignature(
  method: string,
  contentMD5: string,
  contentType: string,
  date: string,
  ossHeaders: Record<string, string>,
  resource: string
): string {
  const canonicalizedOSSHeaders = Object.keys(ossHeaders)
    .sort()
    .map(key => `${key}:${ossHeaders[key]}\n`)
    .join('')

  const stringToSign = [
    method,
    contentMD5,
    contentType,
    date,
    canonicalizedOSSHeaders + resource,
  ].join('\n')

  const hmac = createHmac('sha1', OSS_ACCESS_KEY_SECRET!)
  hmac.update(stringToSign)
  return hmac.digest('base64')
}

/**
 * 上传文件到阿里云 OSS
 */
async function uploadToOSS(
  objectKey: string,
  fileData: Uint8Array,
  contentType: string
): Promise<string> {
  const date = new Date().toUTCString()
  const resource = `/${OSS_BUCKET}/${objectKey}`

  const signature = generateOSSSignature(
    'PUT',
    '',
    contentType,
    date,
    {},
    resource
  )

  const url = `${OSS_ENDPOINT}/${objectKey}`

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Date': date,
      'Content-Type': contentType,
      'Authorization': `OSS ${OSS_ACCESS_KEY_ID}:${signature}`,
    },
    body: fileData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OSS upload failed: ${response.status} ${errorText}`)
  }

  return url
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Supabase configuration missing')
    }

    if (!OSS_ACCESS_KEY_ID || !OSS_ACCESS_KEY_SECRET) {
      throw new Error('OSS configuration missing')
    }

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return new Response(JSON.stringify({ error: '用户认证失败' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: '用户认证失败' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { supabase_path } = await req.json()

    if (!supabase_path) {
      throw new Error('supabase_path is required')
    }

    console.log('[upload-to-oss] Downloading from Supabase Storage:', supabase_path)

    // 1. 从 Supabase Storage 下载文件
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('user-uploads')
      .download(supabase_path)

    if (downloadError || !fileData) {
      throw new Error(`Failed to download from Supabase: ${downloadError?.message}`)
    }

    console.log('[upload-to-oss] Downloaded file size:', fileData.size)

    // 2. 转换为 Uint8Array
    const arrayBuffer = await fileData.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // 3. 生成 OSS 对象键（保持相同的路径结构）
    const ossKey = `video-analysis/${supabase_path.split('/').pop()}`
    const contentType = fileData.type || 'video/mp4'

    console.log('[upload-to-oss] Uploading to OSS:', ossKey)

    // 4. 上传到阿里云 OSS
    const ossUrl = await uploadToOSS(ossKey, uint8Array, contentType)

    console.log('[upload-to-oss] Upload successful:', ossUrl)

    // 注意：不在这里删除 Supabase Storage 文件
    // 文件将在分析完成后由 ai-video-analysis 删除

    return new Response(JSON.stringify({
      success: true,
      oss_url: ossUrl,
      oss_key: ossKey,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[upload-to-oss] Error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
