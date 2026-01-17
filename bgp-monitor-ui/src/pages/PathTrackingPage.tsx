// ============================================
// BGP Monitor - BGP Path Tracking Page (UC-5)
// ============================================

import React, { useState, useCallback, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { useFilters } from '../context';
import {
  GlobalFilterBar,
  TimeRangeSelector,
  AutoRefreshController,
  Spinner,
  EmptyState,
} from '../components/common';
import { getPathComparison } from '../api';
import type { PathComparison } from '../types';

export const PathTrackingPage: React.FC = () => {
  const { filters, onRefresh } = useFilters();
  const [prefixInput, setPrefixInput] = useState('');
  const [searchedPrefix, setSearchedPrefix] = useState('');
  const [comparison, setComparison] = useState<PathComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'diff' | 'timeline'>('diff');

  const loadComparison = useCallback(async () => {
    if (!searchedPrefix) return;
    setLoading(true);
    const response = await getPathComparison(searchedPrefix, filters);
    if (response.success) {
      setComparison(response.data);
    }
    setLoading(false);
  }, [searchedPrefix, filters]);

  useEffect(() => {
    if (searchedPrefix) {
      loadComparison();
      return onRefresh(loadComparison);
    }
  }, [loadComparison, onRefresh, searchedPrefix]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (prefixInput.trim()) {
      setSearchedPrefix(prefixInput.trim());
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'insertion': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'removal': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'reorder': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'attribute_change': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-slate-700/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">BGP Path Tracking</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Compare AS paths before and after changes, track path evolution over time
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <TimeRangeSelector />
          <div className="h-6 w-px bg-gray-200 dark:bg-slate-700" />
          <GlobalFilterBar />
          <div className="flex-1" />
          <AutoRefreshController />
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <form onSubmit={handleSearch} className="flex items-end gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prefix to Track
            </label>
            <input
              type="text"
              value={prefixInput}
              onChange={(e) => setPrefixInput(e.target.value)}
              placeholder="e.g., 192.168.0.0/16 or 2001:db8::/32"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            Track Path
          </button>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12">
          <div className="flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        </div>
      ) : comparison ? (
        <div className="space-y-6">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('diff')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'diff'
                    ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Diff View
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Timeline View
              </button>
            </div>
            
            {/* Stability Score */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-500">Path Stability:</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      comparison.stabilityScore >= 80 ? 'bg-green-500' :
                      comparison.stabilityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${comparison.stabilityScore}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{comparison.stabilityScore}%</span>
              </div>
            </div>
          </div>

          {/* Diff View */}
          {viewMode === 'diff' && (
            <div className="grid grid-cols-2 gap-6">
              {/* Before */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  Before
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    {new Date(comparison.beforePath.timestamp).toLocaleString()}
                  </span>
                </h3>
                
                {/* AS Path Visualization */}
                <div className="mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {comparison.beforePath.path.map((asn, idx) => (
                      <React.Fragment key={idx}>
                        <div className={`px-3 py-1.5 rounded-lg font-mono text-sm ${
                          comparison.changes.some(c => c.changeType === 'removal' && c.oldValue === asn)
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 line-through'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white'
                        }`}>
                          AS{asn}
                        </div>
                        {idx < comparison.beforePath.path.length - 1 && (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Attributes */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Next Hop:</span>
                    <span className="font-mono">{comparison.beforePath.nextHop}</span>
                  </div>
                  {comparison.beforePath.localPref && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">LocalPref:</span>
                      <span>{comparison.beforePath.localPref}</span>
                    </div>
                  )}
                  {comparison.beforePath.med && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">MED:</span>
                      <span>{comparison.beforePath.med}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* After */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  After
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    {new Date(comparison.afterPath.timestamp).toLocaleString()}
                  </span>
                </h3>
                
                {/* AS Path Visualization */}
                <div className="mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {comparison.afterPath.path.map((asn, idx) => (
                      <React.Fragment key={idx}>
                        <div className={`px-3 py-1.5 rounded-lg font-mono text-sm ${
                          comparison.changes.some(c => c.changeType === 'insertion' && c.newValue === asn)
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white'
                        }`}>
                          AS{asn}
                        </div>
                        {idx < comparison.afterPath.path.length - 1 && (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Attributes */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Next Hop:</span>
                    <span className={`font-mono ${
                      comparison.beforePath.nextHop !== comparison.afterPath.nextHop
                        ? 'text-blue-600 dark:text-blue-400'
                        : ''
                    }`}>
                      {comparison.afterPath.nextHop}
                    </span>
                  </div>
                  {comparison.afterPath.localPref && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">LocalPref:</span>
                      <span className={
                        comparison.beforePath.localPref !== comparison.afterPath.localPref
                          ? 'text-blue-600 dark:text-blue-400'
                          : ''
                      }>
                        {comparison.afterPath.localPref}
                      </span>
                    </div>
                  )}
                  {comparison.afterPath.med && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">MED:</span>
                      <span className={
                        comparison.beforePath.med !== comparison.afterPath.med
                          ? 'text-blue-600 dark:text-blue-400'
                          : ''
                      }>
                        {comparison.afterPath.med}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timeline View */}
          {viewMode === 'timeline' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Path Changes Timeline</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-slate-600" />
                <div className="space-y-4">
                  {comparison.changes.map((change, idx) => (
                    <div key={idx} className="relative pl-12">
                      <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${
                        change.changeType === 'insertion' ? 'bg-green-500' :
                        change.changeType === 'removal' ? 'bg-red-500' :
                        change.changeType === 'reorder' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div className={`p-4 rounded-lg ${getChangeColor(change.changeType)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">{change.changeType.replace('_', ' ')}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(change.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm">
                          {change.changeType === 'insertion' && (
                            <span>Added AS{change.newValue} at position {change.position}</span>
                          )}
                          {change.changeType === 'removal' && (
                            <span>Removed AS{change.oldValue} from position {change.position}</span>
                          )}
                          {change.changeType === 'reorder' && (
                            <span>Path reordered from position {change.position}</span>
                          )}
                          {change.changeType === 'attribute_change' && (
                            <span>
                              {change.attribute} changed from {change.oldValue} to {change.newValue}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Changes Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Changes Summary</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {comparison.changes.filter(c => c.changeType === 'insertion').length}
                </div>
                <div className="text-sm text-gray-500">Insertions</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {comparison.changes.filter(c => c.changeType === 'removal').length}
                </div>
                <div className="text-sm text-gray-500">Removals</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {comparison.changes.filter(c => c.changeType === 'reorder').length}
                </div>
                <div className="text-sm text-gray-500">Reorders</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {comparison.changes.filter(c => c.changeType === 'attribute_change').length}
                </div>
                <div className="text-sm text-gray-500">Attr Changes</div>
              </div>
            </div>
          </div>
        </div>
      ) : searchedPrefix ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12">
          <EmptyState
            title="No path data found"
            description={`No path comparison data available for ${searchedPrefix}`}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12">
          <EmptyState
            title="Enter a prefix to track"
            description="Enter a prefix above to view AS path changes and comparisons"
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            }
          />
        </div>
      )}
    </div>
  );
};

export default PathTrackingPage;
