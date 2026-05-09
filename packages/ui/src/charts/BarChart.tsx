'use client';

import {
  Bar,
  CartesianGrid,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_AXIS_PROPS, CHART_COLORS, CHART_GRID_PROPS } from './theme';

export interface BarChartProps<T extends Record<string, unknown>> {
  data: readonly T[];
  xKey: keyof T;
  yKey: keyof T;
  height?: number;
  yFormatter?: (value: number) => string;
  layout?: 'horizontal' | 'vertical';
}

export function BarChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKey,
  height = 220,
  yFormatter,
  layout = 'horizontal',
}: BarChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data as T[]}
        layout={layout}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid {...CHART_GRID_PROPS} vertical={layout === 'vertical'} />
        {layout === 'horizontal' ? (
          <>
            <XAxis dataKey={xKey as string} {...CHART_AXIS_PROPS} />
            <YAxis {...CHART_AXIS_PROPS} tickFormatter={yFormatter} width={60} />
          </>
        ) : (
          <>
            <XAxis type="number" {...CHART_AXIS_PROPS} tickFormatter={yFormatter} />
            <YAxis dataKey={xKey as string} type="category" {...CHART_AXIS_PROPS} width={120} />
          </>
        )}
        <Tooltip
          cursor={{ fill: CHART_COLORS.neutralSoft }}
          contentStyle={{
            borderRadius: 8,
            border: `1px solid ${CHART_COLORS.grid}`,
            fontSize: 12,
          }}
          formatter={(value: number) => (yFormatter ? yFormatter(value) : value)}
        />
        <Bar dataKey={yKey as string} fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
