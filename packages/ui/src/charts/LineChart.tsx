'use client';

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_AXIS_PROPS, CHART_COLORS, CHART_GRID_PROPS, CHART_PALETTE } from './theme';

export interface LineSeries {
  key: string;
  label: string;
  color?: string;
}

export interface LineChartProps<T extends Record<string, unknown>> {
  data: readonly T[];
  xKey: keyof T;
  series: readonly LineSeries[];
  height?: number;
  yFormatter?: (value: number) => string;
  xFormatter?: (value: T[keyof T]) => string;
}

export function LineChart<T extends Record<string, unknown>>({
  data,
  xKey,
  series,
  height = 220,
  yFormatter,
  xFormatter,
}: LineChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data as T[]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? CHART_PALETTE[i % CHART_PALETTE.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
