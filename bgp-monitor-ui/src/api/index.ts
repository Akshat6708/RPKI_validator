// ============================================
// BGP Monitor - API Abstraction Layer
// ============================================
// This file abstracts all data fetching. Replace mock implementations
// with real API calls when backend is ready.
//
// TODO: Replace mock data with real API calls:
// - Update BASE_URL to point to your backend
// - Replace mock functions with fetch/axios calls
// - Add proper error handling and retry logic
// - Implement authentication token management

import {
  GlobalFilters,
  PeerHealth,
  ChurnSummary,
  FlapSummary,
  MessageVolumeSummary,
  RPKIValidationSummary,
  Anomaly,
  Prefix,
  PrefixDetail,
  PathComparison,
  AnalyticsData,
  PlaybackData,
  Notification,
  User,
  UserRole,
  ApiResponse,
  PaginatedResponse,
} from '../types';

import {
  generatePeerHealth,
  generateChurnSummary,
  generateFlapSummary,
  generateMessageVolumeSummary,
  generateRPKIValidationSummary,
  generateAnomaly,
  generatePrefix,
  generatePathComparison,
  generateAnalyticsData,
  generatePlaybackData,
  generateNotifications,
} from './mockData';

// --- Configuration ---
// TODO: Update this when connecting to real backend
const BASE_URL = '/api';
const SIMULATED_DELAY_MS = 300; // Simulate network latency

// --- Helper Functions ---
const simulateDelay = <T>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), SIMULATED_DELAY_MS));

const wrapResponse = <T>(data: T): ApiResponse<T> => ({
  data,
  success: true,
  timestamp: new Date().toISOString(),
});

// --- Authentication API ---
// TODO: Replace with real authentication endpoint
export const loginUser = async (
  username: string,
  password: string
): Promise<ApiResponse<User>> => {
  // Simulate API call
  await simulateDelay(null);
  
  // Mock validation - in production, this would hit your auth endpoint
  if (username && password.length >= 4) {
    const mockUser: User = {
      id: 'user-1',
      username,
      email: `${username}@example.com`,
      role: username.toLowerCase().includes('admin') 
        ? UserRole.Admin 
        : username.toLowerCase().includes('engineer')
          ? UserRole.NetworkEngineer
          : UserRole.Viewer,
      lastLogin: new Date().toISOString(),
    };
    return wrapResponse(mockUser);
  }
  
  return {
    data: null as unknown as User,
    success: false,
    error: 'Invalid credentials',
    timestamp: new Date().toISOString(),
  };
};

export const logoutUser = async (): Promise<void> => {
  await simulateDelay(null);
  // TODO: Call logout endpoint, clear tokens
};

// --- Dashboard API ---
// TODO: Replace with real endpoint: GET /api/dashboard/peer-health
export const getPeerHealth = async (
  _filters: GlobalFilters
): Promise<ApiResponse<PeerHealth>> => {
  const data = await simulateDelay(generatePeerHealth(25));
  return wrapResponse(data);
};

// TODO: Replace with real endpoint: GET /api/dashboard/churn-summary
export const getChurnSummary = async (
  _filters: GlobalFilters
): Promise<ApiResponse<ChurnSummary>> => {
  const data = await simulateDelay(generateChurnSummary(24));
  return wrapResponse(data);
};

// TODO: Replace with real endpoint: GET /api/dashboard/flap-summary
export const getFlapSummary = async (
  _filters: GlobalFilters,
  threshold: number = 10
): Promise<ApiResponse<FlapSummary>> => {
  const data = await simulateDelay(generateFlapSummary(threshold));
  return wrapResponse(data);
};

// TODO: Replace with real endpoint: GET /api/dashboard/message-volume
export const getMessageVolumeSummary = async (
  _filters: GlobalFilters
): Promise<ApiResponse<MessageVolumeSummary>> => {
  const data = await simulateDelay(generateMessageVolumeSummary(24));
  return wrapResponse(data);
};

// TODO: Replace with real endpoint: GET /api/dashboard/rpki-summary
export const getRPKIValidationSummary = async (
  _filters: GlobalFilters
): Promise<ApiResponse<RPKIValidationSummary>> => {
  const data = await simulateDelay(generateRPKIValidationSummary());
  return wrapResponse(data);
};

