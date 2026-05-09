'use client';

import {
  Area,
  CartesianGrid,
  AreaChart as RechartsAreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_AXIS_PROPS, CHART_COLORS, CHART_GRID_PROPS } from './theme';

export interface AreaChartProps<T extends Record<string, unknown>> {
  data: readonly T[];
  xKey: keyof T;
  yKey: keyof T;
  height?: number;
  yFormatter?: (value: number) => string;
  xFormatter?: (value: T[keyof T]) => string;
}

export function AreaChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKey,
  height = 220,
  yFormatter,
  xFormatter,
}: AreaChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data as T[]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...CHART_GRID_PROPS} />
        <XAxis
          dataKey={xKey as string}
          {...CHART_AXIS_PROPS}
          tickFormatter={xFormatter as (v: unknown) => string}
        />
        <YAxis {...CHART_AXIS_PROPS} tickFormatter={yFormatter} width={60} />
        <Tooltip
          cursor={{ stroke: CHART_COLORS.neutral, strokeDasharray: '3 3' }}
          contentStyle={{
            borderRadius: 8,
            border: `1px solid ${CHART_COLORS.grid}`,
            fontSize: 12,
          }}
          formatter={(value: number) => (yFormatter ? yFormatter(value) : value)}
        />
        <Area
          type="monotone"
          dataKey={yKey as string}
          stroke={CHART_COLORS.accent}
          strokeWidth={2}
          fill="url(#areaGradient)"
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
