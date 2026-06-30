import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Database, FileCheck2, Loader2, UploadCloud } from "lucide-react";

import { Button } from "../components/Button";
import { MetricCard } from "../components/MetricCard";
import { UploadDropzone } from "../components/UploadDropzone";
import { createVerificationJob } from "../services/api";

export const UploadPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async () => {
    if (!file) {
      setError("Choose a CSV or TXT file before uploading.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const job = await createVerificationJob(file);
      window.localStorage.setItem("latestVerificationJobId", job.id);
      navigate(`/results?jobId=${job.id}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-md border border-ink-100 bg-white p-5 shadow-panel lg:grid-cols-[1.25fr_0.75fr] lg:p-6">
        <div>
          <p className="text-sm font-semibold uppercase text-signal-blue">Verification Intake</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink-900 sm:text-4xl">
            Prepare a bulk email file for validation
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
            Upload a CSV or TXT file to parse addresses and run syntax validation before DNS and SMTP checks.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Max upload" value="1 MB" tone="blue" icon={<Database className="h-4 w-4" />} />
          <MetricCard label="Input types" value="CSV/TXT" tone="green" icon={<FileCheck2 className="h-4 w-4" />} />
        </div>
      </section>

      <section className="grid gap-4 rounded-md border border-ink-100 bg-white p-5 shadow-sm">
        <UploadDropzone file={file} onFileChange={setFile} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-500">Files are parsed, syntax-checked, and submitted to the verification job queue.</p>
          <Button type="button" onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="h-4 w-4" aria-hidden="true" />}
            Start Verification
          </Button>
        </div>
        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-signal-red">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        ) : null}
      </section>

    </div>
  );
};
