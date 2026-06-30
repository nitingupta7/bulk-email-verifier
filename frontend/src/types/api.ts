import type { VerificationResultRow } from "./results";

export type UploadResponse = {
  fileName: string;
  fileType: "csv" | "txt";
  totalEmails: number;
  emails: string[];
  syntaxValidation: BulkEmailSyntaxValidationResult;
};

export type BulkEmailSyntaxValidationResult = {
  total: number;
  valid: number;
  invalid: number;
  results: EmailSyntaxValidationResult[];
};

export type EmailSyntaxValidationResult = {
  email: string;
  isValid: boolean;
  normalizedEmail: string | null;
  errorCode: string | null;
  reason: string | null;
};

export type VerificationJobStatus = "queued" | "running" | "completed" | "failed";

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
  results: VerificationResultRow[];
  error: string | null;
  createdAt: string;
  updatedAt: string;
};
