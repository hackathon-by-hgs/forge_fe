import { cn } from '../utils/cn';

export interface HeatmapCell {
  x: string;
  y: string;
  value: number;
}

export interface HeatmapProps {
  data: readonly HeatmapCell[];
  xLabels: readonly string[];
  yLabels: readonly string[];
  className?: string;
}

/**
 * Lightweight day×hour or category×category heatmap.
 * Color scales linearly from accent-50 to accent-600 based on value vs. max.
 */
export function Heatmap({ data, xLabels, yLabels, className }: HeatmapProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const map = new Map(data.map((d) => [`${d.x}__${d.y}`, d.value]));

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="w-10" />
            {xLabels.map((x) => (
              <th
                key={x}
                className="px-1 text-[10px] font-medium uppercase text-neutral-400"
              >
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {yLabels.map((y) => (
            <tr key={y}>
              <th className="pr-2 text-right text-[10px] font-medium text-neutral-400">
                {y}
              </th>
              {xLabels.map((x) => {
                const value = map.get(`${x}__${y}`) ?? 0;
                const intensity = value / max;
                return (
                  <td key={x} className="p-0">
                    <div
                      className="h-7 w-7 rounded-md"
                      style={{
                        backgroundColor:
                          intensity === 0
                            ? '#F5F5F5'
                            : `rgba(16, 185, 129, ${0.15 + intensity * 0.7})`,
                      }}
                      title={`${y} ${x}: ${value}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