// --- Anomaly API ---
// TODO: Replace with real endpoint: GET /api/anomalies
export const getAnomalies = async (
  _filters: GlobalFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<Anomaly>> => {
  const allAnomalies = Array.from({ length: 100 }, (_, i) => generateAnomaly(i));
  const start = (page - 1) * pageSize;
  const data = allAnomalies.slice(start, start + pageSize);
  
  await simulateDelay(null);
  
  return {
    data,
    total: allAnomalies.length,
    page,
    pageSize,
    hasMore: start + pageSize < allAnomalies.length,
  };
};

// TODO: Replace with real endpoint: GET /api/anomalies/:id
export const getAnomalyDetail = async (
  anomalyId: string
): Promise<ApiResponse<Anomaly>> => {
  const id = parseInt(anomalyId.split('-')[1] || '0');
  const data = await simulateDelay(generateAnomaly(id));
  return wrapResponse(data);
};

// TODO: Replace with real endpoint: POST /api/anomalies/:id/feedback
export const submitAnomalyFeedback = async (
  anomalyId: string,
  feedback: string
): Promise<ApiResponse<{ success: boolean }>> => {
  await simulateDelay(null);
  console.log(`Feedback submitted for ${anomalyId}: ${feedback}`);
  return wrapResponse({ success: true });
};

// --- Prefix API ---
// TODO: Replace with real endpoint: GET /api/prefixes
export const getPrefixes = async (
  _filters: GlobalFilters,
  page: number = 1,
  pageSize: number = 50
): Promise<PaginatedResponse<Prefix>> => {
  const allPrefixes = Array.from({ length: 500 }, (_, i) => generatePrefix(i));
  const start = (page - 1) * pageSize;
  const data = allPrefixes.slice(start, start + pageSize);
  
  await simulateDelay(null);
  
  return {
    data,
    total: allPrefixes.length,
    page,
    pageSize,
    hasMore: start + pageSize < allPrefixes.length,
  };
};

// TODO: Replace with real endpoint: GET /api/prefixes/:prefix
export const getPrefixDetail = async (
  prefix: string
): Promise<ApiResponse<PrefixDetail>> => {
  const basePrefix = generatePrefix(0);
  const detail: PrefixDetail = {
    ...basePrefix,
    prefix,
    timeline: Array.from({ length: 20 }, (_, i) => ({
      id: `event-${i}`,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      eventType: (['announcement', 'withdrawal', 'path_change', 'attribute_change'] as const)[i % 4],
      details: `Event ${i + 1} details`,
      peer: `192.168.${Math.floor(Math.random() * 255)}.1`,
    })),
    paths: Array.from({ length: 5 }, (_, i) => ({
      id: `path-${i}`,
      path: Array.from({ length: 3 + i }, () => Math.floor(Math.random() * 65000)),
      nextHop: `192.168.${Math.floor(Math.random() * 255)}.1`,
      med: Math.floor(Math.random() * 1000),
      localPref: 100 + i * 10,
      communities: [`65000:${100 + i}`],
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      isCurrentBest: i === 0,
    })),
    vrps: Array.from({ length: 3 }, () => ({
      asn: Math.floor(Math.random() * 65000),
      prefix,
      maxLength: 24 + Math.floor(Math.random() * 8),
      trustAnchor: 'ARIN',
    })),
  };
  
  await simulateDelay(null);
  return wrapResponse(detail);
};

// --- Path Tracking API ---
// TODO: Replace with real endpoint: GET /api/path-tracking
export const getPathComparison = async (
  prefix: string,
  _filters: GlobalFilters
): Promise<ApiResponse<PathComparison>> => {
  const data = await simulateDelay(generatePathComparison(prefix));
  return wrapResponse(data);
};

// --- Analytics API ---
// TODO: Replace with real endpoint: GET /api/analytics
export const getAnalyticsData = async (
  _filters: GlobalFilters
): Promise<ApiResponse<AnalyticsData>> => {
  const data = await simulateDelay(generateAnalyticsData());
  return wrapResponse(data);
};

// --- Playback API ---
// TODO: Replace with real endpoint: GET /api/playback
export const getPlaybackData = async (
  startTime: Date,
  endTime: Date
): Promise<ApiResponse<PlaybackData>> => {
  const hours = Math.ceil((endTime.getTime() - startTime.getTime()) / 3600000);
  const data = await simulateDelay(generatePlaybackData(hours));
  return wrapResponse(data);
};

// --- Notifications API ---
// TODO: Replace with real endpoint: GET /api/notifications
export const getNotifications = async (): Promise<ApiResponse<Notification[]>> => {
  const data = await simulateDelay(generateNotifications(10));
  return wrapResponse(data);
};

// TODO: Replace with real endpoint: POST /api/notifications/:id/read
export const markNotificationRead = async (
  notificationId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  await simulateDelay(null);
  console.log(`Notification marked as read: ${notificationId}`);
  return wrapResponse({ success: true });
};

// --- Real-time Data (WebSocket) ---
// TODO: Implement WebSocket connection for real-time updates
// This would connect to your existing RPKI validator's data stream
export const subscribeToLiveUpdates = (
  onUpdate: (data: unknown) => void,
  onError: (error: Error) => void
): (() => void) => {
  // Mock implementation - simulates periodic updates
  const interval = setInterval(() => {
    try {
      onUpdate({
        type: 'validation',
        timestamp: new Date().toISOString(),
        data: generatePrefix(Math.floor(Math.random() * 100)),
      });
    } catch (error) {
      onError(error as Error);
    }
  }, 5000);
  
  // Return cleanup function
  return () => clearInterval(interval);
};

// --- Utility Functions ---
export const buildQueryString = (filters: GlobalFilters): string => {
  const params = new URLSearchParams();
  
  if (filters.tenant) params.append('tenant', filters.tenant);
  if (filters.region) params.append('region', filters.region);
  if (filters.peerAsn) params.append('asn', filters.peerAsn.toString());
  if (filters.prefix) params.append('prefix', filters.prefix);
  if (filters.ipVersion !== 'Both') params.append('ipVersion', filters.ipVersion);
  params.append('timeRange', filters.timeRange.preset);
  
  return params.toString();
};
