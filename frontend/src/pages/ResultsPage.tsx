import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Activity, AlertCircle, Clock, Loader2, MailCheck, ShieldAlert, ShieldQuestion, UploadCloud } from "lucide-react";

import { Button } from "../components/Button";
import { MetricCard } from "../components/MetricCard";
import { ProgressPanel } from "../components/ProgressPanel";
import { ResultsTable, matchesStatus } from "../components/ResultsTable";
import { StatusCharts } from "../components/StatusCharts";
import { downloadVerificationCsv, getVerificationJob } from "../services/api";
import type { VerificationJobSnapshot } from "../types/api";
import type { ResultStatusFilter, VerificationStatus } from "../types/results";

const statusColors: Record<VerificationStatus, string> = {
  Valid: "#1f8a5f",
  Bounce: "#c0473b",
  "Catch-All": "#cc7a1a",
  "Unknown/Error": "#64748b"
};

export const ResultsPage = () => {
  const [searchParams] = useSearchParams();
  const urlJobId = searchParams.get("jobId");
  const storedJobId = window.localStorage.getItem("latestVerificationJobId");
  const jobId = urlJobId ?? storedJobId;
  const [job, setJob] = useState<VerificationJobSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(Boolean(jobId));
  const [isExporting, setIsExporting] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ResultStatusFilter>("All");

  const loadJob = useCallback(async () => {
    if (!jobId) {
      return;
    }

    try {
      const snapshot = await getVerificationJob(jobId);
      setJob(snapshot);
      setError(snapshot.error);
      if (snapshot.status === "completed" || snapshot.status === "failed") {
        setIsPolling(false);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not load verification progress.");
      setIsPolling(false);
    }
  }, [jobId]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  useEffect(() => {
    if (!isPolling || !jobId) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      void loadJob();
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isPolling, jobId, loadJob]);

  const rows = job?.results ?? [];
  const progress = job?.progress ?? {
    total: 0,
    completed: 0,
    pending: 0,
    valid: 0,
    bounce: 0,
    catchAll: 0,
    unknown: 0
  };

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        [row.email, row.domain, row.mxHost, row.detail, row.stage, row.provider ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesQuery && matchesStatus(row, statusFilter);
    });
  }, [query, rows, statusFilter]);

  const counts = useMemo(() => {
    return (["Valid", "Bounce", "Catch-All", "Unknown/Error"] as VerificationStatus[]).map((status) => ({
      status,
      count: rows.filter((row) => row.status === status).length,
      color: statusColors[status]
    }));
  }, [rows]);

  const handleExport = async () => {
    if (!jobId) {
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      await downloadVerificationCsv(jobId);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not download verification CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!jobId) {
    return (
      <div className="grid gap-6">
        <section className="rounded-md border border-ink-100 bg-white p-6 text-center shadow-panel">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-ink-900 text-white">
            <UploadCloud className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal text-ink-900">No verification job selected</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-500">
            Upload a CSV or TXT file to start a backend verification job and stream real progress here.
          </p>
          <Link to="/verify" className="mt-5 inline-flex">
            <Button type="button">
              Start Verification
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-md border border-ink-100 bg-white p-5 shadow-panel lg:grid-cols-[1.1fr_0.9fr] lg:p-6">
        <div>
          <p className="text-sm font-semibold uppercase text-signal-blue">Verification Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink-900 sm:text-4xl">
            Monitor bulk verification in real time
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
            {job ? `Tracking ${job.fileName} with live backend progress.` : "Loading backend verification progress."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Processed" value={`${progress.completed}/${progress.total}`} tone="blue" icon={<Activity className="h-4 w-4" />} />
          <MetricCard label="Pending" value={progress.pending} icon={<Clock className="h-4 w-4" />} />
        </div>
      </section>

      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-signal-red">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      ) : null}

      <ProgressPanel
        completed={progress.completed}
        total={progress.total}
        isRunning={isPolling}
        onToggle={() => setIsPolling((current) => !current)}
        onRefresh={() => void loadJob()}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Valid" value={progress.valid} tone="green" icon={<MailCheck className="h-4 w-4" />} />
        <MetricCard label="Bounce" value={progress.bounce} tone="red" icon={<ShieldAlert className="h-4 w-4" />} />
        <MetricCard label="Catch-All" value={progress.catchAll} tone="amber" icon={<ShieldQuestion className="h-4 w-4" />} />
        <MetricCard label="Unknown" value={progress.unknown} icon={<Clock className="h-4 w-4" />} />
      </div>

      <StatusCharts counts={counts} total={rows.length} />

      {!job ? (
        <section className="flex items-center justify-center gap-3 rounded-md border border-ink-100 bg-white p-8 text-sm text-ink-500 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading verification job
        </section>
      ) : (
        <ResultsTable
          rows={filteredRows}
          query={query}
          statusFilter={statusFilter}
          onQueryChange={setQuery}
          onStatusFilterChange={setStatusFilter}
          onExport={handleExport}
          isExporting={isExporting}
          canExport={rows.length > 0}
        />
      )}
    </div>
  );
};
