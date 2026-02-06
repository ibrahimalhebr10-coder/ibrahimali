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
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
})

if (typeof window !== 'undefined') {
  let refreshAttempts = 0
  const maxRefreshAttempts = 3

  const handleSessionRefresh = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('❌ [SessionKeepAlive] Session check error:', error)

        if (refreshAttempts < maxRefreshAttempts) {
          refreshAttempts++
          console.log(`🔄 [SessionKeepAlive] Retry ${refreshAttempts}/${maxRefreshAttempts}`)
          setTimeout(handleSessionRefresh, 5000)
        }
        return
      }

      if (session) {
        refreshAttempts = 0

        const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
        const now = Date.now()
        const timeUntilExpiry = expiresAt - now

        if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
          console.log('🔄 [SessionKeepAlive] Session expiring soon, refreshing...')

          const { error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError) {
            console.error('❌ [SessionKeepAlive] Refresh failed:', refreshError)
          } else {
            console.log('✅ [SessionKeepAlive] Session refreshed successfully')
          }
        }
      }
    } catch (error) {
      console.error('❌ [SessionKeepAlive] Unexpected error:', error)
    }
  }

  setInterval(handleSessionRefresh, 4 * 60 * 1000)

  setTimeout(handleSessionRefresh, 1000)
}

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
