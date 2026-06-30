import { Download, Search } from "lucide-react";

import type { ResultStatusFilter, VerificationResultRow, VerificationStatus } from "../types/results";
import { Button } from "./Button";
import { StatusBadge } from "./StatusBadge";

type ResultsTableProps = {
  rows: VerificationResultRow[];
  query: string;
  statusFilter: ResultStatusFilter;
  onQueryChange: (query: string) => void;
  onStatusFilterChange: (status: ResultStatusFilter) => void;
  onExport: () => void;
  isExporting?: boolean;
  canExport?: boolean;
};

const filters: ResultStatusFilter[] = ["All", "Valid", "Bounce", "Catch-All", "Unknown/Error"];

export const ResultsTable = ({
  rows,
  query,
  statusFilter,
  onQueryChange,
  onStatusFilterChange,
  onExport,
  isExporting = false,
  canExport = true
}: ResultsTableProps) => {
  return (
    <section className="overflow-hidden rounded-md border border-ink-100 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-ink-100 p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search email, domain, MX host, or detail"
            className="min-h-10 w-full rounded-md border border-ink-100 bg-ink-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-ink-300 focus:bg-white"
          />
        </label>
        <div className="flex gap-1 overflow-x-auto">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onStatusFilterChange(filter)}
              className={[
                "min-h-10 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition",
                statusFilter === filter ? "bg-ink-900 text-white" : "bg-ink-50 text-ink-700 hover:bg-ink-100"
              ].join(" ")}
            >
              {filter}
            </button>
          ))}
        </div>
        <Button type="button" variant="secondary" onClick={onExport} disabled={!canExport || isExporting}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {isExporting ? "Exporting" : "Export CSV"}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[980px] divide-y divide-ink-100 text-sm">
          <thead className="bg-ink-50 text-left text-xs font-semibold uppercase text-ink-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Domain</th>
              <th className="px-4 py-3">MX Host</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((row) => (
              <tr key={row.id} className="transition hover:bg-ink-50/70">
                <td className="px-4 py-3 font-medium text-ink-900">{row.email}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-ink-700">{row.stage}</td>
                <td className="px-4 py-3 text-ink-500">{row.domain}</td>
                <td className="px-4 py-3 text-ink-500">{row.mxHost}</td>
                <td className="px-4 py-3 text-ink-500">{row.responseCode ?? "-"}</td>
                <td className="px-4 py-3 text-ink-500">{row.detail}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-500">
                  No results match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export const matchesStatus = (row: VerificationResultRow, status: ResultStatusFilter): boolean => {
  return status === "All" || row.status === (status as VerificationStatus);
};
