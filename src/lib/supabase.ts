import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'farm-investment-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'farm-investment-platform'
    }
  },
  db: {
    schema: 'public'
  }
})

let isInitialized = false
let initPromise: Promise<void> | null = null

export async function initializeSupabase(): Promise<void> {
  if (isInitialized) return
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      await supabase.auth.getSession()
      isInitialized = true
    } catch (error) {
      console.warn('Supabase initialization warning:', error)
      isInitialized = true
    }
  })()

  return initPromise
}

export type SupabaseClient = typeof supabase
