import { Gauge, Network, Timer } from "lucide-react";

import { MetricCard } from "../components/MetricCard";

export const SettingsPage = () => {
  return (
    <div className="grid gap-6">
      <section className="rounded-md border border-ink-100 bg-white p-5 shadow-panel">
        <p className="text-sm font-semibold uppercase text-signal-blue">Runtime Profile</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink-900">Verification settings</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
          These controls mirror backend configuration and are ready for a settings API when the deployment phase is connected.
        </p>
      </section>
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Concurrency" value="25" tone="blue" icon={<Gauge className="h-4 w-4" />} />
        <MetricCard label="DNS Timeout" value="10s" tone="amber" icon={<Timer className="h-4 w-4" />} />
        <MetricCard label="SMTP Port" value="25" icon={<Network className="h-4 w-4" />} />
      </div>
    </div>
  );
};
