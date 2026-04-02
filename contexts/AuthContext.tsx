import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

export type Role = 'organizer' | 'worker';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  companyName?: string;
  organizerType?: string;
  avatarUrl?: string;
  age?: number;
  experienceYears?: number;
  gender?: string;
  aadhaarDocUrl?: string;
  workerPhotoUrls?: string[];
  skills?: string;
  bio?: string;
  hourlyRate?: number;
}

interface AuthContextType {
  isLoggedIn: boolean;
  role: Role | null;
  isOnboarded: boolean;
  user: User | null;
  isLoading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setRole: (role: Role) => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRoleState] = useState<Role | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const storedToken = await api.getToken();
      if (storedToken) {
        const result = await api.getMe();
        if (result.data?.user) {
          setUser(result.data.user);
          setIsLoggedIn(true);
          setRoleState(result.data.user.role);
          setIsOnboarded(result.data.user.isOnboarded);
          setToken(storedToken);
        } else {
          // Invalid token, clear it
          api.logout();
        }
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await api.login(email, password);
    if (result.data) {
      setUser(result.data.user);
      setIsLoggedIn(true);
      setRoleState(result.data.user.role);
      setIsOnboarded(result.data.user.isOnboarded);
      setToken(result.data.token);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const register = async (email: string, password: string, name: string) => {
    const result = await api.register(email, password, name);
    if (result.data) {
      await api.setToken(result.data.token);
      setUser(result.data.user);
      setIsLoggedIn(true);
      setRoleState(null);
      setIsOnboarded(false);
      setToken(result.data.token);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const logout = () => {
    api.logout();
    setIsLoggedIn(false);
    setRoleState(null);
    setIsOnboarded(false);
    setUser(null);
    setToken(null);
  };

  const setRole = async (newRole: Role) => {
    const result = await api.setRole(newRole);
    if (result.data) {
      setRoleState(newRole);
      setToken(result.data.token);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const completeOnboarding = async (userData: Partial<User>) => {
    const result = await api.completeOnboarding(userData);
    if (result.data) {
      setUser(prev => prev ? { ...prev, ...userData } : null);
      setIsOnboarded(true);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        role,
        isOnboarded,
        user,
        isLoading,
        token,
        login,
        register,
        logout,
        setRole,
        completeOnboarding,
      }}
    >
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

export default AuthContext;
