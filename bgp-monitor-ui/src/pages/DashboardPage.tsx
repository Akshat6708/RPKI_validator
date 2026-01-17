// ============================================
// BGP Monitor - Dashboard Page (UC-2)
// ============================================

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useDashboard, useAuth } from '../context';
import {
  PeerHealthWidget,
  ChurnSummaryWidget,
  ActiveAnomaliesWidget,
  RouteFlapRateWidget,
  MessageVolumeWidget,
  RPKIValidationWidget,
} from '../components/widgets';
import { GlobalFilterBar, TimeRangeSelector, AutoRefreshController } from '../components/common';
import type { WidgetId } from '../types';

const WIDGET_COMPONENTS: Record<WidgetId, React.FC> = {
  peerHealth: PeerHealthWidget,
  churnSummary: ChurnSummaryWidget,
  activeAnomalies: ActiveAnomaliesWidget,
  routeFlapRate: RouteFlapRateWidget,
  messageVolume: MessageVolumeWidget,
  rpkiValidation: RPKIValidationWidget,
};

export const DashboardPage: React.FC = () => {
  const { layout, isCustomizing, toggleWidget, reorderWidgets, startCustomizing, stopCustomizing, isWidgetVisible, canCustomize } = useDashboard();
  const { canEdit } = useAuth();
  const [customizeMode, setCustomizeMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      reorderWidgets(active.id as WidgetId, over.id as WidgetId);
    }
  };

  // Get sorted visible widgets
  const sortedWidgets = [...layout.widgets].sort((a, b) => a.order - b.order);
  const visibleWidgets = sortedWidgets.filter(w => w.visible);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time BGP monitoring and network health overview
          </p>
        </div>
        
        {canCustomize && (
          <button
            onClick={() => setCustomizeMode(!customizeMode)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              customizeMode
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            {customizeMode ? 'Done Customizing' : 'Customize Dashboard'}
          </button>
        )}
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

      {/* Customize Panel */}
      {customizeMode && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="font-medium text-blue-700 dark:text-blue-300">
              Customize your dashboard - drag widgets to reorder, toggle visibility below
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {sortedWidgets.map((widget) => (
              <button
                key={widget.id}
                onClick={() => toggleWidget(widget.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  widget.visible
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-slate-600'
                }`}
              >
                {widget.visible ? '✓ ' : ''}{widget.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Widgets Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visibleWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleWidgets.map((widget) => {
              const WidgetComponent = WIDGET_COMPONENTS[widget.id];
              if (!WidgetComponent) return null;
              return <WidgetComponent key={widget.id} />;
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Empty State */}
      {visibleWidgets.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No widgets visible</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            All widgets are hidden. Click "Customize Dashboard" to show some widgets.
          </p>
          {canCustomize && (
            <button
              onClick={() => setCustomizeMode(true)}
              className="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              Customize Dashboard
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
