// ============================================
// BGP Monitor - Dashboard Layout Context
// ============================================

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { UserRole } from '../types';
import type { WidgetConfig, WidgetId, DashboardLayout } from '../types';
import { useAuth } from './AuthContext';

interface DashboardContextType {
  layout: DashboardLayout;
  isCustomizing: boolean;
  toggleWidget: (widgetId: WidgetId) => void;
  reorderWidgets: (activeId: WidgetId, overId: WidgetId) => void;
  startCustomizing: () => void;
  stopCustomizing: () => void;
  resetLayout: () => void;
  isWidgetVisible: (widgetId: WidgetId) => boolean;
  canCustomize: boolean;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

const STORAGE_KEY = 'bgp_monitor_dashboard_layout';

const defaultWidgets: WidgetConfig[] = [
  { id: 'peerHealth', title: 'Peer Health', visible: true, order: 0, minRole: UserRole.Viewer },
  { id: 'churnSummary', title: 'Churn Summary', visible: true, order: 1, minRole: UserRole.Viewer },
  { id: 'activeAnomalies', title: 'Active Anomalies', visible: true, order: 2, minRole: UserRole.Viewer },
  { id: 'routeFlapRate', title: 'Route Flap Rate', visible: true, order: 3, minRole: UserRole.Viewer },
  { id: 'messageVolume', title: 'Message Volume Trend', visible: true, order: 4, minRole: UserRole.NetworkEngineer },
  { id: 'rpkiValidation', title: 'RPKI Validation Summary', visible: true, order: 5, minRole: UserRole.Viewer },
];

const defaultLayout: DashboardLayout = {
  widgets: defaultWidgets,
  lastModified: new Date().toISOString(),
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { canEdit } = useAuth();
  const [layout, setLayout] = useState<DashboardLayout>(defaultLayout);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Load layout from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as DashboardLayout;
        // Merge with defaults to handle new widgets added in updates
        const mergedWidgets = defaultWidgets.map((defaultWidget) => {
          const saved = parsed.widgets.find((w) => w.id === defaultWidget.id);
          return saved ? { ...defaultWidget, ...saved } : defaultWidget;
        });
        setLayout({ ...parsed, widgets: mergedWidgets });
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save layout to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  const toggleWidget = useCallback((widgetId: WidgetId) => {
    setLayout((l) => ({
      ...l,
      lastModified: new Date().toISOString(),
      widgets: l.widgets.map((w) =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      ),
    }));
  }, []);

  const reorderWidgets = useCallback((activeId: WidgetId, overId: WidgetId) => {
    setLayout((l) => {
      const activeIndex = l.widgets.findIndex((w) => w.id === activeId);
      const overIndex = l.widgets.findIndex((w) => w.id === overId);
      
      if (activeIndex === -1 || overIndex === -1) return l;
      
      const newWidgets = [...l.widgets];
      const [removed] = newWidgets.splice(activeIndex, 1);
      newWidgets.splice(overIndex, 0, removed);
      
      // Update order values
      const reordered = newWidgets.map((w, i) => ({ ...w, order: i }));
      
      return {
        ...l,
        lastModified: new Date().toISOString(),
        widgets: reordered,
      };
    });
  }, []);

  const startCustomizing = useCallback(() => {
    if (canEdit()) {
      setIsCustomizing(true);
    }
  }, [canEdit]);

  const stopCustomizing = useCallback(() => {
    setIsCustomizing(false);
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(defaultLayout);
  }, []);

  const isWidgetVisible = useCallback((widgetId: WidgetId): boolean => {
    const widget = layout.widgets.find((w) => w.id === widgetId);
    return widget?.visible ?? false;
  }, [layout.widgets]);

  return (
    <DashboardContext.Provider
      value={{
        layout,
        isCustomizing,
        toggleWidget,
        reorderWidgets,
        startCustomizing,
        stopCustomizing,
        resetLayout,
        isWidgetVisible,
        canCustomize: canEdit(),
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
