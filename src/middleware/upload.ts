import multer from "multer";

import { config } from "../config/index.js";
import { validateUploadMetadata } from "../services/upload-validation.service.js";
import { ApiError } from "../utils/api-error.js";

export const emailUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.uploadMaxBytes,
    files: 1
  },
  fileFilter: (_request, file, callback) => {
    try {
      validateUploadMetadata({
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: 1
      });
      callback(null, true);
    } catch (error) {
      callback(error as ApiError);
    }
  }
});
