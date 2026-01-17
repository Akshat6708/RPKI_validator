// ============================================
// BGP Monitor - Peer Health Page
// ============================================
// Dedicated page for monitoring BGP peer health with advanced filtering and analytics

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getPeerHealth } from '../api';
import { useFilters } from '../context';
import { PeerStatusBadge, MiniSparkline } from '../components/common';
import type { PeerHealth, Peer, PeerStatus, SessionState } from '../types';

// Custom map icons
const createPeerIcon = (status: PeerStatus) => {
  const colors = {
    healthy: '#22c55e',
    unhealthy: '#dc2626',
    unknown: '#6b7280',
  };
  
  return L.divIcon({
    className: 'custom-peer-marker',
    html: `<div style="
      width: 14px;
      height: 14px;
      background: ${colors[status]};
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

export const PeerHealthPage: React.FC = () => {
  const { filters, onRefresh } = useFilters();
  const [data, setData] = useState<PeerHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'table' | 'grid'>('map');
  const [selectedPeer, setSelectedPeer] = useState<Peer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PeerStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'asn' | 'prefixCount' | 'churnRate' | 'flapCount'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const loadData = useCallback(async () => {
    setLoading(true);
    const response = await getPeerHealth(filters);
    if (response.success) {
      setData(response.data);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadData();
    return onRefresh(loadData);
  }, [loadData, onRefresh]);

  // Filter and sort peers
  const filteredPeers = data?.peers.filter(peer => {
    const matchesSearch = !searchQuery || 
      peer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      peer.ip.includes(searchQuery) ||
      peer.asn.toString().includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || peer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = (a.name || a.ip).localeCompare(b.name || b.ip);
        break;
      case 'asn':
        comparison = a.asn - b.asn;
        break;
      case 'prefixCount':
        comparison = a.prefixCount - b.prefixCount;
        break;
      case 'churnRate':
        comparison = a.churnRate - b.churnRate;
        break;
      case 'flapCount':
        comparison = a.flapCount - b.flapCount;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  }) ?? [];

  const peersWithCoords = filteredPeers.filter(p => p.latitude && p.longitude);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-gray-500">Loading peer health data...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Peer Health</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Monitor BGP peer status and network connectivity
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Summary Statistics */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-slate-700">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.totalPeers}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Peers</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg shadow-sm p-4 border border-green-200 dark:border-green-800">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{data.healthyCount}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Healthy</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow-sm p-4 border border-red-200 dark:border-red-800">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{data.unhealthyCount}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Unhealthy</div>
          </div>
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-slate-600">
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">{data.unknownCount}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Unknown</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-sm p-4 border border-blue-200 dark:border-blue-800">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{data.reachabilityPercentage}%</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Reachable</div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name, IP, or ASN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PeerStatus | 'all')}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="unhealthy">Unhealthy</option>
            <option value="unknown">Unknown</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          >
            <option value="name">Sort by Name</option>
            <option value="asn">Sort by ASN</option>
            <option value="prefixCount">Sort by Prefixes</option>
            <option value="churnRate">Sort by Churn Rate</option>
            <option value="flapCount">Sort by Flap Count</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>

          {/* View Mode */}
          <div className="flex gap-1 border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden">
            {(['map', 'table', 'grid'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 capitalize transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredPeers.length} of {data?.totalPeers} peers
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        {viewMode === 'map' && peersWithCoords.length > 0 ? (
          <MapContainer
            center={[20, 0]}
            zoom={2}
            className="h-full w-full"
            style={{ minHeight: '500px' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {peersWithCoords.map((peer) => (
              <Marker
                key={peer.id}
                position={[peer.latitude!, peer.longitude!]}
                icon={createPeerIcon(peer.status)}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold">{peer.name || peer.ip}</div>
                    <div>AS{peer.asn}</div>
                    <div>Status: <PeerStatusBadge status={peer.status} /></div>
                    <div>Prefixes: {peer.prefixCount.toLocaleString()}</div>
                    <div>Session: {peer.sessionState}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : viewMode === 'table' ? (
          <div className="overflow-auto h-full">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Peer</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">IP Address</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ASN</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Session</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Prefixes</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Flaps</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Churn Rate</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredPeers.map((peer) => (
                  <tr
                    key={peer.id}
                    onClick={() => setSelectedPeer(peer)}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{peer.name || 'Unnamed'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{peer.ip}</td>
                    <td className="px-4 py-3 text-sm">AS{peer.asn}</td>
                    <td className="px-4 py-3">
                      <PeerStatusBadge status={peer.status} />
                    </td>
                    <td className="px-4 py-3 text-sm">{peer.sessionState}</td>
                    <td className="px-4 py-3 text-right text-sm">{peer.prefixCount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-sm">{peer.flapCount}</td>
                    <td className="px-4 py-3 text-right text-sm">{peer.churnRate.toFixed(1)}/hr</td>
                    <td className="px-4 py-3">
                      <MiniSparkline data={peer.sparklineData} height={30} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 overflow-auto h-full">
            {filteredPeers.map((peer) => (
              <div
                key={peer.id}
                onClick={() => setSelectedPeer(peer)}
                className="bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 p-4 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-lg">{peer.name || peer.ip}</div>
                    <div className="text-sm text-gray-500">AS{peer.asn} • {peer.site || 'Unknown'}</div>
                  </div>
                  <PeerStatusBadge status={peer.status} />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Session:</span>
                    <span className="font-medium">{peer.sessionState}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Prefixes:</span>
                    <span className="font-medium">{peer.prefixCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Flaps:</span>
                    <span className="font-medium">{peer.flapCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Churn Rate:</span>
                    <span className="font-medium">{peer.churnRate.toFixed(1)}/hr</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600">
                  <MiniSparkline data={peer.sparklineData} height={40} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Peer Details Modal */}
      {selectedPeer && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPeer(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedPeer.name || selectedPeer.ip}</h2>
                <p className="text-gray-500">AS{selectedPeer.asn} • {selectedPeer.site || 'Unknown Site'}</p>
              </div>
              <button
                onClick={() => setSelectedPeer(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-500">IP Address</label>
                <div className="font-medium">{selectedPeer.ip}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <div><PeerStatusBadge status={selectedPeer.status} /></div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Session State</label>
                <div className="font-medium">{selectedPeer.sessionState}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Uptime</label>
                <div className="font-medium">
                  {selectedPeer.uptime ? `${(selectedPeer.uptime / 3600).toFixed(1)} hours` : 'N/A'}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Prefix Count</label>
                <div className="font-medium">{selectedPeer.prefixCount.toLocaleString()}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Flap Count</label>
                <div className="font-medium">{selectedPeer.flapCount}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Churn Rate</label>
                <div className="font-medium">{selectedPeer.churnRate.toFixed(2)}/hr</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Last Change</label>
                <div className="font-medium text-sm">
                  {new Date(selectedPeer.lastChangeTime).toLocaleString()}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500 block mb-2">Activity Timeline (24h)</label>
              <MiniSparkline data={selectedPeer.sparklineData} height={60} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
