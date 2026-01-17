// ============================================
// BGP Monitor - Time Range Selector Component
// ============================================

import React from 'react';
import clsx from 'clsx';
import type { TimeRangePreset } from '../../types';
import { useFilters } from '../../context';

const presets: { value: TimeRangePreset; label: string }[] = [
  { value: '10m', label: '10m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '3h', label: '3h' },
  { value: '12h', label: '12h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '14d', label: '14d' },
  { value: '30d', label: '30d' },
];

interface TimeRangeSelectorProps {
  compact?: boolean;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ compact = false }) => {
  const { filters, setTimeRange } = useFilters();
  const currentPreset = filters.timeRange.preset;

  if (compact) {
    return (
      <select
        value={currentPreset}
        onChange={(e) => setTimeRange(e.target.value as TimeRangePreset)}
        className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 
                   rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 
                   focus:border-transparent dark:text-white"
      >
        {presets.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
      {presets.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setTimeRange(value)}
          className={clsx(
            'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
            currentPreset === value
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
