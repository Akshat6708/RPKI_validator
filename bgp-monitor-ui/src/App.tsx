// ============================================
// BGP Monitor - Main Application Router
// ============================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ThemeProvider, FilterProvider, DashboardProvider, useAuth } from './context';
import { MainLayout } from './components/layout';
import {
  LoginPage,
  DashboardPage,
  PeerHealthPage,
  PrefixForensicsPage,
  PathTrackingPage,
  AnomaliesPage,
  AdvancedAnalyticsPage,
  HistoricalPlaybackPage,
  SettingsPage,
} from './pages';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route (redirects to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// App Router Component
const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes with MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <FilterProvider>
              <DashboardProvider>
                <MainLayout />
              </DashboardProvider>
            </FilterProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="peer-health" element={<PeerHealthPage />} />
        <Route path="prefix-forensics" element={<PrefixForensicsPage />} />
        <Route path="path-tracking" element={<PathTrackingPage />} />
        <Route path="anomalies" element={<AnomaliesPage />} />
        <Route path="analytics" element={<AdvancedAnalyticsPage />} />
        <Route path="playback" element={<HistoricalPlaybackPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
