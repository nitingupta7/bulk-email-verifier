import type { VerificationStatus } from "./verification-pipeline.js";

export type VerificationJobStatus = "queued" | "running" | "completed" | "failed";

export type VerificationJobResultRow = {
  id: string;
  email: string;
  status: VerificationStatus;
  stage: "Syntax" | "DNS/MX" | "SMTP";
  detail: string;
  domain: string;
  mxHost: string;
  responseCode: number | null;
  provider: string;
  providerWarning: string | null;
  checkedAt: string;
};

export type VerificationJobProgress = {
  total: number;
  completed: number;
  pending: number;
  valid: number;
  bounce: number;
  catchAll: number;
  unknown: number;
};

export type VerificationJobSnapshot = {
  id: string;
  fileName: string;
  status: VerificationJobStatus;
  progress: VerificationJobProgress;
  results: VerificationJobResultRow[];
  error: string | null;
  createdAt: string;
  updatedAt: string;
};
