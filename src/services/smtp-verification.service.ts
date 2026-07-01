import { createConnection, type Socket } from "node:net";
import { randomUUID } from "node:crypto";
import pLimit from "p-limit";

import { config } from "../config/index.js";
import type { MxRecord } from "../types/dns-verification.js";
import type {
  BulkSmtpVerificationResult,
  SmtpProbeResponse,
  SmtpVerificationErrorCode,
  SmtpVerificationInput,
  SmtpVerificationResult,
  SmtpVerificationStatus
} from "../types/smtp-verification.js";
import { verifyEmailWithAbstractApi } from "./abstract-email-reputation.service.js";

type SmtpProbe = (email: string, mxHost: string, options: Required<SmtpProbeOptions>) => Promise<SmtpProbeResponse>;

type SmtpProbeOptions = {
  timeoutMs?: number;
  port?: number;
  heloHost?: string;
  mailFrom?: string;
};

type SmtpFallbackVerifier = (email: string, smtpFailure: SmtpVerificationResult) => Promise<SmtpVerificationResult>;

export type SmtpVerificationOptions = SmtpProbeOptions & {
  retries?: number;
  concurrency?: number;
  probe?: SmtpProbe;
  catchAllLocalPartFactory?: () => string;
  enableAbstractFallback?: boolean;
  fallbackVerifier?: SmtpFallbackVerifier;
};

type ResolvedSmtpVerificationOptions = Required<SmtpProbeOptions> & {
  retries: number;
  concurrency: number;
  probe: SmtpProbe;
  catchAllLocalPartFactory: () => string;
  enableAbstractFallback: boolean;
  fallbackVerifier: SmtpFallbackVerifier;
};

const defaultOptions = (): ResolvedSmtpVerificationOptions => ({
  timeoutMs: config.smtpTimeoutMs,
  port: config.smtpPort,
  heloHost: config.smtpHeloHost,
  mailFrom: config.smtpMailFrom,
  retries: config.smtpRetries,
  concurrency: config.verificationConcurrency,
  probe: smtpRcptProbe,
  catchAllLocalPartFactory: () => `definitely-not-real-${randomUUID()}`,
  enableAbstractFallback: Boolean(config.abstractApiKey),
  fallbackVerifier: async (email, smtpFailure) => withSmtpFallbackContext(email, smtpFailure)
});

export const verifySmtpAddress = async (
  email: string,
  mxRecords: MxRecord[],
  options: SmtpVerificationOptions = {}
): Promise<SmtpVerificationResult> => {
  const resolvedOptions = { ...defaultOptions(), ...options };
  const sortedMxRecords = sortMxRecords(mxRecords);

  if (sortedMxRecords.length === 0) {
    return result(email, "Bounce", null, null, null, "NO_MX_RECORDS", "No MX records were provided", 0);
  }

  const targetProbe = await probeWithRetries(email, sortedMxRecords, resolvedOptions);
  const targetClassification = classifyProbe(email, targetProbe.response, targetProbe.attempts, targetProbe.error);

  if (targetClassification.status !== "Valid") {
    if (isAbstractFallbackEligible(targetClassification, resolvedOptions)) {
      return resolvedOptions.fallbackVerifier(email, targetClassification);
    }

    return targetClassification;
  }

  const domain = extractDomain(email);
  const catchAllProbeEmail = `${resolvedOptions.catchAllLocalPartFactory()}@${domain}`;
  const catchAllProbe = await probeWithRetries(catchAllProbeEmail, sortedMxRecords, resolvedOptions);
  const catchAllClassification = classifyProbe(email, catchAllProbe.response, catchAllProbe.attempts, catchAllProbe.error);

  if (catchAllClassification.status === "Valid") {
    return {
      ...targetClassification,
      status: "Catch-All",
      reason: "SMTP server accepted a random mailbox for the same domain"
    };
  }

  return targetClassification;
};

export const verifySmtpAddressesBulk = async (
  inputs: SmtpVerificationInput[],
  options: SmtpVerificationOptions = {}
): Promise<BulkSmtpVerificationResult> => {
  const limit = pLimit(normalizeConcurrency(options.concurrency ?? config.verificationConcurrency));
  const results = await Promise.all(
    inputs.map((input) => limit(() => verifySmtpAddress(input.email, input.mxRecords, options)))
  );
  const valid = results.filter((item) => item.status === "Valid").length;
  const bounce = results.filter((item) => item.status === "Bounce").length;
  const catchAll = results.filter((item) => item.status === "Catch-All").length;

  return {
    total: results.length,
    valid,
    bounce,
    catchAll,
    unknown: results.length - valid - bounce - catchAll,
    results
  };
};

