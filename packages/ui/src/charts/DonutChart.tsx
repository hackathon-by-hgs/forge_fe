'use client';

import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CHART_COLORS, CHART_PALETTE } from './theme';

export interface DonutDatum {
  name: string;
  value: number;
}

export interface DonutChartProps {
  data: readonly DonutDatum[];
  height?: number;
  centerLabel?: string;
  centerValue?: string;
  formatter?: (value: number) => string;
}

export function DonutChart({
  data,
  height = 240,
  centerLabel,
  centerValue,
  formatter,
}: DonutChartProps) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data as DonutDatum[]}
            innerRadius="60%"
            outerRadius="85%"
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${CHART_COLORS.grid}`,
              fontSize: 12,
            }}
            formatter={(value: number) => (formatter ? formatter(value) : value)}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{ fontSize: 11, color: CHART_COLORS.axis }}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
      {centerValue ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-6">
          <p className="text-2xl font-semibold text-neutral-900" data-numeric>
            {centerValue}
          </p>
          {centerLabel ? (
            <p className="text-xs text-neutral-500">{centerLabel}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
