import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// Using direct values as fallback when environment variables are not available
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kzdjqqinkonqlclbwleh.supabase.co'
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZGpxcWlua29ucWxjbGJ3bGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTQ0ODcsImV4cCI6MjA4NTgzMDQ4N30.CrgPY7OI6eSoEe9CNDlK0apob1UG8KH5v21GI2UQS6I'

// Supabase is always configured now with fallback values
export const isSupabaseConfigured = true

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
