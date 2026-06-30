export type MxRecord = {
  exchange: string;
  priority: number;
};

export type DnsMxVerificationStatus = "Valid" | "Bounce" | "Unknown/Error";

export type DnsMxVerificationErrorCode =
  | "EMPTY_DOMAIN"
  | "DOMAIN_NOT_FOUND"
  | "NO_MX_RECORDS"
  | "DNS_TIMEOUT"
  | "DNS_ERROR";

export type DomainMxVerificationResult = {
  domain: string;
  status: DnsMxVerificationStatus;
  hasMxRecords: boolean;
  mxRecords: MxRecord[];
  errorCode: DnsMxVerificationErrorCode | null;
  reason: string | null;
};

export type EmailDomainMxVerificationResult = DomainMxVerificationResult & {
  email: string;
};

export type BulkDomainMxVerificationResult = {
  total: number;
  valid: number;
  bounce: number;
  unknown: number;
  results: EmailDomainMxVerificationResult[];
};
