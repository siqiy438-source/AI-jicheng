import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Create a mock client for when Supabase is not configured
const createMockClient = (): SupabaseClient => {
  const mockResponse = { data: null, error: { message: 'Supabase not configured' } }
  const mockAuth = {
    getSession: async () => mockResponse,
    getUser: async () => mockResponse,
    signInWithPassword: async () => mockResponse,
    signUp: async () => mockResponse,
    signOut: async () => mockResponse,
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  }

  return {
    auth: mockAuth,
    from: () => ({
      select: () => Promise.resolve(mockResponse),
      insert: () => Promise.resolve(mockResponse),
      update: () => Promise.resolve(mockResponse),
      delete: () => Promise.resolve(mockResponse),
    }),
  } as unknown as SupabaseClient
}

// Export the real client if configured, otherwise export mock
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createMockClient()

if (!isSupabaseConfigured) {
  console.warn('Supabase environment variables not configured. Authentication features will be disabled.')
}
