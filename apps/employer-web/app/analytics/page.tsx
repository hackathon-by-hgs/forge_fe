'use client';

import { format } from 'date-fns';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertBanner,
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
  Skeleton,
} from '@forge/ui';
import { formatCurrency, formatNumber } from '@forge/ui/utils';
import {
  getCostByJobType,
  getDemandHeatmap,
  getLaborCostTrend,
  getRoiByType,
  getTimeToFill,
  getWorkerUtilization,
  type AnalyticsRange,
} from '../../lib/analyticsApi';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const HOURS = Array.from({ length: 24 }, (_, h) => `${h.toString().padStart(2, '0')}:00`);

export default function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>('30');

  const trendQuery = useQuery({
    queryKey: ['employer', 'analytics', 'labor-cost-trend', range],
    queryFn: () => getLaborCostTrend({ range }),
    retry: false,
  });

  const byTypeQuery = useQuery({
    queryKey: ['employer', 'analytics', 'cost-by-job-type', range],
    queryFn: () => getCostByJobType({}),
    retry: false,
  });

  const utilQuery = useQuery({
    queryKey: ['employer', 'analytics', 'worker-utilization', range],
    queryFn: () => getWorkerUtilization({}),
    retry: false,
  });

  const fillQuery = useQuery({
    queryKey: ['employer', 'analytics', 'time-to-fill', range],
    queryFn: () => getTimeToFill({}),
    retry: false,
  });

  const heatmapQuery = useQuery({
    queryKey: ['employer', 'analytics', 'demand-heatmap', range],
    queryFn: () => getDemandHeatmap({}),
    retry: false,
  });

  const roiQuery = useQuery({
    queryKey: ['employer', 'analytics', 'roi-by-type', range],
    queryFn: () => getRoiByType({}),
    retry: false,
  });

  const trendData =
    trendQuery.data?.data.map((p) => ({
      date: format(new Date(p.date), 'd MMM'),
      cost: p.costNaira,
    })) ?? [];

  const byTypeData =
    byTypeQuery.data?.data.map((p) => ({
      name: p.label,
      value: p.valueNaira,
    })) ?? [];

  const byTypeTotal = byTypeData.reduce((s, b) => s + b.value, 0);

  const utilData =
    utilQuery.data?.data.map((u) => ({
      name: u.name.split(' ')[0] ?? u.name,
      jobs: u.jobs,
    })) ?? [];

  const fillData =
    fillQuery.data?.data.map((p) => ({
      week: format(new Date(p.weekStartDate), 'd MMM'),
      minutes: p.averageMinutes,
    })) ?? [];

  const heatmapData =
    heatmapQuery.data?.data.map((c) => ({
      x: HOURS[c.hour] ?? `${c.hour}:00`,
      y: DAYS[c.dayOfWeek] ?? `D${c.dayOfWeek}`,
      value: c.jobs,
    })) ?? [];

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Trends, demand, and cost-effectiveness across your hiring activity."
        actions={
          <Select
            aria-label="Range"
            options={[
              { label: 'Last 7 days', value: '7' },
              { label: 'Last 30 days', value: '30' },
              { label: 'Last 90 days', value: '90' },
            ]}
            value={range}
            onChange={(e) => setRange(e.target.value as AnalyticsRange)}
            className="w-44"
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Labor cost trend</CardTitle>
            <span className="text-xs text-neutral-500">
              Daily, last {range} days
            </span>
          </CardHeader>
          <CardBody>
            {trendQuery.isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : trendQuery.isError ? (
              <AlertBanner
                tone="danger"
                title="Couldn’t load trend"
                description={
                  trendQuery.error instanceof Error
                    ? trendQuery.error.message
                    : 'Unknown'
                }
                action={
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void trendQuery.refetch()}
                  >
                    Retry
                  </Button>
                }
              />
            ) : trendData.length === 0 ? (
              <p className="py-10 text-center text-sm text-neutral-500">
                No spend yet in this window.
              </p>
            ) : (
              <AreaChart
                data={trendData}
                xKey="date"
                yKey="cost"
                height={260}
                yFormatter={(v) => formatCurrency(v, { compact: true })}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost by job type</CardTitle>
          </CardHeader>
          <CardBody>
            {byTypeQuery.isLoading ? (
              <Skeleton className="h-[260px] w-full rounded-full" />
            ) : byTypeQuery.isError ? (
              <AlertBanner
                tone="danger"
                title="Couldn’t load breakdown"
                description={
                  byTypeQuery.error instanceof Error
                    ? byTypeQuery.error.message
                    : 'Unknown'
                }
              />
            ) : byTypeData.length === 0 ? (
              <p className="py-10 text-center text-sm text-neutral-500">
                No completed-job spend in this window.
              </p>
            ) : (
              <DonutChart
                data={byTypeData}
                centerLabel="This window"
                centerValue={formatCurrency(byTypeTotal, { compact: true })}
                formatter={(v) => formatCurrency(v, { compact: true })}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Worker utilization</CardTitle>
            <span className="text-xs text-neutral-500">Top 8 by jobs hired</span>
          </CardHeader>
          <CardBody>
            {utilQuery.isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : utilQuery.isError ? (
              <AlertBanner
                tone="danger"
                title="Couldn’t load utilization"
                description={
                  utilQuery.error instanceof Error
                    ? utilQuery.error.message
                    : 'Unknown'
                }
              />
            ) : utilData.length === 0 ? (
              <p className="py-10 text-center text-sm text-neutral-500">
                No workers hired in this window.
              </p>
            ) : (
              <BarChart
                data={utilData}
                xKey="name"
                yKey="jobs"
                height={260}
                yFormatter={(v) => formatNumber(v)}
              />
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Time to fill</CardTitle>
            <span className="text-xs text-neutral-500">
              Minutes from post to first application, weekly
            </span>
          </CardHeader>
          <CardBody>
            {fillQuery.isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : fillQuery.isError ? (
              <AlertBanner
                tone="danger"
                title="Couldn’t load time-to-fill"
                description={
                  fillQuery.error instanceof Error
                    ? fillQuery.error.message
                    : 'Unknown'
                }
              />
            ) : fillData.length === 0 ? (
              <p className="py-10 text-center text-sm text-neutral-500">
                Not enough applied-to jobs in this window.
              </p>
            ) : (
              <LineChart
                data={fillData}
                xKey="week"
                series={[{ key: 'minutes', label: 'Minutes' }]}
                height={260}
                yFormatter={(v) => `${v}m`}
              />
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Demand heatmap</CardTitle>
            <span className="text-xs text-neutral-500">
              Jobs posted by day-of-week × hour (UTC)
            </span>
          </CardHeader>
          <CardBody>
            {heatmapQuery.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : heatmapQuery.isError ? (
              <AlertBanner
                tone="danger"
                title="Couldn’t load heatmap"
                description={
                  heatmapQuery.error instanceof Error
                    ? heatmapQuery.error.message
                    : 'Unknown'
                }
              />
            ) : heatmapData.length === 0 ? (
              <p className="py-10 text-center text-sm text-neutral-500">
                No jobs posted in this window.
              </p>
            ) : (
              <Heatmap data={heatmapData} xLabels={HOURS} yLabels={DAYS} />
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>ROI by job type</CardTitle>
          </CardHeader>
          <CardBody className="overflow-x-auto p-0">
            {roiQuery.isLoading ? (
              <div className="p-4">
                <Skeleton className="h-24 w-full" />
              </div>
            ) : roiQuery.isError ? (
              <div className="p-4">
                <AlertBanner
                  tone="danger"
                  title="Couldn’t load ROI"
                  description={
                    roiQuery.error instanceof Error
                      ? roiQuery.error.message
                      : 'Unknown'
                  }
                />
              </div>
            ) : (roiQuery.data?.data ?? []).length === 0 ? (
              <p className="py-10 text-center text-sm text-neutral-500">
                No completed jobs in this window.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-outline bg-surface-container-high">
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
                  {(roiQuery.data?.data ?? []).map((r) => (
                    <tr key={r.type}>
                      <td className="px-4 py-2.5 font-medium text-neutral-900">
                        {r.label}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums" data-numeric>
                        {r.jobs}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums" data-numeric>
                        {formatCurrency(r.avgCostNaira)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums" data-numeric>
                        {r.avgFillTimeMinutes} min
                      </td>
                      <td className="px-4 py-2.5 tabular-nums" data-numeric>
                        {(r.completionRate * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
