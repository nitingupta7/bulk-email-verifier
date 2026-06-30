import { resolveMx } from "node:dns/promises";
import pLimit from "p-limit";

import { config } from "../config/index.js";
import type {
  BulkDomainMxVerificationResult,
  DnsMxVerificationErrorCode,
  DomainMxVerificationResult,
  EmailDomainMxVerificationResult,
  MxRecord
} from "../types/dns-verification.js";

type ResolveMx = (domain: string) => Promise<MxRecord[]>;

export type DnsMxVerificationOptions = {
  timeoutMs?: number;
  resolveMx?: ResolveMx;
  concurrency?: number;
};

const defaultOptions = (): Required<DnsMxVerificationOptions> => ({
  timeoutMs: config.dnsLookupTimeoutMs,
  resolveMx,
  concurrency: config.verificationConcurrency
});

export const verifyDomainMxRecords = async (
  domain: string,
  options: DnsMxVerificationOptions = {}
): Promise<DomainMxVerificationResult> => {
  const normalizedDomain = normalizeDomain(domain);

  if (!normalizedDomain) {
    return bounce(normalizedDomain, "EMPTY_DOMAIN", "Domain is empty");
  }

  const { timeoutMs, resolveMx: mxResolver } = { ...defaultOptions(), ...options };

  try {
    const mxRecords = await withTimeout(mxResolver(normalizedDomain), timeoutMs);
    const sortedRecords = sortMxRecords(mxRecords);

    if (sortedRecords.length === 0) {
      return bounce(normalizedDomain, "NO_MX_RECORDS", "Domain does not publish MX records");
    }

    return {
      domain: normalizedDomain,
      status: "Valid",
      hasMxRecords: true,
      mxRecords: sortedRecords,
      errorCode: null,
      reason: null
    };
  } catch (error) {
    return handleDnsError(normalizedDomain, error);
  }
};

export const verifyEmailDomainMxRecords = async (
  email: string,
  options: DnsMxVerificationOptions = {}
): Promise<EmailDomainMxVerificationResult> => {
  const domain = extractDomain(email);
  const result = await verifyDomainMxRecords(domain, options);

  return {
    email,
    ...result
  };
};

export const verifyEmailDomainMxRecordsBulk = async (
  emails: string[],
  options: DnsMxVerificationOptions = {}
): Promise<BulkDomainMxVerificationResult> => {
  const limit = pLimit(normalizeConcurrency(options.concurrency ?? config.verificationConcurrency));
  const results = await Promise.all(emails.map((email) => limit(() => verifyEmailDomainMxRecords(email, options))));
  const valid = results.filter((result) => result.status === "Valid").length;
  const bounce = results.filter((result) => result.status === "Bounce").length;

  return {
    total: results.length,
    valid,
    bounce,
    unknown: results.length - valid - bounce,
    results
  };
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeout: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      reject(new DnsTimeoutError());
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};

const handleDnsError = (domain: string, error: unknown): DomainMxVerificationResult => {
  if (error instanceof DnsTimeoutError) {
    return unknown(domain, "DNS_TIMEOUT", "DNS MX lookup timed out");
  }

  const errorCode = getNodeDnsErrorCode(error);

  if (errorCode === "ENOTFOUND") {
    return bounce(domain, "DOMAIN_NOT_FOUND", "Domain was not found in DNS");
  }

  if (errorCode === "ENODATA" || errorCode === "ENODOMAIN") {
    return bounce(domain, "NO_MX_RECORDS", "Domain does not publish MX records");
  }

  return unknown(domain, "DNS_ERROR", "DNS MX lookup failed");
};

const sortMxRecords = (records: MxRecord[]): MxRecord[] => {
  return [...records]
    .filter((record) => record.exchange.trim())
    .sort((left, right) => left.priority - right.priority || left.exchange.localeCompare(right.exchange));
};

const normalizeDomain = (domain: string): string => {
  return domain.trim().replace(/\.$/, "").toLowerCase();
};

const extractDomain = (email: string): string => {
  const atIndex = email.lastIndexOf("@");
  return atIndex === -1 ? "" : email.slice(atIndex + 1);
};

const bounce = (
  domain: string,
  errorCode: DnsMxVerificationErrorCode,
  reason: string
): DomainMxVerificationResult => ({
  domain,
  status: "Bounce",
  hasMxRecords: false,
  mxRecords: [],
  errorCode,
  reason
});

const unknown = (
  domain: string,
  errorCode: DnsMxVerificationErrorCode,
  reason: string
): DomainMxVerificationResult => ({
  domain,
  status: "Unknown/Error",
  hasMxRecords: false,
  mxRecords: [],
  errorCode,
  reason
});

const getNodeDnsErrorCode = (error: unknown): string | null => {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }

  const code = (error as { code: unknown }).code;
  return typeof code === "string" ? code : null;
};

class DnsTimeoutError extends Error {
  public constructor() {
    super("DNS lookup timed out");
  }
}

const normalizeConcurrency = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
};
