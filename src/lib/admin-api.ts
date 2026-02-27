import { supabaseUrl, supabaseAnonKey, getAccessToken, forceRefreshToken } from './supabase'

interface AdminUserAction {
  action: 'create' | 'delete' | 'ban' | 'unban'
  [key: string]: unknown
}

export async function callAdminUsers(params: AdminUserAction): Promise<{ success: boolean; error?: string; [key: string]: unknown }> {
  let token = await getAccessToken()
  if (!token) throw new Error('未登录')

  const doFetch = async (t: string) => {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/admin-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${t}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const text = await res.text()
        try { return JSON.parse(text) } catch { return { success: false, error: `请求失败 (${res.status})` } }
      }
      return res.json()
    } catch (e) {
      return { success: false, error: e instanceof Error ? `网络错误: ${e.message}` : '网络请求失败' }
    }
  }

  let result = await doFetch(token)

  if (!result.success && result.error?.includes('认证失败')) {
    const refreshed = await forceRefreshToken()
    if (refreshed) result = await doFetch(refreshed)
  }

  return result
}
