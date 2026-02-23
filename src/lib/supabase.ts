import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kzdjqqinkonqlclbwleh.supabase.co'
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZGpxcWlua29ucWxjbGJ3bGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTQ0ODcsImV4cCI6MjA4NTgzMDQ4N30.CrgPY7OI6eSoEe9CNDlK0apob1UG8KH5v21GI2UQS6I'

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function isTokenValid(token: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getUser(token)
    return !error && Boolean(data?.user)
  } catch {
    return false
  }
}

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
      const stillValid = await isTokenValid(session.access_token)
      if (stillValid) return session.access_token
    }
  }

  // session 为空或即将过期，强制刷新
  const { data: { session: refreshed } } = await supabase.auth.refreshSession()
  if (refreshed?.access_token) {
    const refreshedValid = await isTokenValid(refreshed.access_token)
    if (refreshedValid) return refreshed.access_token
  }

  return null
}

/**
 * 强制刷新 token（用于 401 重试场景）
 */
export async function forceRefreshToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.refreshSession()
  if (!session?.access_token) return null
  const valid = await isTokenValid(session.access_token)
  return valid ? session.access_token : null
}
