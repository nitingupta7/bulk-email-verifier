import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  verifyDomainMxRecords,
  verifyEmailDomainMxRecords,
  verifyEmailDomainMxRecordsBulk
} from "../src/services/dns-mx-verification.service.js";

describe("DNS MX verification service", () => {
  it("returns Valid with sorted MX records when DNS publishes MX records", async () => {
    const result = await verifyDomainMxRecords("Example.COM.", {
      resolveMx: async () => [
        { exchange: "mx2.example.com", priority: 20 },
        { exchange: "mx1.example.com", priority: 10 }
      ]
    });

    assert.equal(result.domain, "example.com");
    assert.equal(result.status, "Valid");
    assert.equal(result.hasMxRecords, true);
    assert.deepEqual(result.mxRecords, [
      { exchange: "mx1.example.com", priority: 10 },
      { exchange: "mx2.example.com", priority: 20 }
    ]);
    assert.equal(result.errorCode, null);
    assert.equal(result.reason, null);
  });

  it("returns Bounce when DNS returns no MX records", async () => {
    const result = await verifyDomainMxRecords("example.com", {
      resolveMx: async () => []
    });

    assert.equal(result.status, "Bounce");
    assert.equal(result.hasMxRecords, false);
    assert.equal(result.errorCode, "NO_MX_RECORDS");
  });

  it("returns Bounce when the domain is not found", async () => {
    const result = await verifyDomainMxRecords("missing.example", {
      resolveMx: async () => {
        throw Object.assign(new Error("not found"), { code: "ENOTFOUND" });
      }
    });

    assert.equal(result.status, "Bounce");
    assert.equal(result.errorCode, "DOMAIN_NOT_FOUND");
  });

  it("returns Unknown/Error when the lookup times out", async () => {
    const result = await verifyDomainMxRecords("slow.example", {
      timeoutMs: 1,
      resolveMx: () => new Promise((resolve) => setTimeout(() => resolve([]), 50))
    });

    assert.equal(result.status, "Unknown/Error");
    assert.equal(result.errorCode, "DNS_TIMEOUT");
  });

  it("returns Unknown/Error for unexpected DNS failures", async () => {
    const result = await verifyDomainMxRecords("servfail.example", {
      resolveMx: async () => {
        throw Object.assign(new Error("server failed"), { code: "ESERVFAIL" });
      }
    });

    assert.equal(result.status, "Unknown/Error");
    assert.equal(result.errorCode, "DNS_ERROR");
  });

  it("verifies MX records for an email address", async () => {
    const result = await verifyEmailDomainMxRecords("user@example.com", {
      resolveMx: async () => [{ exchange: "mx.example.com", priority: 10 }]
    });

    assert.equal(result.email, "user@example.com");
    assert.equal(result.domain, "example.com");
    assert.equal(result.status, "Valid");
  });

  it("returns bulk DNS verification totals", async () => {
    const result = await verifyEmailDomainMxRecordsBulk(["valid@example.com", "missing@missing.example"], {
      resolveMx: async (domain) => {
        if (domain === "missing.example") {
          throw Object.assign(new Error("not found"), { code: "ENOTFOUND" });
        }

        return [{ exchange: "mx.example.com", priority: 10 }];
      }
    });

    assert.equal(result.total, 2);
    assert.equal(result.valid, 1);
    assert.equal(result.bounce, 1);
    assert.equal(result.unknown, 0);
    assert.equal(result.results.length, 2);
  });
});