export const smtpRcptProbe: SmtpProbe = async (email, mxHost, options) => {
  const session = await SmtpSession.connect(mxHost, options.port, options.timeoutMs);

  try {
    await session.readResponse();
    const ehlo = await session.command(`EHLO ${options.heloHost}`);

    if (ehlo.code >= 400) {
      await session.command(`HELO ${options.heloHost}`);
    }

    await session.command(`MAIL FROM:<${options.mailFrom}>`);
    const rcptResponse = await session.command(`RCPT TO:<${email}>`);

    return {
      mxHost,
      responseCode: rcptResponse.code,
      responseMessage: rcptResponse.message
    };
  } finally {
    try {
      await session.quit();
    } catch {
      // QUIT is required by the protocol flow, but a failed QUIT write should not
      // hide the RCPT classification or the original connection error.
    }
  }
};

const probeWithRetries = async (
  email: string,
  mxRecords: MxRecord[],
  options: ResolvedSmtpVerificationOptions
): Promise<{ response: SmtpProbeResponse | null; error: unknown; attempts: number }> => {
  const maxAttemptsPerHost = Math.max(1, options.retries + 1);
  let attempts = 0;
  let lastError: unknown = null;

  for (const mxRecord of mxRecords) {
    for (let attempt = 0; attempt < maxAttemptsPerHost; attempt += 1) {
      attempts += 1;

      try {
        return {
          response: await options.probe(email, mxRecord.exchange, options),
          error: null,
          attempts
        };
      } catch (error) {
        lastError = error;
      }
    }
  }

  return {
    response: null,
    error: lastError,
    attempts
  };
};

const classifyProbe = (
  email: string,
  response: SmtpProbeResponse | null,
  attempts: number,
  error: unknown
): SmtpVerificationResult => {
  if (!response) {
    const errorCode = error instanceof SmtpTimeoutError ? "SMTP_TIMEOUT" : "SMTP_CONNECTION_ERROR";
    const reason = errorCode === "SMTP_TIMEOUT" ? "SMTP verification timed out" : "SMTP connection failed";
    return result(email, "Unknown/Error", null, null, null, errorCode, reason, attempts);
  }

  const status = statusFromResponseCode(response.responseCode);

  if (status === "Valid") {
    return result(email, status, response.mxHost, response.responseCode, response.responseMessage, null, null, attempts);
  }

  if (status === "Bounce") {
    return result(
      email,
      status,
      response.mxHost,
      response.responseCode,
      response.responseMessage,
      "SMTP_REJECTED",
      "SMTP server rejected the recipient address",
      attempts
    );
  }

  const errorCode = isTemporaryFailure(response.responseCode) ? "SMTP_TEMPORARY_FAILURE" : "SMTP_UNEXPECTED_RESPONSE";

  return result(
    email,
    "Unknown/Error",
    response.mxHost,
    response.responseCode,
    response.responseMessage,
    errorCode,
    "SMTP server returned an inconclusive response",
    attempts
  );
};

const statusFromResponseCode = (responseCode: number): SmtpVerificationStatus => {
  if (responseCode >= 200 && responseCode < 300) {
    return "Valid";
  }

  if (responseCode >= 500 && responseCode < 600) {
    return "Bounce";
  }

  return "Unknown/Error";
};

const isTemporaryFailure = (responseCode: number): boolean => {
  return responseCode >= 400 && responseCode < 500;
};

const result = (
  email: string,
  status: SmtpVerificationStatus,
  mxHost: string | null,
  responseCode: number | null,
  responseMessage: string | null,
  errorCode: SmtpVerificationErrorCode | null,
  reason: string | null,
  attempts: number
): SmtpVerificationResult => ({
  email,
  status,
  mxHost,
  responseCode,
  responseMessage,
  errorCode,
  reason,
  attempts,
  provider: "SMTP",
  providerWarning: null
});

const isAbstractFallbackEligible = (
  smtpResult: SmtpVerificationResult,
  options: ResolvedSmtpVerificationOptions
): boolean => {
  return (
    options.enableAbstractFallback &&
    smtpResult.status === "Unknown/Error" &&
    (smtpResult.errorCode === "SMTP_TIMEOUT" || smtpResult.errorCode === "SMTP_CONNECTION_ERROR")
  );
};

