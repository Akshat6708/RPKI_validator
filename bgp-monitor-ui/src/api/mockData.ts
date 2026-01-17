// ============================================
// BGP Monitor - Mock Data Generator
// ============================================
// This file contains functions to generate realistic dummy data
// for development and testing purposes.

import type {
  Peer,
  Prefix,
  Anomaly,
  ChurnSummary,
  FlapData,
  FlapSummary,
  MessageVolumeSummary,
  RPKIValidationSummary,
  PeerHealth,
  ASPath,
  PathComparison,
  AnalyticsData,
  PlaybackData,
  Notification,
  PeerStatus,
  RPKIStatus,
  Severity,
  AnomalyType,
  SessionState,
  FlapStatus,
} from '../types';

// --- Helper Functions ---
const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (min: number, max: number, decimals = 2): number =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateSparkline = (length: number, min: number, max: number): number[] =>
  Array.from({ length }, () => randomInt(min, max));

const generateTimestamp = (hoursAgo: number): string => {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
};

const generateTimeseriesData = <T>(
  hours: number,
  generator: (timestamp: string) => T
): T[] => {
  const data: T[] = [];
  for (let i = hours; i >= 0; i--) {
    data.push(generator(generateTimestamp(i)));
  }
  return data;
};

// --- Peer Data ---
const peerNames = ['Cogent', 'Level3', 'NTT', 'Telia', 'GTT', 'Zayo', 'HE', 'Lumen', 'PCCW', 'Tata'];
const sites = ['NYC-1', 'LAX-2', 'LON-1', 'FRA-1', 'SIN-1', 'TYO-1', 'SYD-1', 'AMS-1'];

export const generatePeer = (index: number): Peer => {
  const status: PeerStatus = randomChoice(['healthy', 'healthy', 'healthy', 'unhealthy', 'unknown']);
  const sessionState: SessionState = status === 'healthy' 
    ? 'Established' 
    : randomChoice(['Active', 'Connect', 'Idle']);
  
  return {
    id: `peer-${index}`,
    ip: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
    asn: randomInt(1000, 65000),
    name: `${randomChoice(peerNames)}-${index}`,
    site: randomChoice(sites),
    status,
    sessionState,
    latitude: randomFloat(-60, 70),
    longitude: randomFloat(-180, 180),
    lastChangeTime: generateTimestamp(randomInt(0, 72)),
    uptime: status === 'healthy' ? randomInt(3600, 86400 * 30) : 0,
    prefixCount: randomInt(100, 50000),
    flapCount: status === 'healthy' ? randomInt(0, 5) : randomInt(5, 50),
    churnRate: randomFloat(0, 100),
    sparklineData: generateSparkline(24, 0, status === 'healthy' ? 10 : 50),
  };
};

export const generatePeerHealth = (count: number = 25): PeerHealth => {
  const peers = Array.from({ length: count }, (_, i) => generatePeer(i));
  const healthyCount = peers.filter(p => p.status === 'healthy').length;
  const unhealthyCount = peers.filter(p => p.status === 'unhealthy').length;
  const unknownCount = peers.filter(p => p.status === 'unknown').length;
  
  return {
    totalPeers: count,
    healthyCount,
    unhealthyCount,
    unknownCount,
    reachabilityPercentage: parseFloat(((healthyCount / count) * 100).toFixed(1)),
    peers,
  };
};

// --- Prefix Data ---
const prefixExamples = [
  '1.1.1.0/24', '8.8.8.0/24', '9.9.9.0/24', '208.67.222.0/24',
  '2606:4700::/32', '2001:4860::/32', '2620:fe::/48',
];

export const generatePrefix = (index: number): Prefix => {
  const rpkiStatus: RPKIStatus = randomChoice(['valid', 'valid', 'valid', 'invalid', 'not-found', 'unknown']);
  const hasAnomaly = rpkiStatus === 'invalid' || Math.random() < 0.1;
  
  return {
    id: `prefix-${index}`,
    prefix: index < prefixExamples.length 
      ? prefixExamples[index] 
      : `${randomInt(1, 223)}.${randomInt(0, 255)}.${randomInt(0, 255)}.0/${randomInt(16, 28)}`,
    originAsn: randomInt(1000, 65000),
    rpkiStatus,
    maxLength: randomInt(24, 32),
    bestPathLength: randomInt(2, 8),
    lastUpdateTime: generateTimestamp(randomFloat(0, 24)),
    flapCount: randomInt(0, 20),
    announcements: randomInt(10, 500),
    withdrawals: randomInt(5, 200),
    churnRate: randomFloat(0, 50),
    anomalyTags: hasAnomaly 
      ? [randomChoice(['Hijack Suspect', 'Route Leak', 'Path Anomaly', 'High Churn'])]
      : [],
    sparklineData: generateSparkline(24, 0, 30),
  };
};

