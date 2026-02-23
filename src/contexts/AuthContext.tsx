import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isConfigured: boolean
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const syncInitialSession = async () => {
      const { data } = await supabase.auth.getSession()
      const initialSession = data?.session ?? null

      if (!initialSession?.access_token) {
        setSession(null)
        setUser(null)
        setLoading(false)
        return
      }

      // 防止本地缓存 session 失效导致“看起来已登录，实际请求 401”
      const { data: userData, error: userError } = await supabase.auth.getUser(initialSession.access_token)
      if (!userError && userData?.user) {
        setSession(initialSession)
        setUser(userData.user)
        setLoading(false)
        return
      }

      const { data: refreshedData } = await supabase.auth.refreshSession()
      const refreshedSession = refreshedData?.session ?? null
      if (!refreshedSession?.access_token) {
        setSession(null)
        setUser(null)
        setLoading(false)
        return
      }

      const { data: refreshedUserData, error: refreshedUserError } = await supabase.auth.getUser(refreshedSession.access_token)
      if (!refreshedUserError && refreshedUserData?.user) {
        setSession(refreshedSession)
        setUser(refreshedUserData.user)
      } else {
        setSession(null)
        setUser(null)
      }
      setLoading(false)
    }

    void syncInitialSession()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (!error) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        return { error: signInError }
      }
    }

    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const resetPasswordForEmail = async (email: string) => {
    const redirectTo = `${window.location.origin}/auth?mode=reset`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    return { error }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        signUp,
        signIn,
        resetPasswordForEmail,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
