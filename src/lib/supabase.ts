import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kzdjqqinkonqlclbwleh.supabase.co'
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZGpxcWlua29ucWxjbGJ3bGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTQ0ODcsImV4cCI6MjA4NTgzMDQ4N30.CrgPY7OI6eSoEe9CNDlK0apob1UG8KH5v21GI2UQS6I'

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 获取有效的用户 access_token，自动处理过期刷新
 * 如果用户未登录则返回 null
 */
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) return session.access_token

  // session 为空或过期，尝试刷新
  const { data: { session: refreshed } } = await supabase.auth.refreshSession()
  return refreshed?.access_token || null
}
