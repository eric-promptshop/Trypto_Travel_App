import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Environment configuration
const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT || 'staging'

// Get environment-specific URLs and keys
const getSupabaseConfig = () => {
  if (ENVIRONMENT === 'production') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_PRODUCTION!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY_PRODUCTION!,
    }
  } else {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_STAGING!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY_STAGING!,
    }
  }
}

const config = getSupabaseConfig()

// Create a Supabase client for client-side usage
export const supabase = createBrowserClient(
  config.url,
  config.anonKey
)

// Create a Supabase admin client for server-side usage
export const supabaseAdmin = createClient(
  config.url,
  config.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper to get the current environment
export const getCurrentEnvironment = () => ENVIRONMENT

// Helper to check if we're in production
export const isProduction = () => ENVIRONMENT === 'production'

// Helper to get environment-specific configuration
export const getEnvironmentConfig = () => ({
  environment: ENVIRONMENT,
  supabaseUrl: config.url,
  isProduction: isProduction(),
})