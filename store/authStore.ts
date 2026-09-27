"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  UserProfile,
  signupApi,
  loginApi,
  fetchCurrentUserApi,
} from "@/lib/authApi";

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Modal UI state
  isAuthModalOpen: boolean;
  authModalTab: "login" | "signup";

  // Actions
  openAuthModal: (tab?: "login" | "signup") => void;
  closeAuthModal: () => void;
  setAuthModalTab: (tab: "login" | "signup") => void;
  clearError: () => void;

  signup: (email: string, password: string, fullName?: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  verifySession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      isAuthModalOpen: false,
      authModalTab: "login",

      openAuthModal: (tab = "login") =>
        set({ isAuthModalOpen: true, authModalTab: tab, error: null }),

      closeAuthModal: () => set({ isAuthModalOpen: false, error: null }),

      setAuthModalTab: (tab) => set({ authModalTab: tab, error: null }),

      clearError: () => set({ error: null }),

      signup: async (email, password, fullName) => {
        set({ isLoading: true, error: null });
        try {
          const data = await signupApi(email, password, fullName);
          set({
            user: data.user,
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false,
            isAuthModalOpen: false,
            error: null,
          });
          return true;
        } catch (err: any) {
          set({
            error: err.message || "Failed to sign up",
            isLoading: false,
          });
          return false;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await loginApi(email, password);
          set({
            user: data.user,
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false,
            isAuthModalOpen: false,
            error: null,
          });
          return true;
        } catch (err: any) {
          set({
            error: err.message || "Failed to log in",
            isLoading: false,
          });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      verifySession: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const user = await fetchCurrentUserApi(token);
          set({ user, isAuthenticated: true });
        } catch {
          // Token expired or invalid
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: "otter_auth_storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