// --- Anomaly Data ---
const anomalyDescriptions: Record<AnomalyType, string[]> = {
  Hijack: [
    'Potential BGP hijack detected: unexpected origin AS',
    'MOAS conflict detected for prefix',
    'Suspicious route announcement from unregistered AS',
  ],
  Leak: [
    'Route leak detected: customer route leaked to peer',
    'Potential route leak via transit provider',
    'Unexpected propagation of internal prefix',
  ],
  Flap: [
    'Route flapping detected: rapid state changes',
    'Unstable route: multiple announcements/withdrawals',
    'BGP session instability causing route oscillation',
  ],
  PathChange: [
    'Significant AS path change detected',
    'Unexpected path lengthening observed',
    'Route now traversing suspicious AS',
  ],
  PrependAnomaly: [
    'Unusual AS path prepending detected',
    'Excessive prepending observed (>5 times)',
    'Prepending pattern change detected',
  ],
  RPKIInvalid: [
    'RPKI validation failed: invalid origin AS',
    'ROA mismatch detected for prefix',
    'Route announcement violates RPKI policy',
  ],
};

export const generateAnomaly = (index: number): Anomaly => {
  const anomalyType: AnomalyType = randomChoice([
    'Hijack', 'Leak', 'Flap', 'PathChange', 'PrependAnomaly', 'RPKIInvalid'
  ]);
  const severity: Severity = randomChoice(['Critical', 'High', 'Elevated', 'Info']);
  
  return {
    id: `anomaly-${index}`,
    eventId: `EVT-${Date.now()}-${index}`,
    timestamp: generateTimestamp(randomFloat(0, 24)),
    anomalyType,
    severity,
    affectedPrefix: `${randomInt(1, 223)}.${randomInt(0, 255)}.${randomInt(0, 255)}.0/${randomInt(16, 28)}`,
    affectedAsn: randomInt(1000, 65000),
    confidence: randomInt(60, 100),
    description: randomChoice(anomalyDescriptions[anomalyType]),
    isResolved: Math.random() < 0.3,
    rcaTimeline: Array.from({ length: randomInt(3, 8) }, (_, i) => ({
      id: `rca-${index}-${i}`,
      timestamp: generateTimestamp(randomFloat(0, 2)),
      eventType: randomChoice(['BGP Update', 'Path Change', 'Withdrawal', 'Announcement']),
      description: `Event ${i + 1} in the anomaly timeline`,
      relatedEntities: [`AS${randomInt(1000, 65000)}`, `${randomInt(1, 223)}.0.0.0/8`],
    })),
  };
};

// --- Churn Data ---
export const generateChurnSummary = (hours: number = 24): ChurnSummary => {
  const timeseriesData = generateTimeseriesData(hours, (timestamp) => ({
    timestamp,
    announcements: randomInt(50, 500),
    withdrawals: randomInt(20, 200),
    total: 0, // Will be calculated
  })).map(d => ({ ...d, total: d.announcements + d.withdrawals }));

  const maxChurn = Math.max(...timeseriesData.map(d => d.total));
  const severityBand = maxChurn > 1000 ? 'Critical' 
    : maxChurn > 500 ? 'High' 
    : maxChurn > 200 ? 'Elevated' 
    : 'Normal';

  return {
    timeseriesData,
    topPeers: Array.from({ length: 10 }, (_, i) => ({
      id: `peer-${i}`,
      name: `${randomChoice(peerNames)}-${randomInt(1, 99)}`,
      asn: randomInt(1000, 65000),
      count: randomInt(100, 1000),
      sparklineData: generateSparkline(24, 10, 100),
    })).sort((a, b) => b.count - a.count),
    topPrefixes: Array.from({ length: 10 }, (_, i) => ({
      id: `prefix-${i}`,
      name: `${randomInt(1, 223)}.${randomInt(0, 255)}.${randomInt(0, 255)}.0/${randomInt(16, 28)}`,
      count: randomInt(50, 500),
      sparklineData: generateSparkline(24, 5, 50),
    })).sort((a, b) => b.count - a.count),
    severityBand,
    anomalyMarkers: Array.from({ length: randomInt(2, 6) }, () => ({
      timestamp: generateTimestamp(randomFloat(0, hours)),
      severity: randomChoice(['Critical', 'High', 'Elevated', 'Info']) as Severity,
      description: 'Anomaly marker',
    })),
  };
};

