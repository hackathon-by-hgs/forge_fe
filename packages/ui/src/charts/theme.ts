/**
 * Shared chart styling constants. Recharts wants real color strings, not
 * Tailwind classes — these constants keep the palette consistent across
 * chart wrappers and aligned to the Forge content brand.
 */
export const CHART_COLORS = {
  accent: '#0E695F',                          // teal primary
  accentSoft: 'rgba(14, 105, 95, 0.15)',
  secondary: '#E89108',                       // amber — earnings cue
  secondarySoft: 'rgba(232, 145, 8, 0.15)',
  neutral: '#B5B0A6',
  neutralSoft: 'rgba(181, 176, 166, 0.18)',
  grid: '#E5E2DB',                            // outline
  axis: '#6B7280',                            // ink-muted
  success: '#16A34A',
  warning: '#E89108',
  danger: '#DC2626',
  info: '#2563EB',
} as const;

/**
 * Multi-series chart palette. Leads with teal (primary) and amber (secondary)
 * — the two brand colors — then falls back to harmonised supports.
 */
export const CHART_PALETTE = [
  '#0E695F',
  '#E89108',
  '#2563EB',
  '#9333EA',
  '#0EA5E9',
  '#DC2626',
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
