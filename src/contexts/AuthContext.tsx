
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { userDataService } from '@/services/userDataService';
import { userStorage, clearAllUserMetrics } from '@/utils/userStorage';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Record<string, string>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsAuthenticated(!!newSession);
        setIsLoading(false);
      }
    );
    
    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsAuthenticated(!!currentSession);
      setIsLoading(false);
    });
    
    // Unsubscribe on cleanup
    return () => subscription.unsubscribe();
  }, []);
  
  const login = async (email: string, password: string): Promise<User> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (!data.user) {
        throw new Error('No user returned from login');
      }
      
      setUser(data.user);
      setSession(data.session);
      setIsAuthenticated(true);
      console.log('after login localStorage:', { ...localStorage });
      return data.user;
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const register = async (email: string, password: string, firstName?: string, lastName?: string): Promise<User> => {
    try {
      setIsLoading(true);
      
      // Prepare user metadata
      const metadata: Record<string, string> = {};
      if (firstName) metadata.first_name = firstName;
      if (lastName) metadata.last_name = lastName;
      if (firstName && lastName) metadata.full_name = `${firstName} ${lastName}`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: Object.keys(metadata).length > 0 ? metadata : undefined
        }
      });
      
      if (error) throw error;
      
      if (!data.user) {
        throw new Error('No user returned from registration');
      }
      
      setUser(data.user);
      setSession(data.session);
      setIsAuthenticated(!!data.session);
      
      return data.user;
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
  
      /** ------------------------------------------------------------------
       * 1)  Only clear truly global items
       *     (things *not* created with userStorage.k(uid, key))
       * ------------------------------------------------------------------ */
      localStorage.removeItem("canvas_credentials");
      localStorage.removeItem("anon:theme");  // example of a global key
      // …add any other non‑namespaced keys here
  
      /** ------------------------------------------------------------------
       * 2)  Sign the user out of Supabase
       * ------------------------------------------------------------------ */
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
  
      /** ------------------------------------------------------------------
       * 3)  DON’T touch the per‑user metrics!
       *     They live under <uid>:* keys and are harmless once the user
       *     is signed out – they’ll only ever be read again if the same
       *     UID logs back in.
       * ------------------------------------------------------------------ */
      // userStorage.clear(user?.id);          ❌  removed
      // clearAllUserMetrics(user?.id);        ❌  removed
  
      /** ------------------------------------------------------------------
       * 4)  Reset local auth state
       * ------------------------------------------------------------------ */
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
    } catch (err: any) {
      console.error("Logout error:", err);
      toast.error(err.message || "Failed to logout");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  
  const updateUserProfile = async (updates: Record<string, string>): Promise<void> => {
    try {
      if (!user) throw new Error('No user logged in');
      
      setIsLoading(true);
      
      // Update the user metadata in Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });
      
      if (error) throw error;
      
      // Update the local user state with the new metadata
      if (data && data.user) {
        setUser(data.user);
      }
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      toast.error(error.message || 'Failed to update profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const value = {
    user,
    session,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUserProfile
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