// --- Flap Data ---
export const generateFlapSummary = (threshold: number = 10): FlapSummary => {
  const tableData: FlapData[] = Array.from({ length: 20 }, (_, i) => {
    const flapCount = randomInt(0, 25);
    const status: FlapStatus = flapCount >= 5 ? 'Flapping' 
      : flapCount >= 2 ? 'Inconsistent' 
      : 'Stable';
    
    return {
      neighborAddress: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
      asn: randomInt(1000, 65000),
      currentFlapCount: flapCount,
      lastFlapTimestamp: generateTimestamp(randomFloat(0, 2)),
      totalFlapsInWindow: flapCount * randomInt(1, 5),
      sessionState: randomChoice(['Established', 'Active', 'Connect', 'Idle']) as SessionState,
      flapRatePerHour: randomFloat(0, 15),
      status,
      sparklineData: generateSparkline(24, 0, 15),
    };
  });

  const alerts = tableData
    .filter(d => d.currentFlapCount > threshold)
    .map(d => ({
      peer: d.neighborAddress,
      asn: d.asn,
      flapCount: d.currentFlapCount,
      threshold,
      message: `High flap rate detected for Peer ${d.neighborAddress} — ${d.currentFlapCount} flaps in last 60 minutes (Threshold: ${threshold})`,
    }));

  return {
    timeseriesData: generateTimeseriesData(24, (timestamp) => ({
      timestamp,
      flapCount: randomInt(0, 50),
    })),
    threshold,
    alerts,
    tableData: tableData.sort((a, b) => b.currentFlapCount - a.currentFlapCount),
  };
};

// --- Message Volume Data ---
export const generateMessageVolumeSummary = (hours: number = 24): MessageVolumeSummary => {
  const threshold = 1000;
  
  return {
    timeseriesData: generateTimeseriesData(hours * 60, (timestamp) => {
      const count = randomInt(200, 1500);
      return {
        timestamp,
        count,
        isAnomaly: count > threshold * 1.2,
      };
    }).filter((_, i) => i % 5 === 0), // Sample every 5 minutes
    threshold,
    dailyHeatmap: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: randomInt(500, 2000),
      intensity: randomFloat(0, 1),
    })),
  };
};

// --- RPKI Validation Data ---
export const generateRPKIValidationSummary = (): RPKIValidationSummary => {
  const valid = randomInt(5000, 10000);
  const invalid = randomInt(100, 500);
  const unknown = randomInt(500, 2000);
  const total = valid + invalid + unknown;

  return {
    valid,
    invalid,
    unknown,
    total,
    validPercentage: parseFloat(((valid / total) * 100).toFixed(1)),
    topPrefixes: Array.from({ length: 10 }, (_, i) => ({
      prefix: `${randomInt(1, 223)}.${randomInt(0, 255)}.${randomInt(0, 255)}.0/${randomInt(16, 28)}`,
      originAsn: randomInt(1000, 65000),
      status: randomChoice(['valid', 'invalid', 'not-found', 'unknown']) as RPKIStatus,
    })),
  };
};

// --- Path Comparison Data ---
export const generatePathComparison = (prefix: string): PathComparison => {
  const beforePath: ASPath = {
    id: 'path-before',
    path: Array.from({ length: randomInt(3, 6) }, () => randomInt(1000, 65000)),
    nextHop: `192.168.${randomInt(1, 255)}.1`,
    med: randomInt(0, 1000),
    localPref: randomInt(50, 200),
    communities: [`${randomInt(1000, 65000)}:${randomInt(1, 1000)}`],
    timestamp: generateTimestamp(2),
    isCurrentBest: false,
  };

  const afterPath: ASPath = {
    id: 'path-after',
    path: [...beforePath.path.slice(0, 2), randomInt(1000, 65000), ...beforePath.path.slice(3)],
    nextHop: Math.random() > 0.5 ? beforePath.nextHop : `192.168.${randomInt(1, 255)}.1`,
    med: randomInt(0, 1000),
    localPref: randomInt(50, 200),
    communities: beforePath.communities,
    timestamp: generateTimestamp(0),
    isCurrentBest: true,
  };

  return {
    prefix,
    beforePath,
    afterPath,
    changes: [
      {
        changeType: 'insertion',
        position: 2,
        newValue: afterPath.path[2],
        timestamp: generateTimestamp(0.5),
      },
    ],
    stabilityScore: randomInt(40, 95),
  };
};

