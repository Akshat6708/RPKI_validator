// ============================================
// BGP Monitor - Widget Container Component
// ============================================

import React from 'react';
import clsx from 'clsx';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDashboard } from '../../context';
import type { WidgetId } from '../../types';

// Icons
const GripIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

interface WidgetContainerProps {
  id: WidgetId;
  title: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  error?: string | null;
  headerAction?: React.ReactNode;
  colSpan?: 1 | 2 | 3;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  id,
  title,
  children,
  className,
  loading = false,
  error = null,
  headerAction,
  colSpan = 1,
}) => {
  const { isCustomizing, toggleWidget, isWidgetVisible } = useDashboard();
  const visible = isWidgetVisible(id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isCustomizing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const colSpanClass = {
    1: 'col-span-1',
    2: 'lg:col-span-2',
    3: 'lg:col-span-3',
  };

  if (!visible && !isCustomizing) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl',
        'transition-all duration-200',
        colSpanClass[colSpan],
        isDragging && 'opacity-50 shadow-2xl z-50',
        !visible && 'opacity-50',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          {isCustomizing && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
            >
              <GripIcon />
            </button>
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {headerAction}
          {isCustomizing && (
            <button
              onClick={() => toggleWidget(id)}
              className={clsx(
                'p-1.5 rounded-md transition-colors',
                visible
                  ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
              )}
            >
              {visible ? <EyeIcon /> : <EyeOffIcon />}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

// Simple Card without drag-and-drop
interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className,
  headerAction,
}) => (
  <div
    className={clsx(
      'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl',
      className
    )}
  >
    {title && (
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {headerAction}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);
