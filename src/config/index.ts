import "dotenv/config";

export type AppConfig = {
  nodeEnv: string;
  host: string;
  port: number;
  logLevel: string;
  corsOrigins: "*" | string[];
  requestBodyLimit: string;
  uploadMaxBytes: number;
  dnsLookupTimeoutMs: number;
  smtpTimeoutMs: number;
  smtpRetries: number;
  smtpPort: number;
  smtpHeloHost: string;
  smtpMailFrom: string;
  abstractApiKey: string;
  abstractApiTimeoutMs: number;
  abstractApiMonthlyLimit: number;
  abstractApiWarningThreshold: number;
  abstractApiThrottleMs: number;
  verificationConcurrency: number;
};

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseCorsOrigins = (value: string): "*" | string[] => {
  if (value.trim() === "*") {
    return "*";
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const config: AppConfig = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  host: process.env.HOST ?? "0.0.0.0",
  port: toNumber(process.env.PORT, 8000),
  logLevel: process.env.LOG_LEVEL ?? "info",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN ?? "*"),
  requestBodyLimit: process.env.REQUEST_BODY_LIMIT ?? "1mb",
  uploadMaxBytes: toNumber(process.env.UPLOAD_MAX_BYTES, 1_048_576),
  dnsLookupTimeoutMs: toNumber(process.env.DNS_LOOKUP_TIMEOUT_MS, 10_000),
  smtpTimeoutMs: toNumber(process.env.SMTP_TIMEOUT_MS, 8_000),
  smtpRetries: toNumber(process.env.SMTP_RETRIES, 2),
  smtpPort: toNumber(process.env.SMTP_PORT, 25),
  smtpHeloHost: process.env.SMTP_HELO_HOST ?? "bulk-email-verifier.local",
  smtpMailFrom: process.env.SMTP_MAIL_FROM ?? "verifier@bulk-email-verifier.local",
  abstractApiKey: process.env.ABSTRACT_API_KEY ?? "",
  abstractApiTimeoutMs: toNumber(process.env.ABSTRACT_API_TIMEOUT_MS, 8_000),
  abstractApiMonthlyLimit: toNumber(process.env.ABSTRACT_API_MONTHLY_LIMIT, 100),
  abstractApiWarningThreshold: toNumber(process.env.ABSTRACT_API_WARNING_THRESHOLD, 10),
  abstractApiThrottleMs: toNumber(process.env.ABSTRACT_API_THROTTLE_MS, 1_000),
  verificationConcurrency: toNumber(process.env.VERIFICATION_CONCURRENCY, 25)
};