// --- Analytics Data ---
export const generateAnalyticsData = (): AnalyticsData => ({
  anomalyTrends: generateTimeseriesData(168, (timestamp) => ({
    timestamp,
    score: randomFloat(0, 100),
    baseline: 50,
  })),
  peerStabilityHeatmap: Array.from({ length: 10 }, (_, peerIdx) =>
    Array.from({ length: 24 }, (_, hourIdx) => ({
      peer: `Peer-${peerIdx + 1}`,
      timeBucket: `${hourIdx}:00`,
      stability: randomFloat(0, 100),
    }))
  ).flat(),
  trafficCorrelation: Array.from({ length: 50 }, () => ({
    volume: randomInt(100, 10000),
    anomalyCount: randomInt(0, 20),
    severity: randomFloat(0, 10),
  })),
  prefixBehavior: Array.from({ length: 100 }, () => ({
    prefixCount: randomInt(1, 1000),
    updateRate: randomFloat(0, 100),
  })),
  rpkiTrends: generateTimeseriesData(30 * 24, (timestamp) => ({
    timestamp,
    valid: randomInt(5000, 10000),
    invalid: randomInt(100, 500),
    unknown: randomInt(500, 2000),
  })).filter((_, i) => i % 24 === 0), // Daily samples
  metrics: {
    avgChurnRate: randomFloat(50, 150),
    avgFlapRate: randomFloat(5, 25),
    pathStability: randomInt(75, 98),
    rpkiCoverage: randomInt(60, 85),
  },
  trendData: generateTimeseriesData(30, (timestamp) => ({
    timestamp,
    churn: randomInt(100, 500),
    flaps: randomInt(5, 50),
    anomalies: randomInt(0, 20),
    avgPathLength: randomFloat(3, 6),
  })),
  distribution: {
    anomalyTypes: {
      Hijack: randomInt(5, 20),
      Leak: randomInt(10, 30),
      Flap: randomInt(20, 50),
      PathChange: randomInt(30, 60),
      PrependAnomaly: randomInt(5, 15),
      RPKIInvalid: randomInt(10, 25),
    },
    rpkiStatus: {
      valid: randomInt(5000, 10000),
      invalid: randomInt(100, 500),
      unknown: randomInt(500, 2000),
    },
    peerStatus: {
      healthy: randomInt(15, 25),
      unhealthy: randomInt(2, 8),
      unknown: randomInt(1, 5),
    },
  },
  topAsns: Array.from({ length: 10 }, (_, i) => ({
    asn: randomInt(1000, 65000),
    activity: randomInt(100, 5000) * (10 - i),
  })).sort((a, b) => b.activity - a.activity),
});

// --- Playback Data ---
export const generatePlaybackData = (hours: number = 24): PlaybackData => {
  const frames = generateTimeseriesData(hours * 4, (timestamp) => ({
    timestamp,
    metrics: {
      activePrefixes: randomInt(10000, 50000),
      activePeers: randomInt(15, 30),
      announcements: randomInt(50, 500),
      withdrawals: randomInt(20, 200),
      rpkiValid: randomInt(70, 95),
    },
    events: Math.random() < 0.3 ? Array.from({ length: randomInt(1, 3) }, (_, i) => ({
      id: `event-${timestamp}-${i}`,
      type: randomChoice(['BGP Update', 'Path Change', 'Withdrawal', 'Announcement', 'RPKI Alert']),
      severity: randomChoice(['Critical', 'High', 'Elevated', 'Info']) as Severity,
      description: randomChoice([
        'Route announcement from new origin',
        'Significant path change detected',
        'Multiple withdrawals from peer',
        'RPKI validation state changed',
      ]),
    })) : [],
    topChangedPrefixes: Array.from({ length: 5 }, () => ({
      prefix: `${randomInt(1, 223)}.${randomInt(0, 255)}.${randomInt(0, 255)}.0/${randomInt(16, 28)}`,
      changeCount: randomInt(1, 50),
      rpkiStatus: randomChoice(['valid', 'invalid', 'not-found', 'unknown']) as RPKIStatus,
    })).sort((a, b) => b.changeCount - a.changeCount),
  }));

  return {
    frames,
    startTime: frames[0]?.timestamp || new Date().toISOString(),
    endTime: frames[frames.length - 1]?.timestamp || new Date().toISOString(),
    totalEvents: frames.reduce((sum, f) => sum + f.events.length, 0),
  };
};

// --- Notification Data ---
export const generateNotifications = (count: number = 10): Notification[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `notif-${i}`,
    type: randomChoice(['info', 'warning', 'error', 'success']),
    title: randomChoice([
      'New anomaly detected',
      'Peer session down',
      'RPKI validation failed',
      'High churn rate alert',
      'Route flapping warning',
    ]),
    message: 'Click to view details and take action.',
    timestamp: generateTimestamp(randomFloat(0, 48)),
    isRead: Math.random() < 0.5,
    actionUrl: '/dashboard',
  }));
