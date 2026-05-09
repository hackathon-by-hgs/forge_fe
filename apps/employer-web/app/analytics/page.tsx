'use client';

import { format, subDays } from 'date-fns';
import {
  AreaChart,
  BarChart,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DonutChart,
  Heatmap,
  LineChart,
  PageHeader,
  Select,
} from '@forge/ui';
import { formatCurrency, formatNumber } from '@forge/ui/utils';
import { MOCK_JOBS, MOCK_WORKERS } from '@forge/mock-data';

const HOURS = Array.from({ length: 12 }, (_, i) => `${i + 6}:00`);
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function buildHeatmapData() {
  const cells = [] as { x: string; y: string; value: number }[];
  for (const day of DAYS) {
    for (const hour of HOURS) {
      const dayWeight = day === 'Sat' || day === 'Sun' ? 0.4 : 1;
      const hourWeight = hour === '8:00' || hour === '14:00' ? 1.5 : 0.8;
      cells.push({
        x: hour,
        y: day,
        value: Math.round(Math.random() * 12 * dayWeight * hourWeight),
      });
    }
  }
  return cells;
}

export default function AnalyticsPage() {
  const today = new Date();
  const trend = Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(today, 29 - i), 'd MMM'),
    cost: Math.round(80_000 + Math.sin(i / 4) * 30_000 + i * 1500),
  }));

  const byType = [
    { name: 'Loaders', value: 4_200_000 },
    { name: 'Drivers', value: 2_800_000 },
    { name: 'Unloaders', value: 1_600_000 },
    { name: 'General', value: 900_000 },
  ];

  const utilization = [...MOCK_WORKERS]
    .sort((a, b) => b.jobsCompleted - a.jobsCompleted)
    .slice(0, 8)
    .map((w) => ({ name: w.fullName.split(' ')[0] ?? '', jobs: w.jobsCompleted }));

  const timeToFill = Array.from({ length: 12 }, (_, i) => ({
    week: `W${i + 1}`,
    minutes: Math.round(8 + Math.sin(i / 2) * 3),
  }));

  const heatmap = buildHeatmapData();

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Trends, demand, and cost-effectiveness across your hiring activity."
        actions={
          <>
            <Select
              aria-label="Range"
              options={[
                { label: 'Last 7 days', value: '7' },
                { label: 'Last 30 days', value: '30' },
                { label: 'Last 90 days', value: '90' },
              ]}
              defaultValue="30"
              className="w-44"
            />
            <Button variant="secondary">Export</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Labor cost trend</CardTitle>
            <span className="text-xs text-neutral-500">Daily, last 30 days</span>
          </CardHeader>
          <CardBody>
            <AreaChart
              data={trend}
              xKey="date"
              yKey="cost"
              height={260}
              yFormatter={(v) => formatCurrency(v, { compact: true })}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost by job type</CardTitle>
          </CardHeader>
          <CardBody>
            <DonutChart
              data={byType}
              centerLabel="This month"
              centerValue={formatCurrency(
                byType.reduce((s, b) => s + b.value, 0),
                { compact: true },
              )}
              formatter={(v) => formatCurrency(v, { compact: true })}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Worker utilization</CardTitle>
            <span className="text-xs text-neutral-500">Top 8 by jobs hired</span>
          </CardHeader>
          <CardBody>
            <BarChart
              data={utilization}
              xKey="name"
              yKey="jobs"
              height={260}
              yFormatter={(v) => formatNumber(v)}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Time to fill</CardTitle>
            <span className="text-xs text-neutral-500">
              Minutes from post to acceptance, weekly
            </span>
          </CardHeader>
          <CardBody>
            <LineChart
              data={timeToFill}
              xKey="week"
              series={[{ key: 'minutes', label: 'Minutes' }]}
              height={260}
              yFormatter={(v) => `${v}m`}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Demand heatmap</CardTitle>
            <span className="text-xs text-neutral-500">Day of week × hour of day</span>
          </CardHeader>
          <CardBody>
            <Heatmap data={heatmap} xLabels={HOURS} yLabels={DAYS} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>ROI by job type</CardTitle>
          </CardHeader>
          <CardBody className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50/60">
                <tr>
                  {['Type', 'Jobs', 'Avg cost', 'Avg fill time', 'Completion rate'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-neutral-500"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {[
                  { type: 'Loader', jobs: 87, avgCost: 5800, fill: 7, completion: 0.96 },
                  { type: 'Driver', jobs: 41, avgCost: 9200, fill: 12, completion: 0.94 },
                  { type: 'Unloader', jobs: 34, avgCost: 5300, fill: 9, completion: 0.97 },
                  { type: 'General', jobs: 22, avgCost: 4100, fill: 14, completion: 0.92 },
                ].map((r) => (
                  <tr key={r.type}>
                    <td className="px-4 py-2.5 font-medium text-neutral-900">{r.type}</td>
                    <td className="px-4 py-2.5 tabular-nums" data-numeric>
                      {r.jobs}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums" data-numeric>
                      {formatCurrency(r.avgCost)}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums" data-numeric>
                      {r.fill} min
                    </td>
                    <td className="px-4 py-2.5 tabular-nums" data-numeric>
                      {(r.completion * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
