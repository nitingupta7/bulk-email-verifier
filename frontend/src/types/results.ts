export type VerificationStatus = "Valid" | "Bounce" | "Catch-All" | "Unknown/Error";

export type VerificationResultRow = {
  id: string;
  email: string;
  status: VerificationStatus;
  stage: "Syntax" | "DNS/MX" | "SMTP";
  detail: string;
  domain: string;
  mxHost: string;
  responseCode: number | null;
  checkedAt: string;
};

export type ResultStatusFilter = "All" | VerificationStatus;
