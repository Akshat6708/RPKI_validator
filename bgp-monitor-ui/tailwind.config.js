/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // BGP-specific semantic colors
        bgp: {
          valid: '#10b981',
          invalid: '#ef4444',
          unknown: '#6b7280',
          healthy: '#22c55e',
          unhealthy: '#dc2626',
          warning: '#f59e0b',
        },
        // Severity colors
        severity: {
          critical: '#dc2626',
          high: '#f97316',
          elevated: '#f59e0b',
          info: '#3b82f6',
        },
      },
    },
  },
  plugins: [],
};
