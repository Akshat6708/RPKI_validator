// ============================================
// BGP Monitor - Core Type Definitions
// ============================================

// --- User & Authentication Types ---
export enum UserRole {
  Admin = 'Admin',
  NetworkEngineer = 'NetworkEngineer',
  Viewer = 'Viewer',
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  tenant?: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// --- Time & Filter Types ---
export type TimeRangePreset = '10m' | '15m' | '1h' | '3h' | '12h' | '24h' | '7d' | '14d' | '30d';

export type RefreshInterval = '15s' | '30s' | '45s' | '1m' | '2m' | '5m';

export type IPVersion = 'IPv4' | 'IPv6' | 'Both';

export interface TimeRange {
  preset: TimeRangePreset;
  start: Date;
  end: Date;
}

export interface GlobalFilters {
  timeRange: TimeRange;
  tenant?: string;
  region?: string;
  peerAsn?: number;
  prefix?: string;
  ipVersion: IPVersion;
}

// --- Peer Types ---
export type PeerStatus = 'healthy' | 'unhealthy' | 'unknown';
export type SessionState = 'Established' | 'Active' | 'Connect' | 'OpenSent' | 'OpenConfirm' | 'Idle';

export interface Peer {
  id: string;
  ip: string;
  asn: number;
  name?: string;
  site?: string;
  status: PeerStatus;
  sessionState: SessionState;
  latitude?: number;
  longitude?: number;
  lastChangeTime: string;
  uptime?: number;
  prefixCount: number;
  flapCount: number;
  churnRate: number; // updates per hour
  sparklineData: number[]; // last N data points for mini chart
}

export interface PeerHealth {
  totalPeers: number;
  healthyCount: number;
  unhealthyCount: number;
  unknownCount: number;
  reachabilityPercentage: number;
  peers: Peer[];
}

// --- Prefix Types ---
export type RPKIStatus = 'valid' | 'invalid' | 'not-found' | 'unknown';

export interface Prefix {
  id: string;
  prefix: string;
  originAsn: number;
  rpkiStatus: RPKIStatus;
  maxLength?: number;
  bestPathLength: number;
  lastUpdateTime: string;
  flapCount: number;
  announcements: number;
  withdrawals: number;
  churnRate: number;
  anomalyTags: string[];
  sparklineData: number[];
}

export interface PrefixDetail extends Prefix {
  timeline: PrefixEvent[];
  paths: ASPath[];
  vrps: VRP[];
}

export interface PrefixEvent {
  id: string;
  timestamp: string;
  eventType: 'announcement' | 'withdrawal' | 'path_change' | 'attribute_change';
  details: string;
  peer: string;
}

export interface VRP {
  asn: number;
  prefix: string;
  maxLength: number;
  trustAnchor: string;
}

// --- AS Path Types ---
export interface ASPath {
  id: string;
  path: number[];
  nextHop: string;
  med?: number;
  localPref?: number;
  communities: string[];
  timestamp: string;
  isCurrentBest: boolean;
}

export interface PathComparison {
  prefix: string;
  beforePath: ASPath;
  afterPath: ASPath;
  changes: PathChange[];
  stabilityScore: number; // 0-100
}

export interface PathChange {
  changeType: 'insertion' | 'removal' | 'reorder' | 'attribute_change';
  position?: number;
  oldValue?: string | number;
  newValue?: string | number;
  attribute?: 'NEXT_HOP' | 'MED' | 'LocalPref' | 'Communities';
  timestamp: string;
}

// --- Anomaly Types ---
export type AnomalyType = 'Hijack' | 'Leak' | 'Flap' | 'PathChange' | 'PrependAnomaly' | 'RPKIInvalid';
export type Severity = 'Critical' | 'High' | 'Elevated' | 'Info';
export type AnalystFeedback = 'Confirmed Threat' | 'False Positive' | 'Known Issue' | 'Whitelist';

export interface Anomaly {
  id: string;
  eventId: string;
  timestamp: string;
  anomalyType: AnomalyType;
  severity: Severity;
  affectedPrefix: string;
  affectedAsn: number;
  confidence: number; // 0-100
  description: string;
  isResolved: boolean;
  feedback?: AnalystFeedback;
  rcaTimeline?: RCAEvent[];
}

export interface RCAEvent {
  id: string;
  timestamp: string;
  eventType: string;
  description: string;
  relatedEntities: string[];
}

// --- Churn & Flap Types ---
export interface ChurnData {
  timestamp: string;
  announcements: number;
  withdrawals: number;
  total: number;
}

export interface ChurnSummary {
  timeseriesData: ChurnData[];
  topPeers: ChurnLeader[];
  topPrefixes: ChurnLeader[];
  severityBand: 'Normal' | 'Elevated' | 'High' | 'Critical';
  anomalyMarkers: AnomalyMarker[];
}

export interface ChurnLeader {
  id: string;
  name: string;
  asn?: number;
  prefix?: string;
  count: number;
  sparklineData: number[];
}

export interface AnomalyMarker {
  timestamp: string;
  severity: Severity;
  description: string;
}

export type FlapStatus = 'Stable' | 'Inconsistent' | 'Flapping';

export interface FlapData {
  neighborAddress: string;
  asn: number;
  currentFlapCount: number;
  lastFlapTimestamp: string;
  totalFlapsInWindow: number;
  sessionState: SessionState;
  flapRatePerHour: number;
  status: FlapStatus;
  sparklineData: number[];
}

export interface FlapSummary {
  timeseriesData: { timestamp: string; flapCount: number }[];
  threshold: number;
  alerts: FlapAlert[];
  tableData: FlapData[];
}

export interface FlapAlert {
  peer: string;
  asn: number;
  flapCount: number;
  threshold: number;
  message: string;
}

// --- Message Volume Types ---
export interface MessageVolumeData {
  timestamp: string;
  count: number;
  isAnomaly: boolean;
}

export interface MessageVolumeSummary {
  timeseriesData: MessageVolumeData[];
  threshold: number;
  dailyHeatmap: { hour: number; count: number; intensity: number }[];
}

// --- RPKI Validation Types ---
export interface RPKIValidationSummary {
  valid: number;
  invalid: number;
  unknown: number;
  total: number;
  validPercentage: number;
  topPrefixes: {
    prefix: string;
    originAsn: number;
    status: RPKIStatus;
  }[];
}

// --- Dashboard Widget Types ---
export type WidgetId = 
  | 'peerHealth'
  | 'churnSummary'
  | 'activeAnomalies'
  | 'routeFlapRate'
  | 'messageVolume'
  | 'rpkiValidation';

export interface WidgetConfig {
  id: WidgetId;
  title: string;
  visible: boolean;
  order: number;
  minRole: UserRole;
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
  lastModified: string;
}

// --- Analytics Types ---
export interface AnalyticsData {
  anomalyTrends: { timestamp: string; score: number; baseline: number }[];
  peerStabilityHeatmap: { peer: string; timeBucket: string; stability: number }[];
  trafficCorrelation: { volume: number; anomalyCount: number; severity: number }[];
  prefixBehavior: { prefixCount: number; updateRate: number }[];
  rpkiTrends: { timestamp: string; valid: number; invalid: number; unknown: number }[];
  metrics: {
    avgChurnRate: number;
    avgFlapRate: number;
    pathStability: number;
    rpkiCoverage: number;
  };
  trendData: {
    timestamp: string;
    churn: number;
    flaps: number;
    anomalies: number;
    avgPathLength: number;
  }[];
  distribution: {
    anomalyTypes: Record<string, number>;
    rpkiStatus: { valid: number; invalid: number; unknown: number };
    peerStatus: { healthy: number; unhealthy: number; unknown: number };
  };
  topAsns: { asn: number; activity: number }[];
}

// --- Historical Playback Types ---
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: Date;
  startTime: Date;
  endTime: Date;
  speed: number; // 1x, 2x, 4x, etc.
}

export interface PlaybackFrame {
  timestamp: string;
  metrics: {
    activePrefixes: number;
    activePeers: number;
    announcements: number;
    withdrawals: number;
    rpkiValid: number;
  };
  events: {
    id: string;
    type: string;
    severity: Severity;
    description: string;
  }[];
  topChangedPrefixes: {
    prefix: string;
    changeCount: number;
    rpkiStatus: RPKIStatus;
  }[];
}

export interface PlaybackData {
  frames: PlaybackFrame[];
  startTime: string;
  endTime: string;
  totalEvents: number;
}

// --- API Response Types ---
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// --- Notification Types ---
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

// --- Settings Types ---
export interface UserSettings {
  theme: 'light' | 'dark';
  defaultTimeRange: TimeRangePreset;
  defaultRefreshInterval: RefreshInterval;
  topNDefault: 5 | 10 | 25 | 100;
  flapThreshold: number;
  notifications: {
    emailAlerts: boolean;
    browserNotifications: boolean;
    criticalOnly: boolean;
  };
}
