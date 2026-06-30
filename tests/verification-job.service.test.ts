import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createVerificationJob,
  getVerificationJob,
  getVerificationJobCsv
} from "../src/services/verification-job.service.js";

describe("verification job service", () => {
  it("runs invalid syntax jobs to completion and generates assignment CSV columns", async () => {
    const job = createVerificationJob({
      fileName: "invalids.txt",
      fileType: "txt",
      emails: ["bad-email", "user@@example.com", "user@"]
    });

    const completed = await waitForJob(job.id);
    const csv = getVerificationJobCsv(job.id);

    assert.equal(completed.status, "completed");
    assert.equal(completed.progress.total, 3);
    assert.equal(completed.progress.completed, 3);
    assert.equal(completed.progress.bounce, 3);
    assert.deepEqual(
      completed.results.map((result) => result.stage),
      ["Syntax", "Syntax", "Syntax"]
    );
    assert.deepEqual(
      completed.results.map((result) => result.domain),
      ["-", "-", "-"]
    );
    assert.equal(csv, "EmailAddress,Status\nbad-email,Bounce\nuser@@example.com,Bounce\nuser@,Bounce");
  });
});

const waitForJob = async (jobId: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const job = getVerificationJob(jobId);

    if (job.status === "completed" || job.status === "failed") {
      return job;
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  throw new Error("Timed out waiting for verification job");
};
