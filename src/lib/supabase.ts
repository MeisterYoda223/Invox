import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);

// Auth Helper Functions
export const authHelpers = {
  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Sign up new user
  signUp: async (email: string, password: string, userData?: { name?: string; company?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    return { data, error };
  },

  // Sign in existing user
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },
};

// Database Helper Functions
export const dbHelpers = {
  // Get all items with optional prefix filter
  getAll: async (prefix?: string) => {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-e5b0fe50/data${prefix ? `?prefix=${prefix}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching data:', error);
      return { data: null, error };
    }
  },

  // Get single item by key
  get: async (key: string) => {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-e5b0fe50/data/${key}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching data:', error);
      return { data: null, error };
    }
  },

  // Set/Update item
  set: async (key: string, value: any) => {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-e5b0fe50/data/${key}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value }),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('Error setting data:', error);
      return { data: null, error };
    }
  },

  // Delete item
  delete: async (key: string) => {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-e5b0fe50/data/${key}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('Error deleting data:', error);
      return { data: null, error };
    }
  },
};
