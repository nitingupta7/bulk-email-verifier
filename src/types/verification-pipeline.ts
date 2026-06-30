import type { EmailSyntaxValidationResult } from "./email-syntax-validation.js";
import type { EmailDomainMxVerificationResult } from "./dns-verification.js";
import type { SmtpVerificationResult, SmtpVerificationStatus } from "./smtp-verification.js";

export type VerificationStatus = SmtpVerificationStatus;

export type VerificationStage = "syntax" | "dns" | "smtp" | "complete";

export type EmailVerificationResult = {
  email: string;
  status: VerificationStatus;
  syntax: EmailSyntaxValidationResult;
  dns: EmailDomainMxVerificationResult | null;
  smtp: SmtpVerificationResult | null;
};

export type VerificationProgressSnapshot = {
  total: number;
  completed: number;
  pending: number;
  valid: number;
  bounce: number;
  catchAll: number;
  unknown: number;
  currentEmail: string;
  stage: VerificationStage;
  result: EmailVerificationResult;
};

export type BulkEmailVerificationResult = {
  total: number;
  valid: number;
  bounce: number;
  catchAll: number;
  unknown: number;
  results: EmailVerificationResult[];
};
