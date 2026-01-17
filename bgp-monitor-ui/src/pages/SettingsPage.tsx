// ============================================
// BGP Monitor - Settings Page
// ============================================

import React, { useState } from 'react';
import { useAuth, useTheme, useDashboard, useFilters } from '../context';
import type { RefreshInterval } from '../types';

interface NotificationSettings {
  email: boolean;
  slack: boolean;
  webhook: boolean;
  criticalOnly: boolean;
}

interface AlertThreshold {
  churnRate: number;
  flapThreshold: number;
  rpkiInvalidPercent: number;
  anomalyConfidence: number;
}

export const SettingsPage: React.FC = () => {
  const { user, canEdit } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { resetLayout } = useDashboard();
  const { isAutoRefreshEnabled, refreshInterval, toggleAutoRefresh, setRefreshInterval } = useFilters();
  
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'thresholds' | 'appearance'>('general');
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    slack: false,
    webhook: false,
    criticalOnly: false,
  });
  const [thresholds, setThresholds] = useState<AlertThreshold>({
    churnRate: 100,
    flapThreshold: 10,
    rpkiInvalidPercent: 5,
    anomalyConfidence: 70,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In production, this would save to backend
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'thresholds', label: 'Alert Thresholds', icon: '⚡' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure your BGP Monitor preferences
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-64 shrink-0">
          <nav className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Settings</h2>
                
                {/* User Info */}
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Account Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Username</label>
                      <p className="font-medium text-gray-900 dark:text-white">{user?.username}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Email</label>
                      <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Role</label>
                      <p className="font-medium text-gray-900 dark:text-white">{user?.role}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Last Login</label>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Auto-Refresh Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Data Refresh</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Auto-Refresh</p>
                      <p className="text-sm text-gray-500">Automatically refresh dashboard data</p>
                    </div>
                    <button
                      onClick={() => toggleAutoRefresh()}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isAutoRefreshEnabled ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isAutoRefreshEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Refresh Interval
                    </label>
                    <select
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(e.target.value as RefreshInterval)}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    >
                      <option value="15s">15 seconds</option>
                      <option value="30s">30 seconds</option>
                      <option value="45s">45 seconds</option>
                      <option value="1m">1 minute</option>
                      <option value="2m">2 minutes</option>
                      <option value="5m">5 minutes</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Settings</h2>
              
              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive alerts via email</p>
                  </div>
                  <button
                    onClick={() => setNotifications(n => ({ ...n, email: !n.email }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.email ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.email ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Slack */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Slack Integration</p>
                    <p className="text-sm text-gray-500">Send alerts to Slack channel</p>
                  </div>
                  <button
                    onClick={() => setNotifications(n => ({ ...n, slack: !n.slack }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.slack ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.slack ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Webhook */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Webhook</p>
                    <p className="text-sm text-gray-500">POST alerts to custom endpoint</p>
                  </div>
                  <button
                    onClick={() => setNotifications(n => ({ ...n, webhook: !n.webhook }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.webhook ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.webhook ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Critical Only */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Critical Only</p>
                    <p className="text-sm text-gray-500">Only send critical severity alerts</p>
                  </div>
                  <button
                    onClick={() => setNotifications(n => ({ ...n, criticalOnly: !n.criticalOnly }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.criticalOnly ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.criticalOnly ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Alert Thresholds */}
          {activeTab === 'thresholds' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alert Thresholds</h2>
              
              {!canEdit() && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    You don't have permission to modify alert thresholds. Contact an administrator.
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {/* Churn Rate */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Churn Rate Threshold (updates/hour)
                    </label>
                    <span className="text-sm font-mono text-gray-500">{thresholds.churnRate}</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={500}
                    value={thresholds.churnRate}
                    onChange={(e) => setThresholds(t => ({ ...t, churnRate: Number(e.target.value) }))}
                    disabled={!canEdit()}
                    className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                  />
                </div>

                {/* Flap Threshold */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Flap Threshold (flaps/peer)
                    </label>
                    <span className="text-sm font-mono text-gray-500">{thresholds.flapThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={thresholds.flapThreshold}
                    onChange={(e) => setThresholds(t => ({ ...t, flapThreshold: Number(e.target.value) }))}
                    disabled={!canEdit()}
                    className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                  />
                </div>

                {/* RPKI Invalid */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      RPKI Invalid Alert (%)
                    </label>
                    <span className="text-sm font-mono text-gray-500">{thresholds.rpkiInvalidPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={thresholds.rpkiInvalidPercent}
                    onChange={(e) => setThresholds(t => ({ ...t, rpkiInvalidPercent: Number(e.target.value) }))}
                    disabled={!canEdit()}
                    className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                  />
                </div>

                {/* Anomaly Confidence */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Anomaly Alert Confidence (%)
                    </label>
                    <span className="text-sm font-mono text-gray-500">{thresholds.anomalyConfidence}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={thresholds.anomalyConfidence}
                    onChange={(e) => setThresholds(t => ({ ...t, anomalyConfidence: Number(e.target.value) }))}
                    disabled={!canEdit()}
                    className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
              
              {/* Theme */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Theme</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => theme !== 'light' && toggleTheme()}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-slate-600'
                    }`}
                  >
                    <div className="w-full h-24 bg-white border border-gray-200 rounded-lg mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">Light</p>
                  </button>
                  
                  <button
                    onClick={() => theme !== 'dark' && toggleTheme()}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-slate-600'
                    }`}
                  >
                    <div className="w-full h-24 bg-slate-800 border border-slate-600 rounded-lg mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                      </svg>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">Dark</p>
                  </button>
                </div>
              </div>

              {/* Reset Dashboard */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Dashboard Layout</h3>
                <button
                  onClick={() => {
                    resetLayout();
                    alert('Dashboard layout has been reset to defaults');
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Reset to Default Layout
                </button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-6 border-t border-gray-200 dark:border-slate-700 mt-6">
            <div className="flex items-center justify-between">
              {saved && (
                <span className="text-sm text-green-600 dark:text-green-400">
                  ✓ Settings saved successfully
                </span>
              )}
              <div className="flex gap-3 ml-auto">
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
