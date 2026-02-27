/**
 * Supabase Edge Function: Admin User Management
 * 管理员用户操作：创建、删除、禁用、解禁
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // 验证管理员身份
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return jsonResponse({ success: false, error: '未提供认证信息' }, 401)

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return jsonResponse({ success: false, error: '用户认证失败' }, 401)

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return jsonResponse({ success: false, error: 'FORBIDDEN' }, 403)
    }

    const { action, ...params } = await req.json()

    switch (action) {
      case 'create': {
        const { email, password, credits, role } = params
        if (!email || !password) return jsonResponse({ success: false, error: '邮箱和密码必填' }, 400)

        const { data: newUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
          })
        if (createError) return jsonResponse({ success: false, error: createError.message }, 400)

        // trigger 自动创建 profiles 行，按需覆盖角色和积分
        const updates: Record<string, unknown> = {}
        if (role === 'admin') updates.role = 'admin'
        if (credits && Number(credits) > 0) updates.credits = Number(credits)
        if (Object.keys(updates).length > 0) {
          await supabaseAdmin.from('profiles').update(updates).eq('id', newUser.user!.id)
        }

        return jsonResponse({ success: true, user_id: newUser.user!.id })
      }

      case 'delete': {
        const { userId } = params
        if (!userId) return jsonResponse({ success: false, error: '缺少 userId' }, 400)
        if (userId === user.id) return jsonResponse({ success: false, error: '不能删除自己' }, 400)

        // 清理 storage 文件
        for (const bucket of ['works-assets', 'materials-assets']) {
          try {
            const { data: files } = await supabaseAdmin.storage
              .from(bucket).list(userId, { limit: 1000 })
            if (files && files.length > 0) {
              const paths = files.map((f: { name: string }) => `${userId}/${f.name}`)
              await supabaseAdmin.storage.from(bucket).remove(paths)
            }
          } catch { /* bucket 可能不存在，忽略 */ }
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (deleteError) return jsonResponse({ success: false, error: deleteError.message }, 400)

        return jsonResponse({ success: true })
      }

      case 'ban': {
        const { userId } = params
        if (!userId) return jsonResponse({ success: false, error: '缺少 userId' }, 400)
        if (userId === user.id) return jsonResponse({ success: false, error: '不能禁用自己' }, 400)

        const { error: banError } =
          await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: '876000h' })
        if (banError) return jsonResponse({ success: false, error: banError.message }, 400)

        return jsonResponse({ success: true })
      }

      case 'unban': {
        const { userId } = params
        if (!userId) return jsonResponse({ success: false, error: '缺少 userId' }, 400)

        const { error: unbanError } =
          await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: 'none' })
        if (unbanError) return jsonResponse({ success: false, error: unbanError.message }, 400)

        return jsonResponse({ success: true })
      }

      default:
        return jsonResponse({ success: false, error: `未知操作: ${action}` }, 400)
    }
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      500
    )
  }
})
