import type { MxRecord } from "./dns-verification.js";

export type SmtpVerificationStatus = "Valid" | "Bounce" | "Catch-All" | "Unknown/Error";

export type SmtpVerificationErrorCode =
  | "NO_MX_RECORDS"
  | "SMTP_TIMEOUT"
  | "SMTP_CONNECTION_ERROR"
  | "SMTP_TEMPORARY_FAILURE"
  | "SMTP_REJECTED"
  | "SMTP_UNEXPECTED_RESPONSE";

export type SmtpProbeResponse = {
  mxHost: string;
  responseCode: number;
  responseMessage: string;
};

export type SmtpVerificationResult = {
  email: string;
  status: SmtpVerificationStatus;
  mxHost: string | null;
  responseCode: number | null;
  responseMessage: string | null;
  errorCode: SmtpVerificationErrorCode | null;
  reason: string | null;
  attempts: number;
};

export type BulkSmtpVerificationResult = {
  total: number;
  valid: number;
  bounce: number;
  catchAll: number;
  unknown: number;
  results: SmtpVerificationResult[];
};

export type SmtpVerificationInput = {
  email: string;
  mxRecords: MxRecord[];
};
