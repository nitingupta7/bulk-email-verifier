import pLimit from "p-limit";

import { config } from "../config/index.js";
import type { SmtpVerificationResult, SmtpVerificationStatus } from "../types/smtp-verification.js";

type AbstractEmailReputationOptions = {
  apiKey?: string;
  timeoutMs?: number;
  monthlyLimit?: number;
  warningThreshold?: number;
  throttleMs?: number;
  fetchImpl?: typeof fetch;
};

type UsageWindow = {
  month: string;
  count: number;
};

const endpoint = "https://emailreputation.abstractapi.com/v1/";
const requestQueue = pLimit(1);
let lastRequestAt = 0;
let usageWindow: UsageWindow = {
  month: new Date().toISOString().slice(0, 7),
  count: 0
};

export const verifyEmailWithAbstractApi = async (
  email: string,
  options: AbstractEmailReputationOptions = {}
): Promise<SmtpVerificationResult> => {
  return requestQueue(async () => {
    resetUsageWindowIfNeeded();

    const resolved = {
      apiKey: options.apiKey ?? config.abstractApiKey,
      timeoutMs: options.timeoutMs ?? config.abstractApiTimeoutMs,
      monthlyLimit: options.monthlyLimit ?? config.abstractApiMonthlyLimit,
      warningThreshold: options.warningThreshold ?? config.abstractApiWarningThreshold,
      throttleMs: options.throttleMs ?? config.abstractApiThrottleMs,
      fetchImpl: options.fetchImpl ?? fetch
    };

    if (!resolved.apiKey) {
      return abstractResult(
        email,
        "Unknown/Error",
        "ABSTRACT_API_NOT_CONFIGURED",
        "Abstract API fallback is not configured. Set ABSTRACT_API_KEY to enable hosted SMTP fallback."
      );
    }

    if (usageWindow.count >= resolved.monthlyLimit) {
      return abstractResult(
        email,
        "Unknown/Error",
        "ABSTRACT_API_QUOTA_EXCEEDED",
        "Abstract API monthly request limit reached before verification."
      );
    }

    await throttle(resolved.throttleMs);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), resolved.timeoutMs);

    try {
      const url = new URL(endpoint);
      url.searchParams.set("api_key", resolved.apiKey);
      url.searchParams.set("email", email);

      usageWindow.count += 1;
      const response = await resolved.fetchImpl(url, {
        method: "GET",
        signal: controller.signal
      });

      const quotaWarning = buildQuotaWarning(resolved.monthlyLimit, resolved.warningThreshold);

      if (response.status === 429 || response.status === 402) {
        return abstractResult(
          email,
          "Unknown/Error",
          "ABSTRACT_API_QUOTA_EXCEEDED",
          "Abstract API quota exceeded or rate limit reached.",
          quotaWarning
        );
      }

      if (response.status === 401 || response.status === 403) {
        return abstractResult(
          email,
          "Unknown/Error",
          "ABSTRACT_API_INVALID_KEY",
          "Abstract API rejected the configured API key.",
          quotaWarning
        );
      }

      if (!response.ok) {
        return abstractResult(
          email,
          "Unknown/Error",
          "ABSTRACT_API_ERROR",
          `Abstract API verification failed with HTTP ${response.status}.`,
          quotaWarning
        );
      }

      const payload = (await response.json()) as Record<string, unknown>;
      return mapAbstractPayloadToSmtpResult(email, payload, quotaWarning);
    } catch (error) {
      const isAbort = error instanceof Error && error.name === "AbortError";
      return abstractResult(
        email,
        "Unknown/Error",
        isAbort ? "ABSTRACT_API_TIMEOUT" : "ABSTRACT_API_NETWORK_ERROR",
        isAbort ? "Abstract API verification timed out." : "Abstract API verification failed due to a network error."
      );
    } finally {
      clearTimeout(timeout);
    }
  });
};

export const getAbstractApiUsageSnapshot = (): UsageWindow => {
  resetUsageWindowIfNeeded();
  return { ...usageWindow };
};

