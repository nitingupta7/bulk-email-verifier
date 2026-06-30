import { Pause, Play, RefreshCw } from "lucide-react";

import { Button } from "./Button";

type ProgressPanelProps = {
  completed: number;
  total: number;
  isRunning: boolean;
  onToggle: () => void;
  onRefresh: () => void;
};

export const ProgressPanel = ({ completed, total, isRunning, onToggle, onRefresh }: ProgressPanelProps) => {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <section className="rounded-md border border-ink-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-signal-blue">Live Progress</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-ink-900">{percent}% complete</h2>
          <p className="mt-1 text-sm text-ink-500">
            {completed} of {total} addresses processed
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={onToggle}>
            {isRunning ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
            {isRunning ? "Pause Polling" : "Resume Polling"}
          </Button>
          <Button type="button" variant="ghost" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full bg-ink-900 transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
};
