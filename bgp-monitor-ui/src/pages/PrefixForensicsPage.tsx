// ============================================
// BGP Monitor - Prefix Forensics Page (UC-3)
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { useFilters } from '../context';
import { 
  GlobalFilterBar, 
  TimeRangeSelector, 
  AutoRefreshController, 
  RPKIBadge,
  Drawer,
  Spinner,
  EmptyState,
} from '../components/common';
import { getPrefixes, getPrefixDetail } from '../api';
import type { Prefix, PrefixDetail, RPKIStatus } from '../types';

export const PrefixForensicsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, onRefresh } = useFilters();
  const [prefixes, setPrefixes] = useState<Prefix[]>([]);
  const [selectedPrefix, setSelectedPrefix] = useState<PrefixDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPrefixes, setTotalPrefixes] = useState(0);
  const [rpkiFilter, setRpkiFilter] = useState<RPKIStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'churn' | 'flap' | 'update'>('churn');
  const pageSize = 50;

  const loadPrefixes = useCallback(async () => {
    setLoading(true);
    const response = await getPrefixes(filters, page, pageSize);
    if (response.data) {
      let filtered = response.data;
      
      // Apply RPKI filter
      if (rpkiFilter !== 'all') {
        filtered = filtered.filter(p => p.rpkiStatus === rpkiFilter);
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        if (sortBy === 'churn') return b.churnRate - a.churnRate;
        if (sortBy === 'flap') return b.flapCount - a.flapCount;
        return new Date(b.lastUpdateTime).getTime() - new Date(a.lastUpdateTime).getTime();
      });
      
      setPrefixes(filtered);
      setTotalPrefixes(response.total);
    }
    setLoading(false);
  }, [filters, page, rpkiFilter, sortBy]);

  useEffect(() => {
    loadPrefixes();
    return onRefresh(loadPrefixes);
  }, [loadPrefixes, onRefresh]);

  // Handle pre-selected prefix from URL
  useEffect(() => {
    const urlPrefix = searchParams.get('prefix');
    if (urlPrefix && !selectedPrefix) {
      loadPrefixDetail(urlPrefix);
    }
  }, [searchParams]);

  const loadPrefixDetail = async (prefix: string) => {
    setDrawerLoading(true);
    const response = await getPrefixDetail(prefix);
    if (response.success) {
      setSelectedPrefix(response.data);
      setSearchParams({ prefix });
    }
    setDrawerLoading(false);
  };

  const closeDrawer = () => {
    setSelectedPrefix(null);
    setSearchParams({});
  };

  const rpkiStatusColors: Record<RPKIStatus, string> = {
    valid: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
    invalid: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
    'not-found': 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400',
    unknown: 'text-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-gray-400',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prefix Forensics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Investigate prefix churn, RPKI validation status, and historical timeline
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

      {/* Secondary Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* RPKI Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">RPKI Status:</span>
          <div className="flex gap-1">
            {(['all', 'valid', 'invalid', 'not-found', 'unknown'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setRpkiFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  rpkiFilter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'churn' | 'flap' | 'update')}
            className="px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg"
          >
            <option value="churn">Highest Churn</option>
            <option value="flap">Highest Flap</option>
            <option value="update">Most Recent Update</option>
          </select>
        </div>
      </div>

      {/* Prefix Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : prefixes.length === 0 ? (
          <EmptyState
            title="No prefixes found"
            description="Try adjusting your filters or time range"
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Prefix</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Origin ASN</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">RPKI</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Churn Rate</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Flaps</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Announcements</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Withdrawals</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Last Update</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {prefixes.map((prefix) => (
                    <tr
                      key={prefix.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer"
                      onClick={() => loadPrefixDetail(prefix.prefix)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium text-gray-900 dark:text-white">
                          {prefix.prefix}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        AS{prefix.originAsn}
                      </td>
                      <td className="px-4 py-3">
                        <RPKIBadge status={prefix.rpkiStatus} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {prefix.churnRate.toFixed(1)}/hr
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {prefix.flapCount}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-green-600">{prefix.announcements}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-red-600">{prefix.withdrawals}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {new Date(prefix.lastUpdateTime).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {prefix.anomalyTags.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-xs rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
                            >
                              {tag}
                            </span>
                          ))}
                          {prefix.anomalyTags.length > 2 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500">
                              +{prefix.anomalyTags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalPrefixes)} of {totalPrefixes} prefixes
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * pageSize >= totalPrefixes}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Prefix Detail Drawer */}
      <Drawer
        isOpen={!!selectedPrefix || drawerLoading}
        onClose={closeDrawer}
        title="Prefix Details"
        width="lg"
      >
        {drawerLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : selectedPrefix && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-mono font-bold text-gray-900 dark:text-white">
                  {selectedPrefix.prefix}
                </h3>
                <p className="text-sm text-gray-500">Origin AS{selectedPrefix.originAsn}</p>
              </div>
              <RPKIBadge status={selectedPrefix.rpkiStatus} size="lg" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedPrefix.churnRate.toFixed(1)}</div>
                <div className="text-xs text-gray-500">Churn/hr</div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-600">{selectedPrefix.announcements}</div>
                <div className="text-xs text-gray-500">Announcements</div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-red-600">{selectedPrefix.withdrawals}</div>
                <div className="text-xs text-gray-500">Withdrawals</div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedPrefix.flapCount}</div>
                <div className="text-xs text-gray-500">Flaps</div>
              </div>
            </div>

            {/* Churn Chart */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Churn Over Time</h4>
              <Line
                data={{
                  labels: selectedPrefix.sparklineData.map((_, i) => `${i}m`),
                  datasets: [{
                    label: 'Updates',
                    data: selectedPrefix.sparklineData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                }}
                height={120}
              />
            </div>

            {/* AS Paths */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Current AS Paths</h4>
              <div className="space-y-2">
                {selectedPrefix.paths.map((path) => (
                  <div
                    key={path.id}
                    className={`p-3 rounded-lg border ${
                      path.isCurrentBest
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : 'border-gray-200 bg-gray-50 dark:border-slate-600 dark:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {path.isCurrentBest && (
                        <span className="text-xs px-2 py-0.5 bg-green-500 text-white rounded-full">Best</span>
                      )}
                      <span className="font-mono text-sm text-gray-900 dark:text-white">
                        {path.path.map(asn => `AS${asn}`).join(' → ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Next Hop: {path.nextHop}</span>
                      {path.localPref && <span>LocalPref: {path.localPref}</span>}
                      {path.med && <span>MED: {path.med}</span>}
                    </div>
                    {path.communities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {path.communities.map((c, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* VRPs */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">ROA/VRP Data</h4>
              {selectedPrefix.vrps.length > 0 ? (
                <div className="space-y-2">
                  {selectedPrefix.vrps.map((vrp, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                      <div>
                        <span className="font-mono text-sm">AS{vrp.asn}</span>
                        <span className="text-gray-400 mx-2">|</span>
                        <span className="text-gray-600 dark:text-gray-300">{vrp.prefix}</span>
                        <span className="text-gray-400 mx-2">max /{vrp.maxLength}</span>
                      </div>
                      <span className="text-xs text-gray-500">{vrp.trustAnchor}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No ROAs found for this prefix</p>
              )}
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Recent Events</h4>
              <div className="relative max-h-64 overflow-y-auto">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-slate-600" />
                <div className="space-y-3">
                  {selectedPrefix.timeline.map((event) => {
                    const eventColors: Record<string, string> = {
                      announcement: 'bg-green-500',
                      withdrawal: 'bg-red-500',
                      path_change: 'bg-blue-500',
                      attribute_change: 'bg-yellow-500',
                    };
                    return (
                      <div key={event.id} className="relative pl-10">
                        <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${eventColors[event.eventType] || 'bg-gray-500'}`} />
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium capitalize dark:text-white">
                              {event.eventType.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{event.details}</p>
                          <p className="text-xs text-gray-400 mt-1">Peer: {event.peer}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default PrefixForensicsPage;
