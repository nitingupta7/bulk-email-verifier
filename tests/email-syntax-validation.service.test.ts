import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  validateEmailSyntax,
  validateEmailSyntaxBulk
} from "../src/services/email-syntax-validation.service.js";

describe("email syntax validation service", () => {
  it("accepts common valid email addresses", () => {
    const validEmails = [
      "user@example.com",
      "first.last@example.co.in",
      "name+tag@example.com",
      "user_name@example.dev"
    ];

    for (const email of validEmails) {
      const result = validateEmailSyntax(email);
      assert.equal(result.isValid, true);
      assert.equal(result.email, email);
      assert.equal(result.errorCode, null);
      assert.equal(result.reason, null);
      assert.equal(result.normalizedEmail, email);
    }
  });

  it("normalizes by trimming whitespace and lowercasing only the domain", () => {
    const result = validateEmailSyntax("  User.Name@Example.COM  ");

    assert.equal(result.isValid, true);
    assert.equal(result.email, "  User.Name@Example.COM  ");
    assert.equal(result.normalizedEmail, "User.Name@example.com");
  });

  it("rejects invalid email addresses with structured errors", () => {
    const invalidCases = [
      { email: "", errorCode: "EMPTY_EMAIL" },
      { email: "plainaddress", errorCode: "MISSING_AT_SYMBOL" },
      { email: "user@", errorCode: "INVALID_DOMAIN" },
      { email: "@example.com", errorCode: "INVALID_LOCAL_PART" },
      { email: "user@@example.com", errorCode: "MULTIPLE_AT_SYMBOLS" },
      { email: "double..dot@example.com", errorCode: "INVALID_LOCAL_PART" },
      { email: ".leading@example.com", errorCode: "INVALID_LOCAL_PART" },
      { email: "trailing.@example.com", errorCode: "INVALID_LOCAL_PART" },
      { email: "user@domain..com", errorCode: "INVALID_DOMAIN" },
      { email: "user@-example.com", errorCode: "INVALID_DOMAIN" },
      { email: "user@example-.com", errorCode: "INVALID_DOMAIN" }
    ] as const;

    for (const { email, errorCode } of invalidCases) {
      const result = validateEmailSyntax(email);
      assert.equal(result.isValid, false);
      assert.equal(result.normalizedEmail, null);
      assert.equal(result.errorCode, errorCode);
      assert.equal(typeof result.reason, "string");
    }
  });

  it("rejects email addresses over 254 characters", () => {
    const longEmail = `${"a".repeat(245)}@example.com`;
    const result = validateEmailSyntax(longEmail);

    assert.equal(result.isValid, false);
    assert.equal(result.errorCode, "EMAIL_TOO_LONG");
  });

  it("rejects local parts over 64 characters", () => {
    const result = validateEmailSyntax(`${"a".repeat(65)}@example.com`);

    assert.equal(result.isValid, false);
    assert.equal(result.errorCode, "LOCAL_PART_TOO_LONG");
  });

  it("returns bulk validation totals and per-email results", () => {
    const result = validateEmailSyntaxBulk(["user@example.com", "plainaddress", "name+tag@example.com"]);

    assert.equal(result.total, 3);
    assert.equal(result.valid, 2);
    assert.equal(result.invalid, 1);
    assert.equal(result.results.length, 3);
    assert.deepEqual(
      result.results.map((item) => item.isValid),
      [true, false, true]
    );
  });
});
