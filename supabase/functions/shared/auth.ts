/**
 * Authentication & Authorization Helpers
 */

import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export interface AuthUser {
  id: string;
  email: string;
  company_id: string;
  role: 'admin' | 'user';
  is_active: boolean;
}

/**
 * Extrahiert Access Token aus Authorization Header
 */
export function getAccessToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Authentifiziert User und lädt Profil
 */
export async function authenticateUser(
  supabase: SupabaseClient,
  accessToken: string | null
): Promise<AuthUser | null> {
  if (!accessToken) {
    return null;
  }

  try {
    // Verifiziere Token und hole User
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return null;
    }

    // Lade User Profile mit Company-Info
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, company_id, role, is_active, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      company_id: profile.company_id,
      role: profile.role,
      is_active: profile.is_active,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Prüft ob User Admin ist
 */
export function isAdmin(user: AuthUser): boolean {
  return user.role === 'admin';
}

/**
 * Prüft ob User aktiv ist
 */
export function isActive(user: AuthUser): boolean {
  return user.is_active;
}

/**
 * Erstellt Supabase Client mit Service Role
 */
export function createServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

/**
 * Erstellt Supabase Client mit User Access Token
 */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
}