const mapAbstractPayloadToSmtpResult = (
  email: string,
  payload: Record<string, unknown>,
  providerWarning: string | null
): SmtpVerificationResult => {
  const deliverability = readString(payload.deliverability).toLowerCase();
  const isValidFormat = readBoolean(payload.is_valid_format);
  const isSmtpValid = readBoolean(payload.is_smtp_valid);
  const isDisposable = readBoolean(payload.is_disposable_email);
  const isRole = readBoolean(payload.is_role_email);
  const qualityScore = readNumber(payload.quality_score);
  const detailSuffix = buildAttributeDetail(isDisposable, isRole, qualityScore);

  if (isValidFormat === false) {
    return abstractResult(
      email,
      "Bounce",
      "ABSTRACT_API_INVALID_FORMAT",
      `Abstract API reported invalid email format.${detailSuffix}`,
      providerWarning
    );
  }

  if (isSmtpValid === false || deliverability.includes("undeliverable") || deliverability.includes("invalid")) {
    return abstractResult(
      email,
      "Bounce",
      "ABSTRACT_API_UNDELIVERABLE",
      `Abstract API reported the address as undeliverable.${detailSuffix}`,
      providerWarning
    );
  }

  if (isSmtpValid === true || deliverability.includes("deliverable")) {
    return abstractResult(
      email,
      "Valid",
      null,
      `Abstract API reported the address as deliverable.${detailSuffix}`,
      providerWarning
    );
  }

  if (deliverability.includes("risky") || (qualityScore !== null && qualityScore < 0.5)) {
    return abstractResult(
      email,
      "Unknown/Error",
      "ABSTRACT_API_RISKY",
      `Abstract API reported risky or low-confidence deliverability.${detailSuffix}`,
      providerWarning
    );
  }

  return abstractResult(
    email,
    "Unknown/Error",
    "ABSTRACT_API_UNEXPECTED_RESPONSE",
    "Abstract API returned an inconclusive verification response.",
    providerWarning
  );
};

const abstractResult = (
  email: string,
  status: SmtpVerificationStatus,
  errorCode: SmtpVerificationResult["errorCode"],
  reason: string | null,
  providerWarning: string | null = null
): SmtpVerificationResult => ({
  email,
  status,
  mxHost: null,
  responseCode: null,
  responseMessage: null,
  errorCode,
  reason,
  attempts: 0,
  provider: "Abstract API",
  providerWarning
});

const readBoolean = (value: unknown): boolean | null => {
  const normalizedValue = unwrapValue(value);

  if (typeof normalizedValue === "boolean") {
    return normalizedValue;
  }

  if (typeof normalizedValue === "string") {
    const lowered = normalizedValue.toLowerCase();
    if (lowered === "true" || lowered === "yes") {
      return true;
    }
    if (lowered === "false" || lowered === "no") {
      return false;
    }
  }

  return null;
};

const readNumber = (value: unknown): number | null => {
  const normalizedValue = unwrapValue(value);

  if (typeof normalizedValue === "number" && Number.isFinite(normalizedValue)) {
    return normalizedValue;
  }

  if (typeof normalizedValue === "string") {
    const parsed = Number.parseFloat(normalizedValue);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const readString = (value: unknown): string => {
  const normalizedValue = unwrapValue(value);
  return typeof normalizedValue === "string" ? normalizedValue : "";
};

const unwrapValue = (value: unknown): unknown => {
  if (typeof value === "object" && value !== null && "value" in value) {
    return (value as { value: unknown }).value;
  }

  return value;
};

const buildAttributeDetail = (
  isDisposable: boolean | null,
  isRole: boolean | null,
  qualityScore: number | null
): string => {
  const details: string[] = [];

  if (isDisposable === true) {
    details.push("disposable email");
  }

  if (isRole === true) {
    details.push("role-based address");
  }

  if (qualityScore !== null) {
    details.push(`quality score ${qualityScore}`);
  }

  return details.length > 0 ? ` (${details.join(", ")}).` : "";
};

const buildQuotaWarning = (monthlyLimit: number, warningThreshold: number): string | null => {
  const remaining = monthlyLimit - usageWindow.count;

  if (remaining <= warningThreshold) {
    return `Abstract API fallback usage is near the configured monthly limit: ${remaining} request(s) remaining.`;
  }

  return null;
};

const throttle = async (throttleMs: number): Promise<void> => {
  if (throttleMs <= 0) {
    return;
  }

  const elapsed = Date.now() - lastRequestAt;
  const delayMs = Math.max(0, throttleMs - elapsed);

  if (delayMs > 0) {
    await delay(delayMs);
  }

  lastRequestAt = Date.now();
};

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const resetUsageWindowIfNeeded = (): void => {
  const month = currentMonthKey();

  if (usageWindow.month !== month) {
    usageWindow = { month, count: 0 };
  }
};

const currentMonthKey = (): string => {
  return new Date().toISOString().slice(0, 7);
};
