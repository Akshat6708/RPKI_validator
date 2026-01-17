// ============================================
// BGP Monitor - Loading States Component
// ============================================

import React from 'react';
import clsx from 'clsx';

// Spinner
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-blue-500 border-t-transparent',
        sizes[size],
        className
      )}
    />
  );
};

// Full Page Loading
export const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-slate-900">
    <div className="text-center">
      <Spinner size="lg" className="mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

// Skeleton for cards
interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div
    className={clsx(
      'animate-pulse bg-gray-200 dark:bg-slate-700 rounded',
      className
    )}
  />
);

// Skeleton Card
export const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
    <Skeleton className="h-6 w-1/3 mb-4" />
    <Skeleton className="h-32 w-full mb-4" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);

// Empty State
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => (
  <div className="text-center py-12">
    {icon && (
      <div className="mx-auto h-12 w-12 text-gray-400 mb-4">{icon}</div>
    )}
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
    {description && (
      <p className="text-gray-500 dark:text-gray-400 mb-4">{description}</p>
    )}
    {action}
  </div>
);

// Error State
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div className="text-center py-12">
    <div className="mx-auto h-12 w-12 text-red-500 mb-4">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Something went wrong</h3>
    <p className="text-gray-500 dark:text-gray-400 mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Try again
      </button>
    )}
  </div>
);
