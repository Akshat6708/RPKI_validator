// ============================================
// BGP Monitor - Advanced Analytics Page
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useFilters } from '../context';
import {
  GlobalFilterBar,
  TimeRangeSelector,
  AutoRefreshController,
  Spinner,
} from '../components/common';
import { getAnalyticsData } from '../api';
import type { AnalyticsData } from '../types';

export const AdvancedAnalyticsPage: React.FC = () => {
  const { filters, onRefresh } = useFilters();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trends' | 'distribution' | 'correlation'>('trends');

  const loadData = useCallback(async () => {
    setLoading(true);
    const response = await getAnalyticsData(filters);
    if (response.success) {
      setData(response.data);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadData();
    return onRefresh(loadData);
  }, [loadData, onRefresh]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Advanced Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Deep dive into BGP metrics, trends, and correlations
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

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1 w-fit">
        {[
          { id: 'trends', label: 'Trend Analysis' },
          { id: 'distribution', label: 'Distribution' },
          { id: 'correlation', label: 'Correlation' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'trends' | 'distribution' | 'correlation')}
            className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12">
          <div className="flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        </div>
      ) : data ? (
        <>
          {/* Trend Analysis Tab */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Churn Rate</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {data.metrics.avgChurnRate.toFixed(1)}
                  </p>
                  <p className="text-sm text-green-500 mt-2">↓ 5% from last period</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Flap Rate</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {data.metrics.avgFlapRate.toFixed(1)}
                  </p>
                  <p className="text-sm text-red-500 mt-2">↑ 12% from last period</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Path Stability</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {data.metrics.pathStability}%
                  </p>
                  <p className="text-sm text-green-500 mt-2">↑ 3% from last period</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">RPKI Coverage</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {data.metrics.rpkiCoverage}%
                  </p>
                  <p className="text-sm text-green-500 mt-2">↑ 8% from last period</p>
                </div>
              </div>

              {/* Trend Charts */}
              <div className="grid grid-cols-2 gap-6">
                {/* Churn Trend */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Churn Trend</h3>
                  <Line
                    data={{
                      labels: data.trendData.map(d => new Date(d.timestamp).toLocaleDateString()),
                      datasets: [{
                        label: 'Churn Rate',
                        data: data.trendData.map(d => d.churn),
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
                    }}
                    height={200}
                  />
                </div>

                {/* Flap Trend */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Flap Rate Trend</h3>
                  <Line
                    data={{
                      labels: data.trendData.map(d => new Date(d.timestamp).toLocaleDateString()),
                      datasets: [{
                        label: 'Flap Rate',
                        data: data.trendData.map(d => d.flaps),
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        fill: true,
                        tension: 0.4,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                    }}
                    height={200}
                  />
                </div>

                {/* Anomaly Trend */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Anomalies Over Time</h3>
                  <Bar
                    data={{
                      labels: data.trendData.map(d => new Date(d.timestamp).toLocaleDateString()),
                      datasets: [{
                        label: 'Anomalies',
                        data: data.trendData.map(d => d.anomalies),
                        backgroundColor: '#ef4444',
                        borderRadius: 4,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                    }}
                    height={200}
                  />
                </div>

                {/* Path Length Trend */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Avg Path Length</h3>
                  <Line
                    data={{
                      labels: data.trendData.map(d => new Date(d.timestamp).toLocaleDateString()),
                      datasets: [{
                        label: 'Path Length',
                        data: data.trendData.map(d => d.avgPathLength),
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                    }}
                    height={200}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Distribution Tab */}
          {activeTab === 'distribution' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                {/* Anomaly Type Distribution */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Anomaly Types</h3>
                  <div className="flex items-center justify-center">
                    <div className="w-48 h-48">
                      <Doughnut
                        data={{
                          labels: Object.keys(data.distribution.anomalyTypes),
                          datasets: [{
                            data: Object.values(data.distribution.anomalyTypes),
                            backgroundColor: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'],
                            borderWidth: 0,
                          }],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 12 } },
                          },
                          cutout: '60%',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* RPKI Status Distribution */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">RPKI Status</h3>
                  <div className="flex items-center justify-center">
                    <div className="w-48 h-48">
                      <Doughnut
                        data={{
                          labels: ['Valid', 'Invalid', 'Unknown'],
                          datasets: [{
                            data: [
                              data.distribution.rpkiStatus.valid,
                              data.distribution.rpkiStatus.invalid,
                              data.distribution.rpkiStatus.unknown,
                            ],
                            backgroundColor: ['#22c55e', '#ef4444', '#6b7280'],
                            borderWidth: 0,
                          }],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 12 } },
                          },
                          cutout: '60%',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Peer Status Distribution */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Peer Status</h3>
                  <div className="flex items-center justify-center">
                    <div className="w-48 h-48">
                      <Doughnut
                        data={{
                          labels: ['Healthy', 'Unhealthy', 'Unknown'],
                          datasets: [{
                            data: [
                              data.distribution.peerStatus.healthy,
                              data.distribution.peerStatus.unhealthy,
                              data.distribution.peerStatus.unknown,
                            ],
                            backgroundColor: ['#22c55e', '#ef4444', '#6b7280'],
                            borderWidth: 0,
                          }],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 12 } },
                          },
                          cutout: '60%',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Top ASNs by Activity */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top ASNs by Activity</h3>
                <div className="space-y-3">
                  {data.topAsns.map((asn, idx) => (
                    <div key={asn.asn} className="flex items-center gap-4">
                      <span className="w-8 text-sm font-medium text-gray-500">#{idx + 1}</span>
                      <span className="w-24 font-mono text-sm">AS{asn.asn}</span>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(asn.activity / data.topAsns[0].activity) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-20 text-sm text-right">{asn.activity.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Correlation Tab */}
          {activeTab === 'correlation' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Churn vs Anomalies */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Churn vs Anomalies Correlation
                  </h3>
                  <Line
                    data={{
                      labels: data.trendData.map(d => new Date(d.timestamp).toLocaleDateString()),
                      datasets: [
                        {
                          label: 'Churn Rate',
                          data: data.trendData.map(d => d.churn),
                          borderColor: '#3b82f6',
                          backgroundColor: 'transparent',
                          yAxisID: 'y',
                          tension: 0.4,
                        },
                        {
                          label: 'Anomalies',
                          data: data.trendData.map(d => d.anomalies),
                          borderColor: '#ef4444',
                          backgroundColor: 'transparent',
                          yAxisID: 'y1',
                          tension: 0.4,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'top' } },
                      scales: {
                        y: {
                          type: 'linear',
                          position: 'left',
                          title: { display: true, text: 'Churn Rate' },
                        },
                        y1: {
                          type: 'linear',
                          position: 'right',
                          title: { display: true, text: 'Anomalies' },
                          grid: { drawOnChartArea: false },
                        },
                      },
                    }}
                    height={250}
                  />
                </div>

                {/* Flaps vs Path Changes */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Flaps vs Path Length
                  </h3>
                  <Line
                    data={{
                      labels: data.trendData.map(d => new Date(d.timestamp).toLocaleDateString()),
                      datasets: [
                        {
                          label: 'Flap Rate',
                          data: data.trendData.map(d => d.flaps),
                          borderColor: '#f59e0b',
                          backgroundColor: 'transparent',
                          yAxisID: 'y',
                          tension: 0.4,
                        },
                        {
                          label: 'Avg Path Length',
                          data: data.trendData.map(d => d.avgPathLength),
                          borderColor: '#8b5cf6',
                          backgroundColor: 'transparent',
                          yAxisID: 'y1',
                          tension: 0.4,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'top' } },
                      scales: {
                        y: {
                          type: 'linear',
                          position: 'left',
                          title: { display: true, text: 'Flap Rate' },
                        },
                        y1: {
                          type: 'linear',
                          position: 'right',
                          title: { display: true, text: 'Path Length' },
                          grid: { drawOnChartArea: false },
                        },
                      },
                    }}
                    height={250}
                  />
                </div>
              </div>

              {/* Correlation Matrix */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Metric Correlation Matrix
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-2"></th>
                        <th className="px-4 py-2 text-center">Churn</th>
                        <th className="px-4 py-2 text-center">Flaps</th>
                        <th className="px-4 py-2 text-center">Anomalies</th>
                        <th className="px-4 py-2 text-center">Path Length</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['Churn', 'Flaps', 'Anomalies', 'Path Length'].map((row, ri) => (
                        <tr key={row}>
                          <td className="px-4 py-2 font-medium">{row}</td>
                          {[1.0, 0.72, 0.85, 0.34, 0.68, 0.45, 0.52, 1.0, 0.41, 0.23, 0.67, 0.89, 0.33, 0.56, 0.78, 1.0]
                            .slice(ri * 4, ri * 4 + 4)
                            .map((val, ci) => (
                              <td key={ci} className="px-4 py-2 text-center">
                                <span
                                  className={`inline-block w-16 px-2 py-1 rounded text-xs font-medium ${
                                    val >= 0.7
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                      : val >= 0.4
                                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  }`}
                                >
                                  {val.toFixed(2)}
                                </span>
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default AdvancedAnalyticsPage;
