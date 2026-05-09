/**
 * Shared chart styling constants. The accent color is provided per-app via
 * the Tailwind preset, so charts read CSS variables to stay theme-aware.
 *
 * Recharts wants real color strings, not Tailwind classes — these constants
 * keep the palette consistent across chart wrappers.
 */
export const CHART_COLORS = {
  accent: '#10B981',
  accentSoft: 'rgba(16, 185, 129, 0.15)',
  neutral: '#A3A3A3',
  neutralSoft: 'rgba(163, 163, 163, 0.15)',
  grid: '#E5E5E5',
  axis: '#737373',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#2563EB',
} as const;

export const CHART_PALETTE = [
  '#10B981',
  '#3B82F6',
  '#F59E0B',
  '#A855F7',
  '#EC4899',
  '#14B8A6',
] as const;

export const CHART_GRID_PROPS = {
  stroke: CHART_COLORS.grid,
  strokeDasharray: '3 3',
  vertical: false,
} as const;

export const CHART_AXIS_PROPS = {
  stroke: CHART_COLORS.axis,
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;
