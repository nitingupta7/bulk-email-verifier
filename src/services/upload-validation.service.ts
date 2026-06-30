import { extname } from "node:path";

import { config } from "../config/index.js";
import { ApiError } from "../utils/api-error.js";
import type { SupportedUploadExtension, UploadedEmailFile } from "../types/upload.js";

const allowedExtensions = new Set<SupportedUploadExtension>(["csv", "txt"]);
const allowedMimeTypes = new Set([
  "text/csv",
  "application/csv",
  "text/plain",
  "application/vnd.ms-excel",
  "application/octet-stream"
]);

export const getUploadExtension = (fileName: string): SupportedUploadExtension => {
  const extension = extname(fileName).replace(".", "").toLowerCase();

  if (!allowedExtensions.has(extension as SupportedUploadExtension)) {
    throw new ApiError(400, "UNSUPPORTED_FILE_TYPE", "Only .csv and .txt files are supported");
  }

  return extension as SupportedUploadExtension;
};

export const validateUploadMetadata = (
  file: Pick<UploadedEmailFile, "originalName" | "mimeType" | "size">
): SupportedUploadExtension => {
  const extension = getUploadExtension(file.originalName);

  if (file.size <= 0) {
    throw new ApiError(400, "EMPTY_UPLOAD", "Uploaded file is empty");
  }

  if (file.size > config.uploadMaxBytes) {
    throw new ApiError(413, "FILE_TOO_LARGE", `Uploaded file must be ${config.uploadMaxBytes} bytes or smaller`);
  }

  if (file.mimeType && !allowedMimeTypes.has(file.mimeType)) {
    throw new ApiError(400, "UNSUPPORTED_FILE_TYPE", "Uploaded file MIME type is not supported");
  }

  return extension;
};
