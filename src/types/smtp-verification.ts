import type { MxRecord } from "./dns-verification.js";

export type SmtpVerificationStatus = "Valid" | "Bounce" | "Catch-All" | "Unknown/Error";

export type VerificationProvider = "SMTP" | "Abstract API";

export type SmtpVerificationErrorCode =
  | "NO_MX_RECORDS"
  | "SMTP_TIMEOUT"
  | "SMTP_CONNECTION_ERROR"
  | "SMTP_TEMPORARY_FAILURE"
  | "SMTP_REJECTED"
  | "SMTP_UNEXPECTED_RESPONSE"
  | "ABSTRACT_API_NOT_CONFIGURED"
  | "ABSTRACT_API_TIMEOUT"
  | "ABSTRACT_API_NETWORK_ERROR"
  | "ABSTRACT_API_QUOTA_EXCEEDED"
  | "ABSTRACT_API_INVALID_KEY"
  | "ABSTRACT_API_ERROR"
  | "ABSTRACT_API_UNEXPECTED_RESPONSE"
  | "ABSTRACT_API_INVALID_FORMAT"
  | "ABSTRACT_API_UNDELIVERABLE"
  | "ABSTRACT_API_RISKY";

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
  provider: VerificationProvider;
  providerWarning: string | null;
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