const withSmtpFallbackContext = async (
  email: string,
  smtpFailure: SmtpVerificationResult
): Promise<SmtpVerificationResult> => {
  const fallbackResult = await verifyEmailWithAbstractApi(email);
  const smtpReason = smtpFailure.reason ?? "SMTP verification failed";
  const apiReason = fallbackResult.reason ?? "Abstract API returned a fallback result";

  return {
    ...fallbackResult,
    attempts: smtpFailure.attempts,
    reason: `${smtpReason}; used Abstract API fallback. ${apiReason}`
  };
};

const sortMxRecords = (records: MxRecord[]): MxRecord[] => {
  return [...records].sort((left, right) => left.priority - right.priority || left.exchange.localeCompare(right.exchange));
};

const extractDomain = (email: string): string => {
  const atIndex = email.lastIndexOf("@");
  return atIndex === -1 ? "" : email.slice(atIndex + 1);
};

const normalizeConcurrency = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
};

type SmtpResponse = {
  code: number;
  message: string;
};

class SmtpSession {
  private readonly socket: Socket;
  private readonly timeoutMs: number;
  private buffer = "";
  private readonly lines: string[] = [];
  private pendingRead: PendingRead | null = null;

  private constructor(socket: Socket, timeoutMs: number) {
    this.socket = socket;
    this.timeoutMs = timeoutMs;

    this.socket.on("data", (chunk: Buffer) => {
      this.buffer += chunk.toString("utf8");
      this.flushLines();
    });

    this.socket.on("error", (error) => {
      this.rejectPending(error);
    });

    this.socket.on("timeout", () => {
      this.rejectPending(new SmtpTimeoutError());
      this.socket.destroy();
    });
  }

  public static connect(mxHost: string, port: number, timeoutMs: number): Promise<SmtpSession> {
    return new Promise((resolve, reject) => {
      const socket = createConnection({ host: mxHost, port });
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new SmtpTimeoutError());
      }, timeoutMs);

      socket.once("connect", () => {
        clearTimeout(timeout);
        socket.setTimeout(timeoutMs);
        resolve(new SmtpSession(socket, timeoutMs));
      });

      socket.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  public async command(command: string): Promise<SmtpResponse> {
    await this.write(`${command}\r\n`);
    return this.readResponse();
  }

  public async readResponse(): Promise<SmtpResponse> {
    const immediateResponse = this.tryBuildResponse();

    if (immediateResponse) {
      return immediateResponse;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRead = null;
        reject(new SmtpTimeoutError());
      }, this.timeoutMs);

      this.pendingRead = {
        resolve: (response) => {
          clearTimeout(timeout);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      };
    });
  }

  public async quit(): Promise<void> {
    if (this.socket.destroyed) {
      return;
    }

    try {
      await this.write("QUIT\r\n");
    } finally {
      this.socket.end();
    }
  }

  private write(data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.write(data, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  private flushLines(): void {
    const parts = this.buffer.split(/\r?\n/);
    this.buffer = parts.pop() ?? "";
    this.lines.push(...parts.filter((line) => line.length > 0));

    if (this.pendingRead) {
      const response = this.tryBuildResponse();
      if (response) {
        const pendingRead = this.pendingRead;
        this.pendingRead = null;
        pendingRead.resolve(response);
      }
    }
  }

  private tryBuildResponse(): SmtpResponse | null {
    const firstLine = this.lines[0];
    const match = firstLine?.match(/^(\d{3})([ -])(.*)$/);

    if (!match) {
      return null;
    }

    const code = Number.parseInt(match[1] ?? "", 10);
    const collectedLines: string[] = [];

    for (let index = 0; index < this.lines.length; index += 1) {
      const line = this.lines[index];

      if (!line) {
        continue;
      }

      collectedLines.push(line);

      if (line.startsWith(`${code} `)) {
        this.lines.splice(0, index + 1);
        return {
          code,
          message: collectedLines.map((item) => item.replace(/^\d{3}[ -]/, "")).join("\n")
        };
      }
    }

    return null;
  }

  private rejectPending(error: Error): void {
    if (!this.pendingRead) {
      return;
    }

    const pendingRead = this.pendingRead;
    this.pendingRead = null;
    pendingRead.reject(error);
  }
}

type PendingRead = {
  resolve: (response: SmtpResponse) => void;
  reject: (error: Error) => void;
};

class SmtpTimeoutError extends Error {
  public constructor() {
    super("SMTP operation timed out");
  }
}
