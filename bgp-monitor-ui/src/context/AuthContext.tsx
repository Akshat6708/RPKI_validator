// ============================================
// BGP Monitor - Authentication Context
// ============================================

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { UserRole } from '../types';
import type { User, AuthState } from '../types';
import { loginUser as apiLogin, logoutUser as apiLogout } from '../api';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (requiredRole: UserRole) => boolean;
  canEdit: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'bgp_monitor_user';

// Role hierarchy: Admin > NetworkEngineer > Viewer
const roleHierarchy: Record<UserRole, number> = {
  [UserRole.Admin]: 3,
  [UserRole.NetworkEngineer]: 2,
  [UserRole.Viewer]: 1,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        setState({ user, isAuthenticated: true, isLoading: false });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setState((s) => ({ ...s, isLoading: false }));
      }
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setState((s) => ({ ...s, isLoading: true }));
    
    try {
      const response = await apiLogin(username, password);
      
      if (response.success && response.data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
        setState({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
      
      setState((s) => ({ ...s, isLoading: false }));
      return false;
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await apiLogout();
    localStorage.removeItem(STORAGE_KEY);
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const hasRole = useCallback((requiredRole: UserRole): boolean => {
    if (!state.user) return false;
    return roleHierarchy[state.user.role] >= roleHierarchy[requiredRole];
  }, [state.user]);

  const canEdit = useCallback((): boolean => {
    return hasRole(UserRole.NetworkEngineer);
  }, [hasRole]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasRole, canEdit }}>
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
