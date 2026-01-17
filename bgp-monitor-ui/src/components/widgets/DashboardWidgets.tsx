// ============================================
// BGP Monitor - Dashboard Widgets
// ============================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useFilters } from '../../context';
import { WidgetContainer, MiniSparkline, SeverityBadge, RPKIBadge, PeerStatusBadge, FlapStatusBadge, Drawer } from '../common';
import {
  getPeerHealth,
  getChurnSummary,
  getAnomalies,
  getFlapSummary,
  getMessageVolumeSummary,
  getRPKIValidationSummary,
} from '../../api';
import type {
  PeerHealth,
  Peer,
  ChurnSummary,
  Anomaly,
  FlapSummary,
  MessageVolumeSummary,
  RPKIValidationSummary,
} from '../../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// --- Custom map icons ---
const createPeerIcon = (status: 'healthy' | 'unhealthy' | 'unknown') => {
  const colors = {
    healthy: '#22c55e',
    unhealthy: '#dc2626',
    unknown: '#6b7280',
  };
  
  return L.divIcon({
    className: 'custom-peer-marker',
    html: `<div style="
      width: 12px;
      height: 12px;
      background: ${colors[status]};
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

// --- Map Bounds Component ---
const MapBounds: React.FC<{ peers: Peer[] }> = ({ peers }) => {
  const map = useMap();
  
  useEffect(() => {
    const validPeers = peers.filter(p => p.latitude && p.longitude);
    if (validPeers.length > 0) {
      const bounds = L.latLngBounds(
        validPeers.map(p => [p.latitude!, p.longitude!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [peers, map]);
  
  return null;
};

// ============================================
// PEER HEALTH WIDGET (UC-2)
// ============================================
export const PeerHealthWidget: React.FC = () => {
  const { filters, onRefresh } = useFilters();
  const [data, setData] = useState<PeerHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeer, setSelectedPeer] = useState<Peer | null>(null);
  const [showTable, setShowTable] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const response = await getPeerHealth(filters);
    if (response.success) {
      setData(response.data);
      // Check if map should show
      const peersWithCoords = response.data.peers.filter(p => p.latitude && p.longitude);
      if (peersWithCoords.length < response.data.peers.length * 0.3) {
        setShowTable(true);
      }
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadData();
    return onRefresh(loadData);
  }, [loadData, onRefresh]);

  const peersWithCoords = data?.peers.filter(p => p.latitude && p.longitude) ?? [];

  return (
    <WidgetContainer
      id="peerHealth"
      title="Peer Health"
      loading={loading}
      colSpan={2}
      headerAction={
        data && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-500 font-medium">
              {data.reachabilityPercentage}% Reachable
            </span>
            <button
              onClick={() => setShowTable(!showTable)}
              className="text-blue-500 hover:underline"
            >
              {showTable ? 'Show Map' : 'Show Table'}
            </button>
          </div>
        )
      }
    >
      {data && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.totalPeers}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Peers</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{data.healthyCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Healthy</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{data.unhealthyCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Unhealthy</div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{data.unknownCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Unknown</div>
            </div>
          </div>

          {/* Map or Table */}
          {showTable || peersWithCoords.length < 3 ? (
            <div>
              {peersWithCoords.length < 3 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4 text-sm text-yellow-800 dark:text-yellow-300">
                  Map hidden—insufficient coordinates.
                </div>
              )}
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Peer</th>
                      <th className="px-3 py-2 text-left">ASN</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Prefixes</th>
                      <th className="px-3 py-2 text-left">Churn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {data.peers.slice(0, 10).map((peer) => (
                      <tr
                        key={peer.id}
                        className="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer"
                        onClick={() => setSelectedPeer(peer)}
                      >
                        <td className="px-3 py-2 font-medium">{peer.name || peer.ip}</td>
                        <td className="px-3 py-2">AS{peer.asn}</td>
                        <td className="px-3 py-2"><PeerStatusBadge status={peer.status} /></td>
                        <td className="px-3 py-2">{peer.prefixCount.toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <MiniSparkline data={peer.sparklineData} color={peer.status === 'healthy' ? '#22c55e' : '#ef4444'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-64 rounded-lg overflow-hidden">
              <MapContainer
                center={[20, 0]}
                zoom={2}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <MapBounds peers={peersWithCoords} />
                {peersWithCoords.map((peer) => (
                  <Marker
                    key={peer.id}
                    position={[peer.latitude!, peer.longitude!]}
                    icon={createPeerIcon(peer.status)}
                    eventHandlers={{
                      click: () => setSelectedPeer(peer),
                    }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>{peer.name || peer.ip}</strong>
                        <br />
                        AS{peer.asn} - {peer.site}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </>
      )}

      {/* Peer Detail Drawer */}
      <Drawer
        isOpen={!!selectedPeer}
        onClose={() => setSelectedPeer(null)}
        title="Peer Details"
        width="md"
      >
        {selectedPeer && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedPeer.status === 'healthy' ? 'bg-green-100 text-green-600' :
                selectedPeer.status === 'unhealthy' ? 'bg-red-100 text-red-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                <span className="text-lg font-bold">{selectedPeer.name?.[0] || 'P'}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold dark:text-white">{selectedPeer.name || selectedPeer.ip}</h3>
                <p className="text-gray-500 dark:text-gray-400">AS{selectedPeer.asn}</p>
              </div>
              <PeerStatusBadge status={selectedPeer.status} size="md" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">IP Address</div>
                <div className="font-medium dark:text-white">{selectedPeer.ip}</div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">Site</div>
                <div className="font-medium dark:text-white">{selectedPeer.site || 'N/A'}</div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">Session State</div>
                <div className="font-medium dark:text-white">{selectedPeer.sessionState}</div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">Prefix Count</div>
                <div className="font-medium dark:text-white">{selectedPeer.prefixCount.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">Coordinates</div>
                <div className="font-medium dark:text-white">
                  {selectedPeer.latitude?.toFixed(2)}, {selectedPeer.longitude?.toFixed(2)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">Last Change</div>
                <div className="font-medium dark:text-white">
                  {new Date(selectedPeer.lastChangeTime).toLocaleString()}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Churn Rate (24h)</h4>
              <MiniSparkline
                data={selectedPeer.sparklineData}
                color={selectedPeer.status === 'healthy' ? '#22c55e' : '#ef4444'}
                width={300}
                height={60}
              />
            </div>
          </div>
        )}
      </Drawer>
    </WidgetContainer>
  );
};

// ============================================
// CHURN SUMMARY WIDGET (UC-3)
// ============================================
export const ChurnSummaryWidget: React.FC = () => {
  const navigate = useNavigate();
  const { filters, onRefresh } = useFilters();
  const [data, setData] = useState<ChurnSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [topN, setTopN] = useState<5 | 10 | 25 | 100>(5);

  const loadData = useCallback(async () => {
    setLoading(true);
    const response = await getChurnSummary(filters);
    if (response.success) {
      setData(response.data);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadData();
    return onRefresh(loadData);
  }, [loadData, onRefresh]);

  const chartData = useMemo(() => ({
    labels: data?.timeseriesData.map(d => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) ?? [],
    datasets: [
      {
        label: 'Announcements',
        data: data?.timeseriesData.map(d => d.announcements) ?? [],
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Withdrawals',
        data: data?.timeseriesData.map(d => d.withdrawals) ?? [],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }), [data]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0,
    },
    plugins: {
      legend: { position: 'top' as const },
    },
    scales: {
      y: { beginAtZero: true },
    },
  }), []);

  const severityColors = {
    Normal: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Elevated: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    Critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <WidgetContainer
      id="churnSummary"
      title="Churn Summary"
      loading={loading}
      colSpan={2}
      headerAction={
        data && (
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${severityColors[data.severityBand]}`}>
              {data.severityBand}
            </span>
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value) as 5 | 10 | 25 | 100)}
              className="text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md px-2 py-1"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={25}>Top 25</option>
              <option value={100}>Top 100</option>
            </select>
          </div>
        )
      }
    >
      {data && (
        <div className="grid grid-cols-3 gap-6">
          {/* Chart */}
          <div className="col-span-2" style={{ height: '200px', position: 'relative' }}>
            <Line
              data={chartData}
              options={chartOptions}
            />
          </div>

          {/* Top-N List */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Top Prefixes</h4>
              <div className="space-y-2">
                {data.topPrefixes.slice(0, topN).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
                    onClick={() => navigate(`/prefix-forensics?prefix=${item.name}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate dark:text-white">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.count} updates</div>
                    </div>
                    <MiniSparkline data={item.sparklineData} width={50} height={20} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
};

// ============================================
// ACTIVE ANOMALIES WIDGET (UC-6)
// ============================================
export const ActiveAnomaliesWidget: React.FC = () => {
  const { filters, onRefresh } = useFilters();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const response = await getAnomalies(filters, 1, 10);
    if (response.data) {
      setAnomalies(response.data);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadData();
    return onRefresh(loadData);
  }, [loadData, onRefresh]);

  const severityCounts = {
    Critical: anomalies.filter(a => a.severity === 'Critical').length,
    High: anomalies.filter(a => a.severity === 'High').length,
    Elevated: anomalies.filter(a => a.severity === 'Elevated').length,
    Info: anomalies.filter(a => a.severity === 'Info').length,
  };

  return (
    <WidgetContainer
      id="activeAnomalies"
      title="Active Anomalies"
      loading={loading}
      colSpan={2}
    >
      {/* Severity Heat Strip */}
      <div className="flex gap-1 mb-4 h-8">
        {severityCounts.Critical > 0 && (
          <div className="bg-red-500 rounded flex-1 flex items-center justify-center text-white text-xs font-medium">
            {severityCounts.Critical} Critical
          </div>
        )}
        {severityCounts.High > 0 && (
          <div className="bg-orange-500 rounded flex-1 flex items-center justify-center text-white text-xs font-medium">
            {severityCounts.High} High
          </div>
        )}
        {severityCounts.Elevated > 0 && (
          <div className="bg-yellow-500 rounded flex-1 flex items-center justify-center text-white text-xs font-medium">
            {severityCounts.Elevated} Elevated
          </div>
        )}
        {severityCounts.Info > 0 && (
          <div className="bg-blue-500 rounded flex-1 flex items-center justify-center text-white text-xs font-medium">
            {severityCounts.Info} Info
          </div>
        )}
      </div>

      {/* Anomaly Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th className="px-3 py-2 text-left">Event ID</th>
              <th className="px-3 py-2 text-left">Timestamp</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Severity</th>
              <th className="px-3 py-2 text-left">Affected</th>
              <th className="px-3 py-2 text-left">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {anomalies.map((anomaly) => (
              <tr
                key={anomaly.id}
                className="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer"
                onClick={() => setSelectedAnomaly(anomaly)}
              >
                <td className="px-3 py-2 font-mono text-xs">{anomaly.eventId.slice(0, 12)}...</td>
                <td className="px-3 py-2">{new Date(anomaly.timestamp).toLocaleTimeString()}</td>
                <td className="px-3 py-2">{anomaly.anomalyType}</td>
                <td className="px-3 py-2"><SeverityBadge severity={anomaly.severity} /></td>
                <td className="px-3 py-2">
                  <span className="font-mono text-xs">{anomaly.affectedPrefix}</span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${anomaly.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs">{anomaly.confidence}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RCA Timeline Drawer */}
      <Drawer
        isOpen={!!selectedAnomaly}
        onClose={() => setSelectedAnomaly(null)}
        title="Root Cause Analysis"
        width="lg"
      >
        {selectedAnomaly && (
          <div className="space-y-6">
            {/* Anomaly Summary */}
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <SeverityBadge severity={selectedAnomaly.severity} size="md" />
                <span className="text-sm text-gray-500">{selectedAnomaly.anomalyType}</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{selectedAnomaly.description}</p>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Affected Prefix:</span>
                  <span className="ml-2 font-mono">{selectedAnomaly.affectedPrefix}</span>
                </div>
                <div>
                  <span className="text-gray-500">Affected ASN:</span>
                  <span className="ml-2">AS{selectedAnomaly.affectedAsn}</span>
                </div>
              </div>
            </div>

            {/* RCA Timeline */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Event Timeline</h4>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-slate-600" />
                <div className="space-y-4">
                  {selectedAnomaly.rcaTimeline?.map((event, index) => (
                    <div key={event.id} className="relative pl-10">
                      <div className="absolute left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-slate-800" />
                      <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium dark:text-white">{event.eventType}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Analyst Feedback Buttons */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Analyst Feedback</h4>
              <div className="flex flex-wrap gap-2">
                {['Confirmed Threat', 'False Positive', 'Known Issue', 'Whitelist'].map((feedback) => (
                  <button
                    key={feedback}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => {
                      alert(`Feedback submitted: ${feedback}`);
                      setSelectedAnomaly(null);
                    }}
                  >
                    {feedback}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </WidgetContainer>
  );
};

// ============================================
// ROUTE FLAP RATE WIDGET (UC-4)
// ============================================
export const RouteFlapRateWidget: React.FC = () => {
  const { filters, onRefresh } = useFilters();
  const [data, setData] = useState<FlapSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(10);

  const loadData = useCallback(async () => {
    setLoading(true);
    const response = await getFlapSummary(filters, threshold);
    if (response.success) {
      setData(response.data);
    }
    setLoading(false);
  }, [filters, threshold]);

  useEffect(() => {
    loadData();
    return onRefresh(loadData);
  }, [loadData, onRefresh]);

  const chartData = useMemo(() => ({
    labels: data?.timeseriesData.map(d => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) ?? [],
    datasets: [
      {
        label: 'Flap Count',
        data: data?.timeseriesData.map(d => d.flapCount) ?? [],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Threshold',
        data: data?.timeseriesData.map(() => threshold) ?? [],
        borderColor: '#ef4444',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
    ],
  }), [data, threshold]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0,
    },
    plugins: {
      legend: { position: 'top' as const },
    },
    scales: {
      y: { beginAtZero: true },
    },
  }), []);

  return (
    <WidgetContainer
      id="routeFlapRate"
      title="Route Flap Rate"
      loading={loading}
      colSpan={2}
      headerAction={
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Threshold:</span>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-16 px-2 py-1 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"
          />
        </div>
      }
    >
      {data && (
        <>
          {/* Alerts Banner */}
          {data.alerts.length > 0 && (
            <div className="mb-4 space-y-2">
              {data.alerts.slice(0, 2).map((alert, idx) => (
                <div key={idx} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
                  {alert.message}
                </div>
              ))}
            </div>
          )}

          {/* Chart */}
          <div className="mb-4" style={{ height: '150px', position: 'relative' }}>
            <Line
              data={chartData}
              options={chartOptions}
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left">Neighbor</th>
                  <th className="px-3 py-2 text-left">ASN</th>
                  <th className="px-3 py-2 text-left">Flaps</th>
                  <th className="px-3 py-2 text-left">Rate/hr</th>
                  <th className="px-3 py-2 text-left">State</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {data.tableData.slice(0, 8).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-3 py-2 font-mono text-xs">{row.neighborAddress}</td>
                    <td className="px-3 py-2">AS{row.asn}</td>
                    <td className="px-3 py-2">{row.currentFlapCount}</td>
                    <td className="px-3 py-2">{row.flapRatePerHour.toFixed(1)}</td>
                    <td className="px-3 py-2">{row.sessionState}</td>
                    <td className="px-3 py-2"><FlapStatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </WidgetContainer>
  );
};

// ============================================
// MESSAGE VOLUME WIDGET (UC-3.2.6)
// ============================================
export const MessageVolumeWidget: React.FC = () => {
  const { filters, onRefresh } = useFilters();
  const [data, setData] = useState<MessageVolumeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const response = await getMessageVolumeSummary(filters);
    if (response.success) {
      setData(response.data);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadData();
    return onRefresh(loadData);
  }, [loadData, onRefresh]);

  const chartData = useMemo(() => ({
    labels: data?.timeseriesData.map(d => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) ?? [],
    datasets: [
      {
        label: 'Message Count',
        data: data?.timeseriesData.map(d => d.count) ?? [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }), [data]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0, // Disable animation to prevent jittering
    },
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  }), []);

  return (
    <WidgetContainer
      id="messageVolume"
      title="Message Volume Trend"
      loading={loading}
    >
      {data && (
        <>
          <div style={{ height: '200px', position: 'relative' }}>
            <Line
              data={chartData}
              options={chartOptions}
            />
          </div>

          {/* Daily Heatmap */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">24h Pattern</h4>
            <div className="flex gap-0.5">
              {data.dailyHeatmap.map((hour) => (
                <div
                  key={hour.hour}
                  className="flex-1 h-6 rounded-sm"
                  style={{
                    backgroundColor: `rgba(59, 130, 246, ${0.2 + hour.intensity * 0.8})`,
                  }}
                  title={`${hour.hour}:00 - ${hour.count} messages`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>00:00</span>
              <span>12:00</span>
              <span>23:00</span>
            </div>
          </div>
        </>
      )}
    </WidgetContainer>
  );
};

// ============================================
// RPKI VALIDATION WIDGET (UC-3.2.7)
// ============================================
export const RPKIValidationWidget: React.FC = () => {
  const { filters, onRefresh } = useFilters();
  const [data, setData] = useState<RPKIValidationSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const response = await getRPKIValidationSummary(filters);
    if (response.success) {
      setData(response.data);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadData();
    return onRefresh(loadData);
  }, [loadData, onRefresh]);

  const chartData = {
    labels: ['Valid', 'Invalid', 'Unknown'],
    datasets: [
      {
        data: data ? [data.valid, data.invalid, data.unknown] : [0, 0, 0],
        backgroundColor: ['#22c55e', '#ef4444', '#6b7280'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <WidgetContainer
      id="rpkiValidation"
      title="RPKI Validation Summary"
      loading={loading}
    >
      {data && (
        <div className="grid grid-cols-2 gap-4">
          {/* Donut Chart */}
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <Doughnut
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  cutout: '70%',
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-green-500">{data.validPercentage}%</span>
                <span className="text-xs text-gray-500">Valid</span>
              </div>
            </div>
          </div>

          {/* Stats & Top Prefixes */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                <div className="text-lg font-bold text-green-600">{data.valid.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Valid</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                <div className="text-lg font-bold text-red-600">{data.invalid.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Invalid</div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2">
                <div className="text-lg font-bold text-gray-600">{data.unknown.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Unknown</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">Top Prefixes</h4>
              <div className="space-y-1">
                {data.topPrefixes.slice(0, 5).map((prefix, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-mono truncate flex-1">{prefix.prefix}</span>
                    <RPKIBadge status={prefix.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
};
