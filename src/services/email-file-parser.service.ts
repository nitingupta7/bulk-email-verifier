import { Readable } from "node:stream";

import csvParser from "csv-parser";

import type { ParsedEmailUpload, UploadedEmailFile } from "../types/upload.js";
import { ApiError } from "../utils/api-error.js";
import { getUploadExtension, validateUploadMetadata } from "./upload-validation.service.js";

const knownHeaderNames = new Set(["email", "emailaddress", "email_address", "address"]);

export const parseEmailUpload = async (file: UploadedEmailFile): Promise<ParsedEmailUpload> => {
  const fileType = validateUploadMetadata(file);
  const emails = fileType === "csv" ? await parseCsvEmails(file.buffer) : parseTextEmails(file.buffer);

  if (emails.length === 0) {
    throw new ApiError(400, "NO_EMAILS_FOUND", "Uploaded file does not contain any email addresses");
  }

  return {
    fileName: file.originalName,
    fileType,
    emails
  };
};

export const parseTextEmails = (buffer: Buffer): string[] => {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  return dedupePreservingOrder(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  );
};

export const parseCsvEmails = (buffer: Buffer): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const emails: string[] = [];

    Readable.from(buffer)
      .pipe(csvParser({ headers: false, skipLines: 0, strict: false }))
      .on("data", (row: Record<string, string>) => {
        const firstValue = normalizeCsvCell(row["0"]);

        if (!firstValue || knownHeaderNames.has(firstValue.toLowerCase().replace(/\s+/g, ""))) {
          return;
        }

        emails.push(firstValue);
      })
      .on("error", () => {
        reject(new ApiError(400, "CSV_PARSE_ERROR", "Unable to parse uploaded CSV file"));
      })
      .on("end", () => {
        resolve(dedupePreservingOrder(emails));
      });
  });
};

export const toUploadedEmailFile = (file: Express.Multer.File): UploadedEmailFile => {
  if (!file.buffer) {
    throw new ApiError(400, "INVALID_UPLOAD", "Uploaded file was not available in memory");
  }

  getUploadExtension(file.originalname);

  return {
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    buffer: file.buffer
  };
};

const normalizeCsvCell = (value: string | undefined): string => {
  return (value ?? "").trim();
};

const dedupePreservingOrder = (values: string[]): string[] => {
  const seen = new Set<string>();
  const uniqueValues: string[] = [];

  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueValues.push(value);
  }

  return uniqueValues;
};
