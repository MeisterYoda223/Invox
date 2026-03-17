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
 
  // Lädt Profil + Company — mit Retry falls Webhook noch nicht fertig ist
  const loadUserProfile = async (userId: string, userEmail: string, retries = 5): Promise<void> => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
 
      if (error) {
        console.error('Error loading profile:', error.message);
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1000));
          return loadUserProfile(userId, userEmail, retries - 1);
        }
        return;
      }
 
      if (profile) {
        setUserProfile(profile);
        if (profile.company_id) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profile.company_id)
            .single();
          if (companyData) setCompany(companyData);
        }
        return;
      }
 
      // Profil noch nicht vorhanden — retry (Edge Function läuft noch)
      if (retries > 0) {
        console.log(`Warte auf Profil... (${retries} Versuche übrig)`);
        await new Promise(r => setTimeout(r, 1500));
        return loadUserProfile(userId, userEmail, retries - 1);
      }
 
      console.error('Profil konnte nach allen Versuchen nicht geladen werden.');
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };
 
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
 
        if (session?.user) {
          await loadUserProfile(session.user.id, session.user.email!);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };
 
    initializeAuth();
 
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
 
        if (session?.user) {
          await loadUserProfile(session.user.id, session.user.email!);
        } else {
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
      // Prüfe auf Einladung
      const invitation = await checkInvitation(email);
 
      if (!invitation && (!companyName || companyName.trim() === '')) {
        return { error: { message: 'Bitte geben Sie einen Firmennamen ein.' } };
      }
 
      // 1. Auth-User erstellen
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, companyName },
        },
      });
 
      if (error) return { error };
      if (!data.user) return { error: { message: 'User konnte nicht erstellt werden.' } };
 
      // 2. Edge Function aufrufen — erstellt Company + Profil mit Service Role
      const { data: { session: currentSession } } = await supabase.auth.getSession();
 
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession?.access_token ?? ''}`,
        },
        body: JSON.stringify({ user: data.user }),
      });
 
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('Edge Function Fehler:', errData);
        return { error: { message: errData.error || 'Profil konnte nicht erstellt werden.' } };
      }
 
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
    if (user) {
      await loadUserProfile(user.id, user.email!);
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
 