import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { verifySmtpAddress, verifySmtpAddressesBulk } from "../src/services/smtp-verification.service.js";
import type { MxRecord } from "../src/types/dns-verification.js";
import type { SmtpProbeResponse } from "../src/types/smtp-verification.js";

const mxRecords: MxRecord[] = [{ exchange: "mx.example.com", priority: 10 }];

describe("SMTP verification service", () => {
  it("classifies 2xx RCPT responses as Valid when catch-all probe is rejected", async () => {
    const result = await verifySmtpAddress("user@example.com", mxRecords, {
      probe: async (email, mxHost) => response(mxHost, email.startsWith("definitely-not-real-") ? 550 : 250),
      catchAllLocalPartFactory: () => "definitely-not-real-test"
    });

    assert.equal(result.status, "Valid");
    assert.equal(result.responseCode, 250);
    assert.equal(result.errorCode, null);
  });

  it("classifies 5xx RCPT responses as Bounce", async () => {
    const result = await verifySmtpAddress("missing@example.com", mxRecords, {
      probe: async (_email, mxHost) => response(mxHost, 550)
    });

    assert.equal(result.status, "Bounce");
    assert.equal(result.responseCode, 550);
    assert.equal(result.errorCode, "SMTP_REJECTED");
  });

  it("classifies temporary SMTP responses as Unknown/Error", async () => {
    const result = await verifySmtpAddress("graylisted@example.com", mxRecords, {
      probe: async (_email, mxHost) => response(mxHost, 451)
    });

    assert.equal(result.status, "Unknown/Error");
    assert.equal(result.responseCode, 451);
    assert.equal(result.errorCode, "SMTP_TEMPORARY_FAILURE");
  });

  it("classifies accepting random mailbox probes as Catch-All", async () => {
    const result = await verifySmtpAddress("user@example.com", mxRecords, {
      probe: async (_email, mxHost) => response(mxHost, 250),
      catchAllLocalPartFactory: () => "definitely-not-real-test"
    });

    assert.equal(result.status, "Catch-All");
    assert.equal(result.responseCode, 250);
    assert.equal(result.reason, "SMTP server accepted a random mailbox for the same domain");
  });

  it("retries failed SMTP probes before returning a result", async () => {
    let calls = 0;

    const result = await verifySmtpAddress("user@example.com", mxRecords, {
      retries: 1,
      probe: async (_email, mxHost) => {
        calls += 1;
        if (calls === 1) {
          throw new Error("connection failed");
        }

        return response(mxHost, 550);
      }
    });

    assert.equal(calls, 2);
    assert.equal(result.status, "Bounce");
    assert.equal(result.attempts, 2);
  });

  it("falls back to Abstract API when all SMTP retries fail", async () => {
    const result = await verifySmtpAddress("user@example.com", mxRecords, {
      retries: 1,
      probe: async () => {
        throw new Error("connection failed");
      },
      enableAbstractFallback: true,
      fallbackVerifier: async (email, smtpFailure) => ({
        email,
        status: "Valid",
        mxHost: null,
        responseCode: null,
        responseMessage: null,
        errorCode: null,
        reason: `Fallback after ${smtpFailure.errorCode}`,
        attempts: smtpFailure.attempts,
        provider: "Abstract API",
        providerWarning: null
      })
    });

    assert.equal(result.status, "Valid");
    assert.equal(result.provider, "Abstract API");
    assert.equal(result.attempts, 2);
  });

  it("returns Unknown/Error when all retries fail and fallback is disabled", async () => {
    const result = await verifySmtpAddress("user@example.com", mxRecords, {
      retries: 1,
      enableAbstractFallback: false,
      probe: async () => {
        throw new Error("connection failed");
      }
    });

    assert.equal(result.status, "Unknown/Error");
    assert.equal(result.errorCode, "SMTP_CONNECTION_ERROR");
    assert.equal(result.provider, "SMTP");
    assert.equal(result.attempts, 2);
  });

  it("returns Bounce when no MX records are provided", async () => {
    const result = await verifySmtpAddress("user@example.com", []);

    assert.equal(result.status, "Bounce");
    assert.equal(result.errorCode, "NO_MX_RECORDS");
    assert.equal(result.attempts, 0);
  });

  it("returns bulk SMTP verification totals", async () => {
    const result = await verifySmtpAddressesBulk(
      [
        { email: "valid@example.com", mxRecords },
        { email: "missing@example.com", mxRecords },
        { email: "graylisted@example.com", mxRecords }
      ],
      {
        probe: async (email, mxHost) => {
          if (email === "missing@example.com") {
            return response(mxHost, 550);
          }

          if (email === "graylisted@example.com") {
            return response(mxHost, 451);
          }

          return response(mxHost, email.startsWith("definitely-not-real-") ? 550 : 250);
        },
        catchAllLocalPartFactory: () => "definitely-not-real-test"
      }
    );

    assert.equal(result.total, 3);
    assert.equal(result.valid, 1);
    assert.equal(result.bounce, 1);
    assert.equal(result.catchAll, 0);
    assert.equal(result.unknown, 1);
  });
});

const response = (mxHost: string, responseCode: number): SmtpProbeResponse => ({
  mxHost,
  responseCode,
  responseMessage: `${responseCode} test response`
});
