import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

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

  const createCompanyAndProfile = async (userId: string, userEmail: string, userName: string, companyName: string) => {
    try {
      // Erstelle neue Company
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          company_name: companyName,
          owner: userName,
          license_type: 'starter',
          license_status: 'active', // Keine Trial - direkt aktiv
          max_users: 3,
          next_quote_number: 'ANG-2026-001',
          next_invoice_number: 'RE-2026-001',
          payment_terms: 14,
          default_vat_rate: 19,
          quote_footer: 'Wir freuen uns auf Ihre Auftragserteilung.',
          invoice_footer: 'Vielen Dank für Ihren Auftrag.',
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Erstelle User-Profil als Admin
      const { data: newProfile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          company_id: newCompany.id,
          name: userName,
          email: userEmail,
          role: 'admin',
          is_active: true,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      console.log('Company und Admin-Profil erfolgreich erstellt');
      setUserProfile(newProfile);
      setCompany(newCompany);
    } catch (error) {
      console.error('Error creating company and profile:', error);
      throw error;
    }
  };

  const loadUserProfile = async (userId: string, userEmail: string) => {
    try {
      // Versuche Profil zu laden
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Profil existiert bereits
      if (profile) {
        setUserProfile(profile);

        // Lade Company wenn vorhanden
        if (profile.company_id) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profile.company_id)
            .single();

          if (companyData) {
            setCompany(companyData);
          }
        }
        return;
      }

      // Kein Profil gefunden - prüfe ob Einladung existiert
      console.log('Neuer Benutzer - prüfe auf Einladung');
      const invitation = await checkInvitation(userEmail);

      if (invitation) {
        // Mitarbeiter mit Einladung
        console.log('Einladung gefunden - erstelle Mitarbeiter-Profil');
        
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const userName = authUser?.user_metadata?.name || userEmail.split('@')[0];

        const { data: newProfile, error: newProfileError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            company_id: invitation.company_id,
            name: userName,
            email: userEmail,
            role: invitation.role,
            is_active: true,
          })
          .select()
          .single();

        if (newProfileError) throw newProfileError;

        // Markiere Einladung als akzeptiert
        await supabase
          .from('employee_invitations')
          .update({ 
            status: 'accepted',
            accepted_at: new Date().toISOString()
          })
          .eq('id', invitation.id);

        setUserProfile(newProfile);

        // Lade Company
        if (newProfile.company_id) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', newProfile.company_id)
            .single();
          
          if (companyData) setCompany(companyData);
        }
      } else {
        // Neuer Admin ohne Einladung - Company sollte bereits bei SignUp erstellt worden sein
        // Falls nicht, erstelle sie jetzt
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const userName = authUser?.user_metadata?.name || userEmail.split('@')[0];
        const companyName = authUser?.user_metadata?.companyName || `${userName} Handwerk`;
        
        await createCompanyAndProfile(userId, userEmail, userName, companyName);
      }
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) return { error };

      // Prüfe ob User lizenziert ist
      if (data.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!profile) {
          // Kein Profil - prüfe Einladung
          const invitation = await checkInvitation(email);
          if (!invitation) {
            await supabase.auth.signOut();
            return { 
              error: { 
                message: 'Ihr Account ist noch nicht lizenziert. Bitte kontaktieren Sie Ihren Administrator oder registrieren Sie sich als neues Unternehmen.' 
              } 
            };
          }
        } else if (!profile.is_active) {
          await supabase.auth.signOut();
          return { 
            error: { message: 'Ihr Account wurde deaktiviert. Bitte kontaktieren Sie Ihren Administrator.' } 
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

      // Wenn Einladung vorhanden - nur Auth-User erstellen
      if (invitation) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });

        if (error) return { error };
        // Profil wird automatisch in loadUserProfile erstellt
        return { error: null };
      }

      // Keine Einladung - erstelle neues Unternehmen
      if (!companyName || companyName.trim() === '') {
        return { error: { message: 'Bitte geben Sie einen Firmennamen ein.' } };
      }

      // Erstelle Auth-User
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, companyName },
        },
      });

      if (error) return { error };

      // Company und Profil werden automatisch in loadUserProfile erstellt
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
