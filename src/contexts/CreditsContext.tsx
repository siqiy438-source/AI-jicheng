import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface CreditsContextType {
  balance: number | null
  loading: boolean
  refreshBalance: () => Promise<void>
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined)

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshBalance = useCallback(async () => {
    if (!user) {
      setBalance(null)
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()
    setBalance(data?.credits ?? null)
    setLoading(false)
  }, [user])

  useEffect(() => {
    refreshBalance()

    if (!user) return

    const channel = supabase
      .channel(`profiles:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newCredits = (payload.new as { credits?: number })?.credits
          if (newCredits !== undefined) {
            setBalance(newCredits)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, refreshBalance])

  return (
    <CreditsContext.Provider value={{ balance, loading, refreshBalance }}>
      {children}
    </CreditsContext.Provider>
  )
}

export function useCredits() {
  const context = useContext(CreditsContext)
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider')
  }
  return context
}
