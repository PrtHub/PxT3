import { User } from 'next-auth';
import { create } from 'zustand';

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  clearAuth: () => void;
};

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  clearAuth: () => set({ user: null, isAuthenticated: false }),
}));

export default useAuthStore;