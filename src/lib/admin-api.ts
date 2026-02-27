import { supabaseUrl, supabaseAnonKey, getAccessToken, forceRefreshToken } from './supabase'

interface AdminUserAction {
  action: 'create' | 'delete' | 'ban' | 'unban'
  [key: string]: unknown
}

export async function callAdminUsers(params: AdminUserAction): Promise<{ success: boolean; error?: string; [key: string]: unknown }> {
  let token = await getAccessToken()
  if (!token) throw new Error('未登录')

  const doFetch = async (t: string) => {
    const res = await fetch(`${supabaseUrl}/functions/v1/admin-users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${t}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })
    return res.json()
  }

  let result = await doFetch(token)

  if (!result.success && result.error?.includes('认证失败')) {
    const refreshed = await forceRefreshToken()
    if (refreshed) result = await doFetch(refreshed)
  }

  return result
}
