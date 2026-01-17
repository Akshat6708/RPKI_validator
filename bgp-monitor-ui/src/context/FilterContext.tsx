// ============================================
// BGP Monitor - Global Filter Context
// ============================================

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { GlobalFilters, TimeRange, TimeRangePreset, RefreshInterval, IPVersion } from '../types';

interface FilterContextType {
  filters: GlobalFilters;
  refreshInterval: RefreshInterval;
  isAutoRefreshEnabled: boolean;
  lastRefreshTime: Date | null;
  
  setTimeRange: (preset: TimeRangePreset) => void;
  setTenant: (tenant: string | undefined) => void;
  setRegion: (region: string | undefined) => void;
  setPeerAsn: (asn: number | undefined) => void;
  setPrefix: (prefix: string | undefined) => void;
  setIpVersion: (version: IPVersion) => void;
  setRefreshInterval: (interval: RefreshInterval) => void;
  toggleAutoRefresh: () => void;
  triggerRefresh: () => void;
  resetFilters: () => void;
  
  // Subscribe to refresh events
  onRefresh: (callback: () => void) => () => void;
}

const FilterContext = createContext<FilterContextType | null>(null);

const STORAGE_KEY = 'bgp_monitor_filters';

// Calculate time range from preset
const calculateTimeRange = (preset: TimeRangePreset): TimeRange => {
  const now = new Date();
  const start = new Date(now);
  
  const presetMinutes: Record<TimeRangePreset, number> = {
    '10m': 10,
    '15m': 15,
    '1h': 60,
    '3h': 180,
    '12h': 720,
    '24h': 1440,
    '7d': 10080,
    '14d': 20160,
    '30d': 43200,
  };
  
  start.setMinutes(start.getMinutes() - presetMinutes[preset]);
  
  return { preset, start, end: now };
};

// Convert refresh interval string to milliseconds
const intervalToMs = (interval: RefreshInterval): number => {
  const mapping: Record<RefreshInterval, number> = {
    '15s': 15000,
    '30s': 30000,
    '45s': 45000,
    '1m': 60000,
    '2m': 120000,
    '5m': 300000,
  };
  return mapping[interval];
};

const defaultFilters: GlobalFilters = {
  timeRange: calculateTimeRange('1h'),
  ipVersion: 'Both',
};

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<GlobalFilters>(defaultFilters);
  const [refreshInterval, setRefreshIntervalState] = useState<RefreshInterval>('30s');
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  
  const refreshCallbacks = useRef<Set<() => void>>(new Set());
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved filters from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFilters({
          ...defaultFilters,
          ...parsed,
          timeRange: calculateTimeRange(parsed.timeRange?.preset || '1h'),
        });
        if (parsed.refreshInterval) {
          setRefreshIntervalState(parsed.refreshInterval);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...filters,
      timeRange: { preset: filters.timeRange.preset },
      refreshInterval,
    }));
  }, [filters, refreshInterval]);

  // Auto-refresh timer
  useEffect(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
    
    if (isAutoRefreshEnabled) {
      refreshTimerRef.current = setInterval(() => {
        triggerRefresh();
      }, intervalToMs(refreshInterval));
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [isAutoRefreshEnabled, refreshInterval]);

  const triggerRefresh = useCallback(() => {
    setLastRefreshTime(new Date());
    // Update time range end to now
    setFilters((f) => ({
      ...f,
      timeRange: calculateTimeRange(f.timeRange.preset),
    }));
    // Notify all subscribers
    refreshCallbacks.current.forEach((cb) => cb());
  }, []);

  const setTimeRange = useCallback((preset: TimeRangePreset) => {
    setFilters((f) => ({ ...f, timeRange: calculateTimeRange(preset) }));
  }, []);

  const setTenant = useCallback((tenant: string | undefined) => {
    setFilters((f) => ({ ...f, tenant }));
  }, []);

  const setRegion = useCallback((region: string | undefined) => {
    setFilters((f) => ({ ...f, region }));
  }, []);

  const setPeerAsn = useCallback((peerAsn: number | undefined) => {
    setFilters((f) => ({ ...f, peerAsn }));
  }, []);

  const setPrefix = useCallback((prefix: string | undefined) => {
    setFilters((f) => ({ ...f, prefix }));
  }, []);

  const setIpVersion = useCallback((ipVersion: IPVersion) => {
    setFilters((f) => ({ ...f, ipVersion }));
  }, []);

  const setRefreshInterval = useCallback((interval: RefreshInterval) => {
    setRefreshIntervalState(interval);
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled((e) => !e);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const onRefresh = useCallback((callback: () => void): (() => void) => {
    refreshCallbacks.current.add(callback);
    return () => {
      refreshCallbacks.current.delete(callback);
    };
  }, []);

  return (
    <FilterContext.Provider
      value={{
        filters,
        refreshInterval,
        isAutoRefreshEnabled,
        lastRefreshTime,
        setTimeRange,
        setTenant,
        setRegion,
        setPeerAsn,
        setPrefix,
        setIpVersion,
        setRefreshInterval,
        toggleAutoRefresh,
        triggerRefresh,
        resetFilters,
        onRefresh,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
