import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiService } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<any>;
  verifyEmail: (email: string, code: string) => Promise<any>;
  resendVerification: (email: string) => Promise<any>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = apiService.getUser();
      if (storedUser && apiService.isAuthenticated()) {
        try {
          const currentUser = await apiService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Failed to fetch current user:', error);
          await apiService.logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      setUser(response.user);
      return response;
    } catch (error) {
      // Ensure user state is cleared on login failure
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    return await apiService.signup(email, password, name);
  };

  const verifyEmail = async (email: string, code: string) => {
    return await apiService.verifyEmail(email, code);
  };

  const resendVerification = async (email: string) => {
    return await apiService.resendVerification(email);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    signup,
    verifyEmail,
    resendVerification,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
