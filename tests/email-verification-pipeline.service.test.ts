import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { verifyEmails } from "../src/services/email-verification-pipeline.service.js";
import type { EmailDomainMxVerificationResult, MxRecord } from "../src/types/dns-verification.js";
import type { SmtpVerificationResult } from "../src/types/smtp-verification.js";
import type { VerificationProgressSnapshot } from "../src/types/verification-pipeline.js";

const mxRecords: MxRecord[] = [{ exchange: "mx.example.com", priority: 10 }];

describe("email verification pipeline", () => {
  it("short-circuits invalid syntax as Bounce without DNS or SMTP calls", async () => {
    let dnsCalls = 0;
    let smtpCalls = 0;

    const result = await verifyEmails(["bad-email"], {
      verifyDns: async () => {
        dnsCalls += 1;
        return validDns("bad-email");
      },
      verifySmtp: async () => {
        smtpCalls += 1;
        return validSmtp("bad-email");
      }
    });

    assert.equal(result.total, 1);
    assert.equal(result.bounce, 1);
    assert.equal(result.results[0]?.status, "Bounce");
    assert.equal(result.results[0]?.dns, null);
    assert.equal(result.results[0]?.smtp, null);
    assert.equal(dnsCalls, 0);
    assert.equal(smtpCalls, 0);
  });

  it("preserves input order while processing concurrently", async () => {
    const emails = ["first@example.com", "second@example.com", "third@example.com"];

    const result = await verifyEmails(emails, {
      concurrency: 3,
      verifyDns: async (email) => {
        await delay(email.startsWith("first") ? 20 : 1);
        return validDns(email);
      },
      verifySmtp: async (email) => validSmtp(email)
    });

    assert.deepEqual(
      result.results.map((item) => item.email),
      emails
    );
    assert.equal(result.valid, 3);
  });

  it("caps concurrent work with p-limit", async () => {
    let active = 0;
    let maxActive = 0;

    const result = await verifyEmails(
      ["a@example.com", "b@example.com", "c@example.com", "d@example.com", "e@example.com"],
      {
        concurrency: 2,
        verifyDns: async (email) => {
          active += 1;
          maxActive = Math.max(maxActive, active);
          await delay(10);
          active -= 1;
          return validDns(email);
        },
        verifySmtp: async (email) => validSmtp(email)
      }
    );

    assert.equal(result.total, 5);
    assert.equal(maxActive, 2);
  });

  it("emits progress snapshots after each completed email", async () => {
    const snapshots: VerificationProgressSnapshot[] = [];

    const result = await verifyEmails(["valid@example.com", "missing@example.com", "graylisted@example.com"], {
      concurrency: 1,
      onProgress: (snapshot) => snapshots.push(snapshot),
      verifyDns: async (email) => validDns(email),
      verifySmtp: async (email) => {
        if (email === "missing@example.com") {
          return bounceSmtp(email);
        }

        if (email === "graylisted@example.com") {
          return unknownSmtp(email);
        }

        return validSmtp(email);
      }
    });

    assert.equal(result.valid, 1);
    assert.equal(result.bounce, 1);
    assert.equal(result.unknown, 1);
    assert.equal(snapshots.length, 3);
    assert.deepEqual(
      snapshots.map((snapshot) => snapshot.completed),
      [1, 2, 3]
    );
    assert.equal(snapshots[2]?.pending, 0);
    assert.equal(snapshots[2]?.valid, 1);
    assert.equal(snapshots[2]?.bounce, 1);
    assert.equal(snapshots[2]?.unknown, 1);
    assert.equal(snapshots[2]?.stage, "complete");
  });

  it("maps DNS Bounce and Unknown/Error results without calling SMTP", async () => {
    let smtpCalls = 0;

    const result = await verifyEmails(["missing@example.com", "timeout@example.com"], {
      verifyDns: async (email) => {
        if (email === "missing@example.com") {
          return {
            ...validDns(email),
            status: "Bounce",
            hasMxRecords: false,
            mxRecords: [],
            errorCode: "DOMAIN_NOT_FOUND",
            reason: "Domain was not found in DNS"
          };
        }

        return {
          ...validDns(email),
          status: "Unknown/Error",
          hasMxRecords: false,
          mxRecords: [],
          errorCode: "DNS_TIMEOUT",
          reason: "DNS MX lookup timed out"
        };
      },
      verifySmtp: async (email) => {
        smtpCalls += 1;
        return validSmtp(email);
      }
    });

    assert.equal(result.bounce, 1);
    assert.equal(result.unknown, 1);
    assert.equal(smtpCalls, 0);
  });
});

const validDns = (email: string): EmailDomainMxVerificationResult => ({
  email,
  domain: email.split("@")[1] ?? "",
  status: "Valid",
  hasMxRecords: true,
  mxRecords,
  errorCode: null,
  reason: null
});

const validSmtp = (email: string): SmtpVerificationResult => ({
  email,
  status: "Valid",
  mxHost: "mx.example.com",
  responseCode: 250,
  responseMessage: "250 OK",
  errorCode: null,
  reason: null,
  attempts: 1
});

const bounceSmtp = (email: string): SmtpVerificationResult => ({
  ...validSmtp(email),
  status: "Bounce",
  responseCode: 550,
  responseMessage: "550 mailbox unavailable",
  errorCode: "SMTP_REJECTED",
  reason: "SMTP server rejected the recipient address"
});

const unknownSmtp = (email: string): SmtpVerificationResult => ({
  ...validSmtp(email),
  status: "Unknown/Error",
  responseCode: 451,
  responseMessage: "451 temporary failure",
  errorCode: "SMTP_TEMPORARY_FAILURE",
  reason: "SMTP server returned an inconclusive response"
});

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
