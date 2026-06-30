import type { VerificationStatus } from "../types/results";

type StatusCount = {
  status: VerificationStatus;
  count: number;
  color: string;
};

type StatusChartsProps = {
  counts: StatusCount[];
  total: number;
};

export const StatusCharts = ({ counts, total }: StatusChartsProps) => {
  const segments = buildConicSegments(counts, total);
  const topCount = Math.max(...counts.map((item) => item.count), 1);

  return (
    <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-md border border-ink-100 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink-900">Status Mix</h2>
        <div className="mt-5 flex items-center gap-5">
          <div
            className="grid h-36 w-36 shrink-0 place-items-center rounded-full"
            style={{ background: segments }}
            aria-label="Status distribution chart"
          >
            <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center shadow-sm">
              <span className="text-2xl font-semibold text-ink-900">{total}</span>
            </div>
          </div>
          <div className="grid gap-2">
            {counts.map((item) => (
              <div key={item.status} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                <span className="min-w-24 text-ink-500">{item.status}</span>
                <span className="font-semibold text-ink-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-md border border-ink-100 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink-900">Verification Volume</h2>
        <div className="mt-5 grid gap-4">
          {counts.map((item) => (
            <div key={item.status} className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-ink-700">{item.status}</span>
                <span className="text-ink-500">{item.count}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(item.count / topCount) * 100}%`, background: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const buildConicSegments = (counts: StatusCount[], total: number): string => {
  if (total === 0) {
    return "#e8ece8";
  }

  let cursor = 0;
  const parts = counts.map((item) => {
    const start = cursor;
    const end = cursor + (item.count / total) * 360;
    cursor = end;
    return `${item.color} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${parts.join(", ")})`;
};
