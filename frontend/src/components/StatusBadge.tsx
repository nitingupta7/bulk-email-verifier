type StatusBadgeProps = {
  status: "Valid" | "Bounce" | "Catch-All" | "Unknown/Error" | "Pending";
};

const styles = {
  Valid: "bg-emerald-50 text-signal-green ring-emerald-200",
  Bounce: "bg-red-50 text-signal-red ring-red-200",
  "Catch-All": "bg-amber-50 text-signal-amber ring-amber-200",
  "Unknown/Error": "bg-slate-100 text-slate-700 ring-slate-200",
  Pending: "bg-blue-50 text-signal-blue ring-blue-200"
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[status]}`}>
      {status}
    </span>
  );
};
