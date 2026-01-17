// ============================================
// BGP Monitor - Global Filter Bar Component
// ============================================

import React, { useState } from 'react';
import { useFilters } from '../../context';
import type { IPVersion } from '../../types';

// Icons
const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface GlobalFilterBarProps {
  showTenant?: boolean;
  showRegion?: boolean;
  showPrefix?: boolean;
  showAsn?: boolean;
  showIpVersion?: boolean;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  showTenant = true,
  showRegion = true,
  showPrefix = true,
  showAsn = true,
  showIpVersion = true,
}) => {
  const { filters, setTenant, setRegion, setPrefix, setPeerAsn, setIpVersion, resetFilters } = useFilters();
  const [localPrefix, setLocalPrefix] = useState(filters.prefix || '');
  const [localAsn, setLocalAsn] = useState(filters.peerAsn?.toString() || '');

  const handlePrefixSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPrefix(localPrefix || undefined);
  };

  const handleAsnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const asn = parseInt(localAsn);
    setPeerAsn(isNaN(asn) ? undefined : asn);
  };

  const hasActiveFilters = filters.tenant || filters.region || filters.prefix || filters.peerAsn || filters.ipVersion !== 'Both';

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <FilterIcon />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <XIcon />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Tenant/Region Dropdown */}
        {showTenant && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Tenant
            </label>
            <select
              value={filters.tenant || ''}
              onChange={(e) => setTenant(e.target.value || undefined)}
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 
                         rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 
                         focus:border-transparent dark:text-white"
            >
              <option value="">All Tenants</option>
              <option value="tenant-1">Production</option>
              <option value="tenant-2">Staging</option>
              <option value="tenant-3">Development</option>
            </select>
          </div>
        )}

        {showRegion && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Region
            </label>
            <select
              value={filters.region || ''}
              onChange={(e) => setRegion(e.target.value || undefined)}
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 
                         rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 
                         focus:border-transparent dark:text-white"
            >
              <option value="">All Regions</option>
              <option value="us-east">US East</option>
              <option value="us-west">US West</option>
              <option value="eu-west">EU West</option>
              <option value="ap-south">AP South</option>
            </select>
          </div>
        )}

        {/* ASN Input */}
        {showAsn && (
          <form onSubmit={handleAsnSubmit}>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Peer/ASN
            </label>
            <input
              type="text"
              value={localAsn}
              onChange={(e) => setLocalAsn(e.target.value)}
              placeholder="e.g., 13335"
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 
                         rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 
                         focus:border-transparent dark:text-white placeholder-gray-400"
            />
          </form>
        )}

        {/* Prefix Input */}
        {showPrefix && (
          <form onSubmit={handlePrefixSubmit}>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Prefix
            </label>
            <input
              type="text"
              value={localPrefix}
              onChange={(e) => setLocalPrefix(e.target.value)}
              placeholder="e.g., 1.1.1.0/24"
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 
                         rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 
                         focus:border-transparent dark:text-white placeholder-gray-400"
            />
          </form>
        )}

        {/* IP Version Toggle */}
        {showIpVersion && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              IP Version
            </label>
            <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-slate-600">
              {(['Both', 'IPv4', 'IPv6'] as IPVersion[]).map((version) => (
                <button
                  key={version}
                  onClick={() => setIpVersion(version)}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors
                    ${filters.ipVersion === version
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                    }`}
                >
                  {version}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
