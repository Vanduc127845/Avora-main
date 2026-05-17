import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '../lib/shared';
import { supabase, onAuthStateChange } from '../services/supabase';

interface AuthState {
  user: Partial<UserProfile> | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: Partial<UserProfile> | null) => void;
  setToken: (token: string | null) => void;
  login: (user: Partial<UserProfile>, token: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setLoading: (loading: boolean) => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      setUser: (user) =>
        set(() => ({
          user,
          isAuthenticated: !!user,
        })),
      
      setToken: (token) =>
        set(() => ({
          token,
        })),
      
      login: (user, token) =>
        set(() => ({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        })),
      
      logout: async () => {
        if (supabase) {
          await supabase.auth.signOut();
        }
        set(() => ({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        }));
      },
      
      updateProfile: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } as Partial<UserProfile> : null,
        })),
      
      setLoading: (loading) =>
        set(() => ({
          isLoading: loading,
        })),
      
      initAuth: async () => {
        try {
          set({ isLoading: true });
          
          if (!supabase) {
            set({ isLoading: false });
            return;
          }
          
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            const supabaseUser = session.user;
            const userProfile: Partial<UserProfile> = {
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '',
              avatar: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || '',
              provider: (supabaseUser.app_metadata?.provider || 'email') as string,
              createdAt: supabaseUser.created_at as unknown as Date,
              updatedAt: supabaseUser.updated_at as unknown as Date,
            };
            
            set({
              user: userProfile,
              token: session.access_token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Restore from persisted state
            const state = get();
            set({ 
              isLoading: false,
              isAuthenticated: !!state.user,
            });
          }
          
          onAuthStateChange((user) => {
            if (user) {
              const userProfile: Partial<UserProfile> = {
                id: (user as { id: string }).id,
                email: (user as { email?: string }).email || '',
                name: ((user as { user_metadata?: { name?: string; full_name?: string } }).user_metadata?.full_name 
                  || (user as { user_metadata?: { name?: string } }).user_metadata?.name) || '',
                avatar: ((user as { user_metadata?: { avatar_url?: string; picture?: string } }).user_metadata?.avatar_url 
                  || (user as { user_metadata?: { picture?: string } }).user_metadata?.picture) || '',
                provider: (user as { app_metadata?: { provider?: string } }).app_metadata?.provider || 'email',
                createdAt: (user as { created_at: string }).created_at as unknown as Date,
                updatedAt: (user as { updated_at: string }).updated_at as unknown as Date,
              };
              set({ user: userProfile, isAuthenticated: true });
            } else {
              const state = get();
              if (state.token && state.user) {
                set({ isAuthenticated: true });
                return;
              }

              set({ user: null, token: null, isAuthenticated: false });
            }
          });
        } catch (error) {
          console.error('Auth init error:', error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'ai4a-auth',
      partialize: (state) => ({ 
        token: state.token,
        user: state.user,
        isAuthenticated: !!state.user,
      }),
    }
  )
);
