import type { Request, Response } from "express";

import { parseEmailUpload, toUploadedEmailFile } from "../services/email-file-parser.service.js";
import { validateEmailSyntaxBulk } from "../services/email-syntax-validation.service.js";
import { createVerificationJob, getVerificationJob, getVerificationJobCsv } from "../services/verification-job.service.js";
import { ApiError } from "../utils/api-error.js";

export const parseUploadController = async (request: Request, response: Response): Promise<void> => {
  if (!request.file) {
    throw new ApiError(400, "FILE_REQUIRED", "Upload a .csv or .txt file using the file field");
  }

  const parsedUpload = await parseEmailUpload(toUploadedEmailFile(request.file));
  const syntaxValidation = validateEmailSyntaxBulk(parsedUpload.emails);

  response.status(200).json({
    fileName: parsedUpload.fileName,
    fileType: parsedUpload.fileType,
    totalEmails: parsedUpload.emails.length,
    emails: parsedUpload.emails,
    syntaxValidation
  });
};

export const createVerificationJobController = async (request: Request, response: Response): Promise<void> => {
  if (!request.file) {
    throw new ApiError(400, "FILE_REQUIRED", "Upload a .csv or .txt file using the file field");
  }

  const parsedUpload = await parseEmailUpload(toUploadedEmailFile(request.file));
  const concurrency = parseConcurrency(request.body?.concurrency);
  const job = createVerificationJob(parsedUpload, { concurrency });

  response.status(202).json(job);
};

export const getVerificationJobController = async (request: Request, response: Response): Promise<void> => {
  response.status(200).header("Cache-Control", "no-store").json(getVerificationJob(request.params.jobId ?? ""));
};

export const downloadVerificationJobCsvController = async (request: Request, response: Response): Promise<void> => {
  const csv = getVerificationJobCsv(request.params.jobId ?? "");

  response
    .status(200)
    .header("Cache-Control", "no-store")
    .header("Content-Type", "text/csv; charset=utf-8")
    .header("Content-Disposition", 'attachment; filename="verification-results.csv"')
    .send(csv);
};

const parseConcurrency = (value: unknown): number | undefined => {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};
