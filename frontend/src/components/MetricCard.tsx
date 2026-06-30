import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: "neutral" | "green" | "red" | "amber" | "blue";
};

const tones = {
  neutral: "bg-ink-100 text-ink-700",
  green: "bg-emerald-50 text-signal-green",
  red: "bg-red-50 text-signal-red",
  amber: "bg-amber-50 text-signal-amber",
  blue: "bg-blue-50 text-signal-blue"
};

export const MetricCard = ({ label, value, icon, tone = "neutral" }: MetricCardProps) => {
  return (
    <section className="rounded-md border border-ink-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${tones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-normal text-ink-900">{value}</p>
    </section>
  );
};
