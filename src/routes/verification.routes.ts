import { Router } from "express";

import {
  createVerificationJobController,
  downloadVerificationJobCsvController,
  getVerificationJobController,
  parseUploadController
} from "../controllers/verification.controller.js";
import { emailUpload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/async-handler.js";

export const verificationRouter = Router();

verificationRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    response.json({
      message: "Verification routes are ready. Upload and job endpoints will be implemented in the next phase."
    });
  })
);

verificationRouter.post(
  "/uploads",
  emailUpload.single("file"),
  asyncHandler(parseUploadController)
);

verificationRouter.post(
  "/jobs",
  emailUpload.single("file"),
  asyncHandler(createVerificationJobController)
);

verificationRouter.get("/jobs/:jobId", asyncHandler(getVerificationJobController));

verificationRouter.get("/jobs/:jobId/results.csv", asyncHandler(downloadVerificationJobCsvController));
