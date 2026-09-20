'use client';

type ChartDatum = {
  label?: string;
  name?: string;
  value?: number;
  average?: number;
  attempts?: number;
};

const PALETTE = ['#2B317F', '#F9A51A', '#10B981', '#3B82F6', '#EF4444', '#9CA3AF'];

function EmptyChart() {
  return <div className="flex h-52 items-center justify-center text-sm text-text-secondary">No data available yet</div>;
}

export function LineChart({
  title,
  description,
  data,
  valueKey = 'value',
  suffix = '',
}: {
  title: string;
  description?: string;
  data: ChartDatum[];
  valueKey?: 'value' | 'average' | 'attempts';
  suffix?: string;
}) {
  const values = data.map((item) => Number(item[valueKey] || 0));
  const max = Math.max(100, ...values, 1);
  const points = data.map((item, index) => {
    const x = data.length === 1 ? 300 : 42 + (index * 516) / Math.max(data.length - 1, 1);
    const y = 178 - (Number(item[valueKey] || 0) / max) * 138;
    return { x, y, item };
  });

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      {!data.length ? <EmptyChart /> : (
        <div className="mt-4 overflow-hidden">
          <svg viewBox="0 0 600 220" className="h-56 w-full" role="img" aria-label={title}>
            {[40, 86, 132, 178].map((y) => (
              <line key={y} x1="42" x2="558" y1={y} y2={y} stroke="#E5E7EB" strokeWidth="1" />
            ))}
            <polyline
              points={points.map(({ x, y }) => `${x},${y}`).join(' ')}
              fill="none"
              stroke="#2B317F"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map(({ x, y, item }, index) => (
              <g key={`${item.label}-${index}`}>
                <circle cx={x} cy={y} r="5" fill="#FFFFFF" stroke="#2B317F" strokeWidth="3" />
                <text x={x} y={Math.max(y - 13, 20)} textAnchor="middle" fontSize="11" fill="#111827">
                  {Number(item[valueKey] || 0)}{suffix}
                </text>
                <text x={x} y="207" textAnchor="middle" fontSize="11" fill="#6B7280">{item.label}</text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </section>
  );
}

export function HorizontalBarChart({
  title,
  description,
  data,
  valueKey = 'value',
  suffix = '',
}: {
  title: string;
  description?: string;
  data: ChartDatum[];
  valueKey?: 'value' | 'average' | 'attempts';
  suffix?: string;
}) {
  const max = Math.max(...data.map((item) => Number(item[valueKey] || 0)), 1);

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      {!data.length ? <EmptyChart /> : (
        <div className="mt-6 space-y-4">
          {data.map((item, index) => {
            const value = Number(item[valueKey] || 0);
            return (
              <div key={`${item.name}-${index}`}>
                <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                  <span className="truncate font-medium text-text-primary">{item.name}</span>
                  <span className="shrink-0 text-text-secondary">{value}{suffix}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-brand-indigo"
                    style={{ width: `${Math.max((value / max) * 100, value ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function DonutChart({ title, description, data }: { title: string; description?: string; data: ChartDatum[] }) {
  const filtered = data.filter((item) => Number(item.value || 0) > 0);
  const total = filtered.reduce((sum, item) => sum + Number(item.value || 0), 0);
  let cursor = 0;
  const gradient = filtered.map((item, index) => {
    const start = cursor;
    cursor += (Number(item.value || 0) / total) * 100;
    return `${PALETTE[index % PALETTE.length]} ${start}% ${cursor}%`;
  }).join(', ');

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      {!total ? <EmptyChart /> : (
        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <div
            className="relative h-36 w-36 shrink-0 rounded-full"
            style={{ background: `conic-gradient(${gradient})` }}
            role="img"
            aria-label={`${title}: ${total} total`}
          >
            <div className="absolute inset-7 flex items-center justify-center rounded-full bg-card text-center">
              <div><strong className="block text-2xl text-text-primary">{total}</strong><span className="text-xs text-text-secondary">Total</span></div>
            </div>
          </div>
          <div className="w-full space-y-2.5">
            {filtered.map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-text-secondary">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PALETTE[index % PALETTE.length] }} />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-semibold text-text-primary">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
