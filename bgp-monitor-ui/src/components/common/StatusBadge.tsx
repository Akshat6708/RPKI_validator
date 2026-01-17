// ============================================
// BGP Monitor - Status Badge Component
// ============================================

import React from 'react';
import clsx from 'clsx';
import type { RPKIStatus, Severity, PeerStatus, FlapStatus, SessionState } from '../../types';

// --- Generic Badge ---
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};

// --- RPKI Status Badge ---
interface RPKIBadgeProps {
  status: RPKIStatus;
  size?: 'sm' | 'md';
}

export const RPKIBadge: React.FC<RPKIBadgeProps> = ({ status, size = 'sm' }) => {
  const config: Record<RPKIStatus, { variant: BadgeProps['variant']; label: string }> = {
    valid: { variant: 'success', label: 'Valid' },
    invalid: { variant: 'error', label: 'Invalid' },
    'not-found': { variant: 'warning', label: 'Not Found' },
    unknown: { variant: 'neutral', label: 'Unknown' },
  };

  const { variant, label } = config[status];

  return (
    <Badge variant={variant} size={size}>
      <span className={clsx(
        'w-1.5 h-1.5 rounded-full mr-1.5',
        variant === 'success' && 'bg-green-500',
        variant === 'error' && 'bg-red-500',
        variant === 'warning' && 'bg-yellow-500',
        variant === 'neutral' && 'bg-gray-500',
      )} />
      {label}
    </Badge>
  );
};

// --- Severity Badge ---
interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'sm' }) => {
  const config: Record<Severity, { variant: BadgeProps['variant']; label: string }> = {
    Critical: { variant: 'error', label: 'Critical' },
    High: { variant: 'warning', label: 'High' },
    Elevated: { variant: 'info', label: 'Elevated' },
    Info: { variant: 'neutral', label: 'Info' },
  };

  const { variant, label } = config[severity];

  return <Badge variant={variant} size={size}>{label}</Badge>;
};

// --- Peer Status Badge ---
interface PeerStatusBadgeProps {
  status: PeerStatus;
  size?: 'sm' | 'md';
}

export const PeerStatusBadge: React.FC<PeerStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config: Record<PeerStatus, { variant: BadgeProps['variant']; label: string }> = {
    healthy: { variant: 'success', label: 'Healthy' },
    unhealthy: { variant: 'error', label: 'Unhealthy' },
    unknown: { variant: 'neutral', label: 'Unknown' },
  };

  const { variant, label } = config[status];

  return <Badge variant={variant} size={size}>{label}</Badge>;
};

// --- Flap Status Badge ---
interface FlapStatusBadgeProps {
  status: FlapStatus;
  size?: 'sm' | 'md';
}

export const FlapStatusBadge: React.FC<FlapStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config: Record<FlapStatus, { variant: BadgeProps['variant']; label: string }> = {
    Stable: { variant: 'success', label: 'Stable' },
    Inconsistent: { variant: 'warning', label: 'Inconsistent' },
    Flapping: { variant: 'error', label: 'Flapping' },
  };

  const { variant, label } = config[status];

  return <Badge variant={variant} size={size}>{label}</Badge>;
};

// --- Session State Badge ---
interface SessionStateBadgeProps {
  state: SessionState;
  size?: 'sm' | 'md';
}

export const SessionStateBadge: React.FC<SessionStateBadgeProps> = ({ state, size = 'sm' }) => {
  const isEstablished = state === 'Established';
  
  return (
    <Badge variant={isEstablished ? 'success' : 'warning'} size={size}>
      {state}
    </Badge>
  );
};
