// ============================================
// BGP Monitor - Auto Refresh Controller Component
// ============================================

import React from 'react';
import clsx from 'clsx';
import { useFilters } from '../../context';
import type { RefreshInterval } from '../../types';

const RefreshIcon = ({ spinning }: { spinning?: boolean }) => (
  <svg 
    className={clsx('w-4 h-4', spinning && 'animate-spin')} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const intervals: { value: RefreshInterval; label: string }[] = [
  { value: '15s', label: '15s' },
  { value: '30s', label: '30s' },
  { value: '45s', label: '45s' },
  { value: '1m', label: '1m' },
  { value: '2m', label: '2m' },
  { value: '5m', label: '5m' },
];

interface AutoRefreshControllerProps {
  compact?: boolean;
}

export const AutoRefreshController: React.FC<AutoRefreshControllerProps> = ({ compact = false }) => {
  const {
    refreshInterval,
    isAutoRefreshEnabled,
    lastRefreshTime,
    setRefreshInterval,
    toggleAutoRefresh,
    triggerRefresh,
  } = useFilters();

  const formatLastRefresh = () => {
    if (!lastRefreshTime) return 'Never';
    const diff = Math.round((Date.now() - lastRefreshTime.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.round(diff / 60)}m ago`;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={triggerRefresh}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          title="Refresh now"
        >
          <RefreshIcon />
        </button>
        <button
          onClick={toggleAutoRefresh}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            isAutoRefreshEnabled
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'
          )}
        >
          {isAutoRefreshEnabled ? 'Auto' : 'Paused'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2">
      {/* Manual Refresh Button */}
      <button
        onClick={triggerRefresh}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 
                   text-white rounded-md text-sm font-medium transition-colors"
      >
        <RefreshIcon />
        Refresh
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 dark:bg-slate-600" />

      {/* Auto-refresh Toggle */}
      <button
        onClick={toggleAutoRefresh}
        className={clsx(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          isAutoRefreshEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'
        )}
      >
        <span
          className={clsx(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            isAutoRefreshEnabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
      <span className="text-sm text-gray-600 dark:text-gray-400">Auto</span>

      {/* Interval Selector */}
      {isAutoRefreshEnabled && (
        <>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(e.target.value as RefreshInterval)}
            className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 
                       rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 
                       focus:border-transparent dark:text-white"
          >
            {intervals.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Last Refresh Indicator */}
      <div className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
        Updated: {formatLastRefresh()}
      </div>
    </div>
  );
};
