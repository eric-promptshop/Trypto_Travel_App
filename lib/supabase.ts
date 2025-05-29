import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Server-side Supabase client for API routes
export const createServerSupabaseClient = async () => {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Admin client for server-side operations (requires service role key)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Utility function to get user with tenant context
export async function getUserWithTenant(userId: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured')
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      *,
      tenant:tenants(*)
    `)
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

// Utility function to create tenant-aware storage bucket
export async function createTenantStorageBucket(tenantId: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured')
  }

  const bucketName = `tenant-${tenantId}`
  
  // Create bucket
  const { data: bucket, error: bucketError } = await supabaseAdmin
    .storage
    .createBucket(bucketName, {
      public: false,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: [
        'image/*',
        'application/pdf',
        'text/*',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    })

  if (bucketError && bucketError.message !== 'Bucket already exists') {
    throw bucketError
  }

  return bucket
}

// Utility function to set up RLS policies for a tenant
export async function setupTenantRLSPolicies(tenantId: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured')
  }

  const policies = [
    // Users policy - users can only access their own tenant data
    `
    CREATE POLICY "tenant_users_policy_${tenantId}" ON public.users
    FOR ALL USING (tenant_id = '${tenantId}' AND auth.uid()::text = id);
    `,
    
    // Trips policy - users can only access trips in their tenant
    `
    CREATE POLICY "tenant_trips_policy_${tenantId}" ON public.trips
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = trips.user_id 
        AND users.tenant_id = '${tenantId}'
        AND auth.uid()::text = users.id
      )
    );
    `,
    
    // Activities policy
    `
    CREATE POLICY "tenant_activities_policy_${tenantId}" ON public.activities
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.trips 
        JOIN public.users ON users.id = trips.user_id
        WHERE trips.id = activities.trip_id 
        AND users.tenant_id = '${tenantId}'
        AND auth.uid()::text = users.id
      )
    );
    `,
    
    // Tenant settings policy
    `
    CREATE POLICY "tenant_settings_policy_${tenantId}" ON public.tenant_settings
    FOR ALL USING (tenant_id = '${tenantId}');
    `
  ]

  for (const policy of policies) {
    try {
      await supabaseAdmin.rpc('exec_sql', { sql: policy })
    } catch (error) {
      console.warn(`Policy creation warning for tenant ${tenantId}:`, error)
      // Continue with other policies even if one fails
    }
  }
}

// Utility function for tenant-aware realtime subscriptions
export function createTenantRealtimeSubscription(
  table: string,
  tenantId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`tenant_${tenantId}_${table}`)
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table,
        filter: `tenant_id=eq.${tenantId}` 
      },
      callback
    )
    .subscribe()
}

// Type definitions for our Supabase schema
export interface SupabaseUser {
  id: string
  email: string
  name?: string
  role: 'ADMIN' | 'USER' | 'TRAVELER' | 'AGENT'
  tenant_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SupabaseTenant {
  id: string
  name: string
  slug: string
  description?: string
  domain?: string
  is_active: boolean
  settings?: Record<string, any>
  created_at: string
  updated_at: string
} 