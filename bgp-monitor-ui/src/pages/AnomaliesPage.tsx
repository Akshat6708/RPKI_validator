// ============================================
// BGP Monitor - Active Anomalies Page (UC-6)
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useFilters } from '../context';
import {
  GlobalFilterBar,
  TimeRangeSelector,
  AutoRefreshController,
  SeverityBadge,
  Drawer,
  Spinner,
  EmptyState,
} from '../components/common';
import { getAnomalies, submitAnomalyFeedback } from '../api';
import type { Anomaly, AnomalyType, Severity, AnalystFeedback } from '../types';

export const AnomaliesPage: React.FC = () => {
  const { filters, onRefresh } = useFilters();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [page, setPage] = useState(1);
  const [totalAnomalies, setTotalAnomalies] = useState(0);
  const [typeFilter, setTypeFilter] = useState<AnomalyType | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [resolvedFilter, setResolvedFilter] = useState<'all' | 'active' | 'resolved'>('active');
  const pageSize = 20;

  const loadAnomalies = useCallback(async () => {
    setLoading(true);
    const response = await getAnomalies(filters, page, pageSize);
    if (response.data) {
      let filtered = response.data;
      
      // Apply type filter
      if (typeFilter !== 'all') {
        filtered = filtered.filter(a => a.anomalyType === typeFilter);
      }
      
      // Apply severity filter
      if (severityFilter !== 'all') {
        filtered = filtered.filter(a => a.severity === severityFilter);
      }
      
      // Apply resolved filter
      if (resolvedFilter === 'active') {
        filtered = filtered.filter(a => !a.isResolved);
      } else if (resolvedFilter === 'resolved') {
        filtered = filtered.filter(a => a.isResolved);
      }
      
      setAnomalies(filtered);
      setTotalAnomalies(response.total);
    }
    setLoading(false);
  }, [filters, page, typeFilter, severityFilter, resolvedFilter]);

  useEffect(() => {
    loadAnomalies();
    return onRefresh(loadAnomalies);
  }, [loadAnomalies, onRefresh]);

  const handleFeedback = async (anomalyId: string, feedback: AnalystFeedback) => {
    await submitAnomalyFeedback(anomalyId, feedback);
    // Update local state
    setAnomalies(prev => prev.map(a => 
      a.id === anomalyId ? { ...a, feedback, isResolved: feedback !== 'Confirmed Threat' } : a
    ));
    setSelectedAnomaly(null);
  };

  const anomalyTypes: AnomalyType[] = ['Hijack', 'Leak', 'Flap', 'PathChange', 'PrependAnomaly', 'RPKIInvalid'];
  const severities: Severity[] = ['Critical', 'High', 'Elevated', 'Info'];

  const severityCounts = {
    Critical: anomalies.filter(a => a.severity === 'Critical').length,
    High: anomalies.filter(a => a.severity === 'High').length,
    Elevated: anomalies.filter(a => a.severity === 'Elevated').length,
    Info: anomalies.filter(a => a.severity === 'Info').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Active Anomalies</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitor and investigate detected BGP anomalies with root cause analysis
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

      {/* Severity Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400">Critical</p>
              <p className="text-3xl font-bold text-red-700 dark:text-red-300">{severityCounts.Critical}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400">High</p>
              <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{severityCounts.High}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Elevated</p>
              <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{severityCounts.Elevated}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Info</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{severityCounts.Info}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as AnomalyType | 'all')}
            className="px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg"
          >
            <option value="all">All Types</option>
            {anomalyTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Severity:</span>
          <div className="flex gap-1">
            {(['all', ...severities] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev as Severity | 'all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  severityFilter === sev
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {sev === 'all' ? 'All' : sev}
              </button>
            ))}
          </div>
        </div>

        {/* Resolved Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
          <div className="flex gap-1">
            {(['all', 'active', 'resolved'] as const).map(status => (
              <button
                key={status}
                onClick={() => setResolvedFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  resolvedFilter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Anomalies Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : anomalies.length === 0 ? (
          <EmptyState
            title="No anomalies found"
            description="No anomalies match your current filters"
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Event ID</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Timestamp</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Severity</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Affected Prefix</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">ASN</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Confidence</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {anomalies.map((anomaly) => (
                    <tr
                      key={anomaly.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer"
                      onClick={() => setSelectedAnomaly(anomaly)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">
                        {anomaly.eventId.slice(0, 12)}...
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {new Date(anomaly.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                          {anomaly.anomalyType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={anomaly.severity} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">
                        {anomaly.affectedPrefix}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        AS{anomaly.affectedAsn}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                anomaly.confidence >= 80 ? 'bg-red-500' :
                                anomaly.confidence >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${anomaly.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{anomaly.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          anomaly.isResolved
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {anomaly.isResolved ? 'Resolved' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {anomaly.feedback || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalAnomalies)} of {totalAnomalies}
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
                  disabled={page * pageSize >= totalAnomalies}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Anomaly Detail Drawer with RCA */}
      <Drawer
        isOpen={!!selectedAnomaly}
        onClose={() => setSelectedAnomaly(null)}
        title="Anomaly Investigation"
        width="lg"
      >
        {selectedAnomaly && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <SeverityBadge severity={selectedAnomaly.severity} size="lg" />
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-slate-700">
                    {selectedAnomaly.anomalyType}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedAnomaly.description}
                </h3>
              </div>
              <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${
                selectedAnomaly.isResolved
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {selectedAnomaly.isResolved ? 'Resolved' : 'Active'}
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Event ID</p>
                <p className="font-mono text-sm">{selectedAnomaly.eventId}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Timestamp</p>
                <p className="text-sm">{new Date(selectedAnomaly.timestamp).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Affected Prefix</p>
                <p className="font-mono text-sm">{selectedAnomaly.affectedPrefix}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Affected ASN</p>
                <p className="text-sm">AS{selectedAnomaly.affectedAsn}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Confidence Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        selectedAnomaly.confidence >= 80 ? 'bg-red-500' :
                        selectedAnomaly.confidence >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${selectedAnomaly.confidence}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{selectedAnomaly.confidence}%</span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Current Feedback</p>
                <p className="text-sm">{selectedAnomaly.feedback || 'No feedback yet'}</p>
              </div>
            </div>

            {/* RCA Timeline */}
            {selectedAnomaly.rcaTimeline && selectedAnomaly.rcaTimeline.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                  Root Cause Analysis Timeline
                </h4>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-slate-600" />
                  <div className="space-y-4">
                    {selectedAnomaly.rcaTimeline.map((event, idx) => (
                      <div key={event.id} className="relative pl-12">
                        <div className="absolute left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-slate-800" />
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 dark:text-white">{event.eventType}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                          {event.relatedEntities.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {event.relatedEntities.map((entity, i) => (
                                <span
                                  key={i}
                                  className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                                >
                                  {entity}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Analyst Feedback */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                Submit Analyst Feedback
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {(['Confirmed Threat', 'False Positive', 'Known Issue', 'Whitelist'] as AnalystFeedback[]).map((feedback) => (
                  <button
                    key={feedback}
                    onClick={() => handleFeedback(selectedAnomaly.id, feedback)}
                    className={`px-4 py-3 text-sm font-medium rounded-lg border transition-colors ${
                      selectedAnomaly.feedback === feedback
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {selectedAnomaly.feedback === feedback && '✓ '}
                    {feedback}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AnomaliesPage;
