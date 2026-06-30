import { randomUUID } from "node:crypto";

import type { ParsedEmailUpload } from "../types/upload.js";
import type { EmailVerificationResult, VerificationProgressSnapshot } from "../types/verification-pipeline.js";
import type { VerificationJobResultRow, VerificationJobSnapshot } from "../types/verification-job.js";
import { ApiError } from "../utils/api-error.js";
import { verifyEmails, type EmailVerificationPipelineOptions } from "./email-verification-pipeline.service.js";

const jobs = new Map<string, VerificationJobSnapshot>();

export type CreateVerificationJobOptions = Pick<EmailVerificationPipelineOptions, "concurrency">;

export const createVerificationJob = (
  upload: ParsedEmailUpload,
  options: CreateVerificationJobOptions = {}
): VerificationJobSnapshot => {
  const now = new Date().toISOString();
  const job: VerificationJobSnapshot = {
    id: randomUUID(),
    fileName: upload.fileName,
    status: "queued",
    progress: {
      total: upload.emails.length,
      completed: 0,
      pending: upload.emails.length,
      valid: 0,
      bounce: 0,
      catchAll: 0,
      unknown: 0
    },
    results: [],
    error: null,
    createdAt: now,
    updatedAt: now
  };

  jobs.set(job.id, job);
  void runVerificationJob(job.id, upload.emails, options);

  return cloneJob(job);
};

export const getVerificationJob = (jobId: string): VerificationJobSnapshot => {
  const job = jobs.get(jobId);

  if (!job) {
    throw new ApiError(404, "JOB_NOT_FOUND", "Verification job was not found");
  }

  return cloneJob(job);
};

export const getVerificationJobCsv = (jobId: string): string => {
  const job = getVerificationJob(jobId);
  const rows = [["EmailAddress", "Status"], ...job.results.map((result) => [result.email, result.status])];

  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
};

const runVerificationJob = async (
  jobId: string,
  emails: string[],
  options: CreateVerificationJobOptions
): Promise<void> => {
  const job = getMutableJob(jobId);
  job.status = "running";
  job.updatedAt = new Date().toISOString();

  try {
    const finalResult = await verifyEmails(emails, {
      concurrency: options.concurrency,
      onProgress: (snapshot) => updateJobProgress(jobId, snapshot)
    });

    const completedJob = getMutableJob(jobId);
    completedJob.status = "completed";
    completedJob.progress = {
      total: finalResult.total,
      completed: finalResult.total,
      pending: 0,
      valid: finalResult.valid,
      bounce: finalResult.bounce,
      catchAll: finalResult.catchAll,
      unknown: finalResult.unknown
    };
    completedJob.results = finalResult.results.map((result, index) => toJobResultRow(result, index));
    completedJob.updatedAt = new Date().toISOString();
  } catch (error) {
    const failedJob = getMutableJob(jobId);
    failedJob.status = "failed";
    failedJob.error = error instanceof Error ? error.message : "Verification job failed";
    failedJob.updatedAt = new Date().toISOString();
  }
};

const updateJobProgress = (jobId: string, snapshot: VerificationProgressSnapshot): void => {
  const job = getMutableJob(jobId);
  job.progress = {
    total: snapshot.total,
    completed: snapshot.completed,
    pending: snapshot.pending,
    valid: snapshot.valid,
    bounce: snapshot.bounce,
    catchAll: snapshot.catchAll,
    unknown: snapshot.unknown
  };
  job.results = [...job.results, toJobResultRow(snapshot.result, job.results.length)];
  job.updatedAt = new Date().toISOString();
};

const getMutableJob = (jobId: string): VerificationJobSnapshot => {
  const job = jobs.get(jobId);

  if (!job) {
    throw new ApiError(404, "JOB_NOT_FOUND", "Verification job was not found");
  }

  return job;
};

const toJobResultRow = (result: EmailVerificationResult, index: number): VerificationJobResultRow => {
  const smtp = result.smtp;
  const dns = result.dns;
  const syntaxReason = result.syntax.reason;
  const detail = smtp?.reason ?? smtp?.responseMessage ?? dns?.reason ?? syntaxReason ?? "Verification completed";
  const stage = smtp ? "SMTP" : dns ? "DNS/MX" : "Syntax";

  return {
    id: `${index + 1}-${result.email}`,
    email: result.email,
    status: result.status,
    stage,
    detail,
    domain: result.syntax.isValid ? dns?.domain ?? extractDomain(result.email) ?? "-" : "-",
    mxHost: smtp?.mxHost ?? "-",
    responseCode: smtp?.responseCode ?? null,
    checkedAt: new Date().toISOString()
  };
};

const extractDomain = (email: string): string | null => {
  const atIndex = email.lastIndexOf("@");
  return atIndex === -1 ? null : email.slice(atIndex + 1);
};

const cloneJob = (job: VerificationJobSnapshot): VerificationJobSnapshot => {
  return {
    ...job,
    progress: { ...job.progress },
    results: job.results.map((result) => ({ ...result }))
  };
};

const escapeCsvCell = (value: string): string => {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
};
