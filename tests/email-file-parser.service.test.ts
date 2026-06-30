import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseCsvEmails, parseEmailUpload, parseTextEmails } from "../src/services/email-file-parser.service.js";

describe("email file parser service", () => {
  it("parses text uploads and removes duplicate email addresses case-insensitively", () => {
    const emails = parseTextEmails(Buffer.from("one@example.com\nONE@example.com\n two@example.com \n\n"));

    assert.deepEqual(emails, ["one@example.com", "two@example.com"]);
  });

  it("parses CSV uploads from an in-memory buffer and skips common headers", async () => {
    const emails = await parseCsvEmails(Buffer.from("EmailAddress\none@example.com\ntwo@example.com\n"));

    assert.deepEqual(emails, ["one@example.com", "two@example.com"]);
  });

  it("parses an uploaded CSV file into structured upload metadata", async () => {
    const parsed = await parseEmailUpload({
      originalName: "emails.csv",
      mimeType: "text/csv",
      size: 42,
      buffer: Buffer.from("email\nuser@example.com\n")
    });

    assert.equal(parsed.fileName, "emails.csv");
    assert.equal(parsed.fileType, "csv");
    assert.deepEqual(parsed.emails, ["user@example.com"]);
  });
});
