import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, confirmPassword?: string, role?: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state from storage on app boot
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const session = await authService.getStoredSession();
        if (session.token && session.user) {
          setToken(session.token);
          setUser(session.user);
          
          // Verify with server in background to ensure account is not blocked
          try {
            const freshUser = await authService.getCurrentUser();
            setUser(freshUser);
          } catch (err: any) {
            if (err.code === 'ACCOUNT_BLOCKED' || err.code === 'TOKEN_EXPIRED' || err.status === 401 || err.status === 403) {
              await authService.logout();
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.error('[Auth Init Error]:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword?: string,
    role: string = 'student'
  ): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.register(name, email, password, confirmPassword, role);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const freshUser = await authService.getCurrentUser();
      setUser(freshUser);
    } catch (err) {
      console.error('[Auth Refresh Error]:', err);
    }
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAdmin,
        isStudent,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
