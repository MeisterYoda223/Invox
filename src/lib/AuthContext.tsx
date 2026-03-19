import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

const EDGE_FUNCTION_URL = 'https://glbwsibmhpcrnybtdups.supabase.co/functions/v1/create-company-on-signup';

interface UserProfile {
  id: string;
  company_id: string | null;
  name: string;
  email: string;
  role: 'admin' | 'user';
  is_active: boolean;
}

interface Company {
  id: string;
  company_name: string;
  owner: string;
  license_type: string;
  license_status: string;
  max_users: number;
  license_valid_until?: string;
  [key: string]: any;
}

interface Invitation {
  id: string;
  company_id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  expires_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  company: Company | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, companyName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  checkInvitation: (email: string) => Promise<Invitation | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const checkInvitation = async (email: string): Promise<Invitation | null> => {
    try {
      const { data, error } = await supabase
        .from('employee_invitations')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking invitation:', error);
      return null;
    }
  };

  // Lädt Profil + Company mit explizitem Access Token via REST
  const loadUserProfile = async (userId: string, accessToken: string): Promise<void> => {
    try {
      const SUPABASE_URL = 'https://glbwsibmhpcrnybtdups.supabase.co';

      const profileRes = await fetch(
        `${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${userId}&select=*&limit=1`,
        {
          headers: {
            'apikey': (supabase as any).supabaseKey ?? '',
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const profiles = await profileRes.json();
      const profile = profiles?.[0] ?? null;

      if (!profile) {
        console.warn('Kein Profil gefunden für User:', userId, '- logge aus');
        await supabase.auth.signOut();
        return;
      }

      setUserProfile(profile);

      if (profile.company_id) {
        const companyRes = await fetch(
          `${SUPABASE_URL}/rest/v1/companies?id=eq.${profile.company_id}&select=*&limit=1`,
          {
            headers: {
              'apikey': (supabase as any).supabaseKey ?? '',
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const companies = await companyRes.json();
        if (companies?.[0]) setCompany(companies[0]);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  useEffect(() => {
    let lastHandledUserId = '';

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AUTH EVENT:', event, session?.user?.id ?? 'null');

        if (session?.user && (
          event === 'INITIAL_SESSION' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'SIGNED_IN'
        )) {
          setSession(session);
          setUser(session.user);
          // Verhindert Doppelaufruf wenn SIGNED_IN + INITIAL_SESSION zusammen feuern
          if (lastHandledUserId !== session.user.id || event === 'TOKEN_REFRESHED') {
            lastHandledUserId = session.user.id;
            await loadUserProfile(session.user.id, session.access_token);
          }
        } else if (event === 'SIGNED_OUT') {
          lastHandledUserId = '';
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setCompany(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) return { error };

      if (data.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!profile) {
          await supabase.auth.signOut();
          return {
            error: {
              message: 'Ihr Account ist noch nicht eingerichtet. Bitte kontaktieren Sie Ihren Administrator.',
            },
          };
        }

        if (!profile.is_active) {
          await supabase.auth.signOut();
          return {
            error: { message: 'Ihr Account wurde deaktiviert. Bitte kontaktieren Sie Ihren Administrator.' },
          };
        }
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string, companyName?: string) => {
    try {
      const invitation = await checkInvitation(email);

      if (!invitation && (!companyName || companyName.trim() === '')) {
        return { error: { message: 'Bitte geben Sie einen Firmennamen ein.' } };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, companyName },
        },
      });

      if (error) return { error };
      if (!data.user) return { error: { message: 'User konnte nicht erstellt werden.' } };

      const accessToken = data.session?.access_token;

      if (!accessToken) {
        return { error: { message: 'Kein Token erhalten. Bitte E-Mail bestätigen und neu anmelden.' } };
      }

      // Edge Function mit Retry für Free Plan Cold Starts
      const callEdgeFunction = async (attempt: number): Promise<{ ok: boolean; errorMsg?: string }> => {
        try {
          const response = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ user: data.user }),
          });

          if (response.ok) return { ok: true };

          const errData = await response.json().catch(() => ({}));
          console.error(`Edge Function Fehler (Versuch ${attempt}):`, errData);
          return { ok: false, errorMsg: errData.error };
        } catch (err) {
          console.error(`Edge Function Exception (Versuch ${attempt}):`, err);
          return { ok: false };
        }
      };

      let result = await callEdgeFunction(1);
      if (!result.ok) {
        await new Promise(r => setTimeout(r, 2000));
        result = await callEdgeFunction(2);
      }
      if (!result.ok) {
        await new Promise(r => setTimeout(r, 2000));
        result = await callEdgeFunction(3);
      }

      if (!result.ok) {
        return { error: { message: result.errorMsg || 'Profil konnte nicht erstellt werden.' } };
      }

      // Profil direkt laden nach erfolgreicher Edge Function
      await loadUserProfile(data.user.id, accessToken);

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUserProfile(null);
      setCompany(null);
    }
    return { error };
  };

  const refreshProfile = async () => {
    if (user && session) {
      await loadUserProfile(user.id, session.access_token);
    }
  };

  const value = {
    session,
    user,
    userProfile,
    company,
    loading,
    isAdmin: userProfile?.role === 'admin',
    signIn,
    signUp,
    signOut,
    refreshProfile,
    checkInvitation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}