// ============================================
// BGP Monitor - Historical Playback Page
// ============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Spinner, SeverityBadge, RPKIBadge } from '../components/common';
import { getPlaybackData } from '../api';
import type { PlaybackData, PlaybackFrame } from '../types';

export const HistoricalPlaybackPage: React.FC = () => {
  const [data, setData] = useState<PlaybackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4 | 8>(1);
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const playbackRef = useRef<NodeJS.Timeout | null>(null);

  const loadPlaybackData = useCallback(async () => {
    setLoading(true);
    const response = await getPlaybackData(new Date(startDate), new Date(endDate));
    if (response.success) {
      setData(response.data);
      setCurrentFrameIndex(0);
      setIsPlaying(false);
    }
    setLoading(false);
  }, [startDate, endDate]);

  // Playback logic
  useEffect(() => {
    if (isPlaying && data) {
      playbackRef.current = setInterval(() => {
        setCurrentFrameIndex(prev => {
          if (prev >= data.frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }

    return () => {
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, data]);

  const currentFrame: PlaybackFrame | null = data?.frames[currentFrameIndex] || null;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentFrameIndex(Number(e.target.value));
  };

  const togglePlayback = () => {
    if (currentFrameIndex >= (data?.frames.length || 0) - 1) {
      setCurrentFrameIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Historical Playback</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Replay BGP events and visualize network changes over time
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Select Playback Period</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Start</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">End</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={loadPlaybackData}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Load Data'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12">
          <div className="flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        </div>
      ) : data ? (
        <>
          {/* Playback Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-6 mb-4">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlayback}
                className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Speed Control */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Speed:</span>
                <div className="flex gap-1">
                  {([1, 2, 4, 8] as const).map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-3 py-1 text-xs font-medium rounded ${
                        playbackSpeed === speed
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Time */}
              <div className="flex-1 text-center">
                <span className="text-xl font-mono font-bold text-gray-900 dark:text-white">
                  {currentFrame?.timestamp
                    ? new Date(currentFrame.timestamp).toLocaleString()
                    : '--'}
                </span>
              </div>

              {/* Frame Counter */}
              <div className="text-sm text-gray-500">
                Frame {currentFrameIndex + 1} of {data.frames.length}
              </div>
            </div>

            {/* Timeline Slider */}
            <div className="relative">
              <input
                type="range"
                min={0}
                max={data.frames.length - 1}
                value={currentFrameIndex}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              
              {/* Event Markers */}
              <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none">
                {data.frames.map((frame, idx) => {
                  if (frame.events.some(e => e.severity === 'Critical' || e.severity === 'High')) {
                    const position = (idx / (data.frames.length - 1)) * 100;
                    return (
                      <div
                        key={idx}
                        className="absolute w-1 h-2 bg-red-500 rounded"
                        style={{ left: `${position}%` }}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>

          {/* Current Frame Data */}
          {currentFrame && (
            <div className="grid grid-cols-3 gap-6">
              {/* Metrics Panel */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Snapshot Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Active Prefixes</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {currentFrame.metrics.activePrefixes.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Active Peers</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {currentFrame.metrics.activePeers}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Announcements</span>
                    <span className="font-bold text-green-600">
                      {currentFrame.metrics.announcements}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Withdrawals</span>
                    <span className="font-bold text-red-600">
                      {currentFrame.metrics.withdrawals}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">RPKI Valid</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {currentFrame.metrics.rpkiValid}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Events Panel */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Events at this Time ({currentFrame.events.length})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {currentFrame.events.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No events at this timestamp</p>
                  ) : (
                    currentFrame.events.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <SeverityBadge severity={event.severity} />
                          <span className="text-xs text-gray-500">{event.type}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{event.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Changes Panel */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Changed Prefixes</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {currentFrame.topChangedPrefixes.map((prefix, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{prefix.prefix}</span>
                        <RPKIBadge status={prefix.rpkiStatus} />
                      </div>
                      <span className="text-sm font-medium">{prefix.changeCount} changes</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Timeline</h3>
            <Line
              data={{
                labels: data.frames.map(f => new Date(f.timestamp).toLocaleTimeString()),
                datasets: [
                  {
                    label: 'Announcements',
                    data: data.frames.map(f => f.metrics.announcements),
                    borderColor: '#22c55e',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    pointRadius: data.frames.map((_, i) => i === currentFrameIndex ? 6 : 0),
                    pointBackgroundColor: '#22c55e',
                  },
                  {
                    label: 'Withdrawals',
                    data: data.frames.map(f => f.metrics.withdrawals),
                    borderColor: '#ef4444',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    pointRadius: data.frames.map((_, i) => i === currentFrameIndex ? 6 : 0),
                    pointBackgroundColor: '#ef4444',
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' },
                  annotation: {
                    annotations: {
                      line1: {
                        type: 'line',
                        xMin: currentFrameIndex,
                        xMax: currentFrameIndex,
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                      },
                    },
                  },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
              height={200}
            />
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a Time Range</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Choose a start and end time above, then click "Load Data" to begin playback
          </p>
        </div>
      )}
    </div>
  );
};

export default HistoricalPlaybackPage;
