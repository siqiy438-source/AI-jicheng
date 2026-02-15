import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 获取有效的用户 access_token，自动处理过期刷新
 * 如果用户未登录则返回 null
 */
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.access_token && session.expires_at) {
    // 提前 60 秒刷新，避免发出去的 token 刚好过期
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at > now + 60) {
      return session.access_token
    }
  }

  // session 为空或即将过期，强制刷新
  const { data: { session: refreshed } } = await supabase.auth.refreshSession()
  return refreshed?.access_token || null
}

/**
 * 强制刷新 token（用于 401 重试场景）
 */
export async function forceRefreshToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.refreshSession()
  return session?.access_token || null
}
