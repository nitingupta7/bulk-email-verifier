import pLimit from "p-limit";

import { config } from "../config/index.js";
import type { EmailDomainMxVerificationResult } from "../types/dns-verification.js";
import type { SmtpVerificationResult } from "../types/smtp-verification.js";
import type {
  BulkEmailVerificationResult,
  EmailVerificationResult,
  VerificationProgressSnapshot,
  VerificationStatus
} from "../types/verification-pipeline.js";
import { validateEmailSyntax } from "./email-syntax-validation.service.js";
import { verifyEmailDomainMxRecords } from "./dns-mx-verification.service.js";
import { verifySmtpAddress } from "./smtp-verification.service.js";

export type VerificationProgressCallback = (snapshot: VerificationProgressSnapshot) => void;

export type EmailVerificationPipelineOptions = {
  concurrency?: number;
  onProgress?: VerificationProgressCallback;
  verifyDns?: (email: string) => Promise<EmailDomainMxVerificationResult>;
  verifySmtp?: (email: string, mxRecords: EmailDomainMxVerificationResult["mxRecords"]) => Promise<SmtpVerificationResult>;
};

type MutableProgress = {
  completed: number;
  valid: number;
  bounce: number;
  catchAll: number;
  unknown: number;
};

export const verifyEmails = async (
  emails: string[],
  options: EmailVerificationPipelineOptions = {}
): Promise<BulkEmailVerificationResult> => {
  const concurrency = normalizeConcurrency(options.concurrency ?? config.verificationConcurrency);
  const limit = pLimit(concurrency);
  const results: EmailVerificationResult[] = new Array<EmailVerificationResult>(emails.length);
  const progress: MutableProgress = {
    completed: 0,
    valid: 0,
    bounce: 0,
    catchAll: 0,
    unknown: 0
  };

  await Promise.all(
    emails.map((email, index) =>
      limit(async () => {
        const result = await verifyEmail(email, options);
        results[index] = result;
        recordProgress(progress, result.status);
        options.onProgress?.(toProgressSnapshot(emails.length, progress, email, result));
      })
    )
  );

  return {
    total: emails.length,
    valid: progress.valid,
    bounce: progress.bounce,
    catchAll: progress.catchAll,
    unknown: progress.unknown,
    results
  };
};

export const verifyEmail = async (
  email: string,
  options: EmailVerificationPipelineOptions = {}
): Promise<EmailVerificationResult> => {
  const syntax = validateEmailSyntax(email);

  if (!syntax.isValid) {
    return {
      email,
      status: "Bounce",
      syntax,
      dns: null,
      smtp: null
    };
  }

  const dns = await (options.verifyDns ?? verifyEmailDomainMxRecords)(syntax.normalizedEmail ?? email);

  if (dns.status !== "Valid") {
    return {
      email,
      status: dns.status,
      syntax,
      dns,
      smtp: null
    };
  }

  const smtp = await (options.verifySmtp ?? verifySmtpAddress)(syntax.normalizedEmail ?? email, dns.mxRecords);

  return {
    email,
    status: smtp.status,
    syntax,
    dns,
    smtp
  };
};

const normalizeConcurrency = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
};

const recordProgress = (progress: MutableProgress, status: VerificationStatus): void => {
  progress.completed += 1;

  if (status === "Valid") {
    progress.valid += 1;
    return;
  }

  if (status === "Bounce") {
    progress.bounce += 1;
    return;
  }

  if (status === "Catch-All") {
    progress.catchAll += 1;
    return;
  }

  progress.unknown += 1;
};

const toProgressSnapshot = (
  total: number,
  progress: MutableProgress,
  currentEmail: string,
  result: EmailVerificationResult
): VerificationProgressSnapshot => ({
  total,
  completed: progress.completed,
  pending: total - progress.completed,
  valid: progress.valid,
  bounce: progress.bounce,
  catchAll: progress.catchAll,
  unknown: progress.unknown,
  currentEmail,
  stage: "complete",
  result
});
